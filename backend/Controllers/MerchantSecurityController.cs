using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Email;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Merchant")]
    [Route("api/merchant/security")]
    public class MerchantSecurityController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenGenerator _jwt;
        private readonly IEmailSender? _emailSender;
        private readonly ILogger<MerchantSecurityController> _logger;

        public MerchantSecurityController(
            AppDbContext db,
            IJwtTokenGenerator jwt,
            ILogger<MerchantSecurityController> logger,
            IEmailSender? emailSender = null)
        {
            _db = db;
            _jwt = jwt;
            _logger = logger;
            _emailSender = emailSender;
        }

        private Guid TenantId => Guid.TryParse(User.FindFirst("storeId")?.Value, out var id) ? id : throw new UnauthorizedAccessException();

        [HttpGet("status")]
        public async Task<IActionResult> GetSecurityStatus()
        {
            var store = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(s => s.Id == TenantId);
            if (store == null) return NotFound();

            return Ok(new MerchantSecurityStatusResponse
            {
                Email = store.Email,
                EmailVerified = store.EmailVerified,
                EmailVerifiedAt = store.EmailVerifiedAt,
                EmailVerificationStatus = store.EmailVerificationStatus,
                WhatsAppNumber = store.WhatsAppNumber,
                PhoneVerified = store.PhoneVerified,
                PhoneVerifiedAt = store.PhoneVerifiedAt,
                PasswordChangedAt = store.PasswordChangedAt,
                CanPublishStore = store.EmailVerified
            });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangeMerchantPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == TenantId && s.IsActive);
            if (store == null) return NotFound();

            bool isCurrentValid = false;
            try
            {
                isCurrentValid = !string.IsNullOrWhiteSpace(store.PasswordHash) &&
                                 BCrypt.Net.BCrypt.Verify(request.CurrentPassword, store.PasswordHash);
            }
            catch
            {
                isCurrentValid = false;
            }

            if (!isCurrentValid)
            {
                return BadRequest(new { message = "كلمة المرور الحالية غير صحيحة." });
            }

            store.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            store.PasswordChangedAt = DateTime.UtcNow;
            store.SecurityStamp = Guid.NewGuid().ToString("N");
            await _db.SaveChangesAsync();

            if (_emailSender != null)
            {
                try
                {
                    var (subject, html, plain) = EmailTemplates.PasswordChangedNotification(store.StoreName, store.OwnerName, DateTime.UtcNow);
                    await _emailSender.SendAsync(store.Email, store.OwnerName, subject, html, plain);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send password changed notification to {Domain}", store.Email.Split('@').LastOrDefault());
                }
            }

            // Return fresh token for current session
            var newToken = _jwt.GenerateToken(store);
            return Ok(new { success = true, token = newToken, message = "تم تغيير كلمة المرور بنجاح." });
        }

        [HttpPost("revoke-other-sessions")]
        public async Task<IActionResult> RevokeOtherSessions()
        {
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == TenantId && s.IsActive);
            if (store == null) return NotFound();

            store.SecurityStamp = Guid.NewGuid().ToString("N");
            await _db.SaveChangesAsync();

            var newToken = _jwt.GenerateToken(store);
            return Ok(new { success = true, token = newToken, message = "تم إنهاء الجلسات الأخرى بنجاح وتحديث جلسة متجرك الحالية." });
        }
    }
}
