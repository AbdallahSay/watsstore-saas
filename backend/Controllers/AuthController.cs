using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Email;
using WatsStore.Api.Infrastructure.Security;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("auth-policy")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IEmailSender? _emailSender;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            AppDbContext db,
            IJwtTokenGenerator jwtTokenGenerator,
            ILogger<AuthController> logger,
            IEmailSender? emailSender = null)
        {
            _db = db;
            _jwtTokenGenerator = jwtTokenGenerator;
            _logger = logger;
            _emailSender = emailSender;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            // Check if email exists
            if (await _db.Stores.AnyAsync(s => s.Email == normalizedEmail))
            {
                return BadRequest(new { message = "البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر." });
            }

            // Validate Egyptian WhatsApp mobile number
            if (!SlugGenerator.IsValidEgyptianMobile(request.WhatsAppNumber))
            {
                return BadRequest(new { message = "رقم هاتف الواتساب غير صالح. يرجى إدخال رقم محمول مصري صحيح (مثال: 01012345678 أو 011/012/015)." });
            }

            var cleanOwnerName = Sanitizer.Sanitize(request.OwnerName, 100);
            var cleanStoreName = Sanitizer.Sanitize(request.StoreName, 100);
            var cleanCategory = Sanitizer.Sanitize(request.BusinessCategory, 50);
            var cleanCity = Sanitizer.Sanitize(request.City, 50);

            // Generate unique slug from StoreName
            var baseSlug = SlugGenerator.GenerateSlug(cleanStoreName);
            var slug = baseSlug;
            int counter = 1;
            while (await _db.Stores.AnyAsync(s => s.Slug == slug))
            {
                slug = $"{baseSlug}-{counter++}";
            }

            // Generate unique public code
            string publicCode;
            do
            {
                publicCode = SlugGenerator.GeneratePublicCode(10);
            } while (await _db.Stores.AnyAsync(s => s.PublicCode == publicCode));

            // Normalize WhatsApp phone
            var normalizedPhone = SlugGenerator.NormalizeEgyptianPhone(request.WhatsAppNumber);

            var store = new Store
            {
                Id = Guid.NewGuid(),
                OwnerName = cleanOwnerName,
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                StoreName = cleanStoreName,
                Slug = slug,
                PublicCode = publicCode,
                WhatsAppNumber = normalizedPhone,
                BusinessCategory = cleanCategory,
                City = cleanCity,
                ThemeColor = "#10B981",
                Currency = "ج.م",
                DeliveryFee = 0.00m,
                PlanType = "Free",
                IsActive = true,
                EmailVerified = false,
                EmailVerificationStatus = "Pending",
                SecurityStamp = Guid.NewGuid().ToString("N"),
                CreatedAt = DateTime.UtcNow,
                SeoTitle = $"{cleanStoreName} | تسوق أونلاين عبر الواتساب في {cleanCity}",
                SeoDescription = $"تصفح كتالوج ومنتجات {cleanStoreName} في {cleanCity}. اطلب مباشرة وبأفضل الأسعار عبر الواتساب مع التوصيل السريع."
            };

            // Add default category "الأكثر مبيعاً"
            var defaultCategory = new Category
            {
                StoreId = store.Id,
                Name = "الأكثر مبيعاً",
                SortOrder = 1,
                IsActive = true
            };
            store.Categories.Add(defaultCategory);

            // Generate Email Verification OTP Challenge
            var otpCode = OtpHasher.GenerateCode();
            var salt = OtpHasher.GenerateSalt();
            var challenge = new MerchantOtpChallenge
            {
                StoreId = store.Id,
                Email = normalizedEmail,
                Purpose = "EmailVerification",
                CodeHash = OtpHasher.HashCode(otpCode, salt),
                Salt = salt,
                Attempts = 0,
                MaxAttempts = 5,
                IsUsed = false,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            store.OtpChallenges.Add(challenge);

            _db.Stores.Add(store);
            await _db.SaveChangesAsync();

            // Send Verification Email
            if (_emailSender != null)
            {
                try
                {
                    var (subject, html, plain) = EmailTemplates.EmailVerificationOtp(store.StoreName, store.OwnerName, otpCode, 15);
                    await _emailSender.SendAsync(store.Email, store.OwnerName, subject, html, plain);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not send verification email to {Domain}", store.Email.Split('@').LastOrDefault());
                }
            }

            var token = _jwtTokenGenerator.GenerateToken(store);

            return Ok(new AuthResponse
            {
                Token = token,
                StoreId = store.Id,
                StoreName = store.StoreName,
                OwnerName = store.OwnerName,
                Slug = store.Slug,
                PublicCode = store.PublicCode,
                PlanType = store.PlanType,
                Email = store.Email,
                WhatsAppNumber = store.WhatsAppNumber,
                ThemeColor = store.ThemeColor,
                Currency = store.Currency,
                City = store.City,
                BusinessCategory = store.BusinessCategory,
                EmailVerified = store.EmailVerified,
                EmailVerificationStatus = store.EmailVerificationStatus,
                PhoneVerified = store.PhoneVerified
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var store = await _db.Stores
                .FirstOrDefaultAsync(s => s.Email == normalizedEmail);

            if (store == null || !BCrypt.Net.BCrypt.Verify(request.Password, store.PasswordHash))
            {
                return Unauthorized(new { message = "بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور." });
            }

            if (!store.IsActive)
            {
                return StatusCode(403, new { message = "تم تعطيل هذا الحساب. يرجى التواصل مع إدارة المنصة." });
            }

            var token = _jwtTokenGenerator.GenerateToken(store);

            return Ok(new AuthResponse
            {
                Token = token,
                StoreId = store.Id,
                StoreName = store.StoreName,
                OwnerName = store.OwnerName,
                Slug = store.Slug,
                PublicCode = store.PublicCode,
                PlanType = store.PlanType,
                Email = store.Email,
                WhatsAppNumber = store.WhatsAppNumber,
                ThemeColor = store.ThemeColor,
                Currency = store.Currency,
                City = store.City,
                BusinessCategory = store.BusinessCategory,
                EmailVerified = store.EmailVerified,
                EmailVerificationStatus = store.EmailVerificationStatus,
                PhoneVerified = store.PhoneVerified
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var genericResponse = Ok(new { message = "إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على رمز استعادة كلمة المرور." });

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Email == normalizedEmail && s.IsActive);
            if (store == null)
            {
                // Never disclose whether an email is registered
                return genericResponse;
            }

            // Check resend cooldown: 60 seconds
            var recentChallenge = await _db.MerchantOtpChallenges
                .Where(c => c.StoreId == store.Id && c.Purpose == "PasswordRecovery")
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (recentChallenge != null && DateTime.UtcNow < recentChallenge.CreatedAt.AddSeconds(60))
            {
                return genericResponse;
            }

            // Invalidate any previous unused recovery challenges
            var oldChallenges = await _db.MerchantOtpChallenges
                .Where(c => c.StoreId == store.Id && c.Purpose == "PasswordRecovery" && !c.IsUsed)
                .ToListAsync();
            foreach (var old in oldChallenges)
            {
                old.IsUsed = true;
            }

            // Generate fresh OTP
            var code = OtpHasher.GenerateCode();
            var salt = OtpHasher.GenerateSalt();
            var challenge = new MerchantOtpChallenge
            {
                StoreId = store.Id,
                Email = normalizedEmail,
                Purpose = "PasswordRecovery",
                CodeHash = OtpHasher.HashCode(code, salt),
                Salt = salt,
                Attempts = 0,
                MaxAttempts = 5,
                IsUsed = false,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            _db.MerchantOtpChallenges.Add(challenge);
            await _db.SaveChangesAsync();

            if (_emailSender != null)
            {
                try
                {
                    var (subject, html, plain) = EmailTemplates.PasswordRecoveryOtp(store.StoreName, store.OwnerName, code, 10);
                    await _emailSender.SendAsync(store.Email, store.OwnerName, subject, html, plain);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send password recovery email to {Domain}", store.Email.Split('@').LastOrDefault());
                }
            }

            return genericResponse;
        }

        [HttpPost("verify-recovery-code")]
        public async Task<IActionResult> VerifyRecoveryCode([FromBody] VerifyRecoveryCodeRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var challenge = await _db.MerchantOtpChallenges
                .Where(c => c.Email == normalizedEmail && c.Purpose == "PasswordRecovery" && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (challenge == null)
            {
                return BadRequest(new { message = "رمز التحقق غير صالح أو انتهت صلاحيته. يرجى طلب رمز جديد." });
            }

            if (challenge.IsLocked)
            {
                challenge.IsUsed = true;
                await _db.SaveChangesAsync();
                return StatusCode(429, new { message = "تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم إبطال الرمز؛ يرجى طلب رمز جديد." });
            }

            bool isValid = OtpHasher.VerifyCode(request.Code, challenge.Salt, challenge.CodeHash);
            if (!isValid)
            {
                challenge.Attempts++;
                await _db.SaveChangesAsync();
                var remaining = Math.Max(0, challenge.MaxAttempts - challenge.Attempts);
                return BadRequest(new { message = $"رمز التحقق غير صحيح. متبقي لك {remaining} محاولات." });
            }

            // Mark challenge used and issue recovery token
            challenge.IsUsed = true;
            challenge.UsedAt = DateTime.UtcNow;
            var recoveryToken = OtpHasher.GenerateRecoveryToken();
            challenge.RecoveryToken = recoveryToken;
            challenge.RecoveryTokenExpiresAt = DateTime.UtcNow.AddMinutes(15);
            await _db.SaveChangesAsync();

            return Ok(new VerifyRecoveryCodeResponse
            {
                Success = true,
                RecoveryToken = recoveryToken,
                Message = "تم التحقق من الرمز بنجاح. يمكنك الآن تعيين كلمة مرور جديدة.",
                ExpiresInMinutes = 15
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var challenge = await _db.MerchantOtpChallenges
                .Include(c => c.Store)
                .FirstOrDefaultAsync(c => c.RecoveryToken == request.RecoveryToken.Trim() && c.RecoveryTokenExpiresAt > DateTime.UtcNow);

            if (challenge == null || challenge.Store == null)
            {
                return BadRequest(new { message = "جلسة استعادة كلمة المرور غير صالحة أو انتهت مدتها. يرجى إعادة طلب رمز التحقق." });
            }

            // Invalidate recovery token immediately (single-use)
            challenge.RecoveryToken = null;
            challenge.RecoveryTokenExpiresAt = null;

            var store = challenge.Store;
            store.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            store.PasswordChangedAt = DateTime.UtcNow;
            store.SecurityStamp = Guid.NewGuid().ToString("N"); // Invalidate all prior JWT sessions
            await _db.SaveChangesAsync();

            // Notify merchant of password change
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

            return Ok(new { success = true, message = "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة." });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string? email = request.Email?.Trim().ToLowerInvariant();

            // Fallback to authenticated user claim if email is omitted
            if (string.IsNullOrWhiteSpace(email) && User.Identity?.IsAuthenticated == true)
            {
                email = User.FindFirst("email")?.Value?.Trim().ToLowerInvariant();
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "البريد الإلكتروني مطلوب لتأكيد الحساب." });
            }

            var challenge = await _db.MerchantOtpChallenges
                .Include(c => c.Store)
                .Where(c => c.Email == email && c.Purpose == "EmailVerification" && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (challenge == null || challenge.Store == null)
            {
                return BadRequest(new { message = "رمز التحقق غير صالح أو انتهت صلاحيته. يرجى طلب رمز جديد." });
            }

            if (challenge.IsLocked)
            {
                challenge.IsUsed = true;
                await _db.SaveChangesAsync();
                return StatusCode(429, new { message = "تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب رمز جديد." });
            }

            bool isValid = OtpHasher.VerifyCode(request.Code, challenge.Salt, challenge.CodeHash);
            if (!isValid)
            {
                challenge.Attempts++;
                await _db.SaveChangesAsync();
                var remaining = Math.Max(0, challenge.MaxAttempts - challenge.Attempts);
                return BadRequest(new { message = $"رمز التحقق غير صحيح. متبقي لك {remaining} محاولات." });
            }

            challenge.IsUsed = true;
            challenge.UsedAt = DateTime.UtcNow;

            var store = challenge.Store;
            store.EmailVerified = true;
            store.EmailVerifiedAt = DateTime.UtcNow;
            store.EmailVerificationStatus = "Verified";
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "تم تأكيد البريد الإلكتروني بنجاح! متجرك جاهز للنشر." });
        }

        [HttpPost("resend-email-otp")]
        public async Task<IActionResult> ResendEmailOtp([FromBody] ResendEmailOtpRequest request)
        {
            string? email = request.Email?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email) && User.Identity?.IsAuthenticated == true)
            {
                email = User.FindFirst("email")?.Value?.Trim().ToLowerInvariant();
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "البريد الإلكتروني مطلوب." });
            }

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Email == email && s.IsActive);
            if (store == null)
            {
                return BadRequest(new { message = "الحساب غير موجود." });
            }

            if (store.EmailVerified)
            {
                return BadRequest(new { message = "البريد الإلكتروني مؤكد بالفعل." });
            }

            // Cooldown check: 60 seconds
            var recent = await _db.MerchantOtpChallenges
                .Where(c => c.StoreId == store.Id && c.Purpose == "EmailVerification")
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (recent != null && DateTime.UtcNow < recent.CreatedAt.AddSeconds(60))
            {
                var waitSeconds = (int)Math.Ceiling((recent.CreatedAt.AddSeconds(60) - DateTime.UtcNow).TotalSeconds);
                return StatusCode(429, new { message = $"يرجى الانتظار {waitSeconds} ثانية قبل طلب رمز جديد.", retryAfterSeconds = waitSeconds });
            }

            // Invalidate old
            var oldChallenges = await _db.MerchantOtpChallenges
                .Where(c => c.StoreId == store.Id && c.Purpose == "EmailVerification" && !c.IsUsed)
                .ToListAsync();
            foreach (var o in oldChallenges) o.IsUsed = true;

            var code = OtpHasher.GenerateCode();
            var salt = OtpHasher.GenerateSalt();
            var challenge = new MerchantOtpChallenge
            {
                StoreId = store.Id,
                Email = email,
                Purpose = "EmailVerification",
                CodeHash = OtpHasher.HashCode(code, salt),
                Salt = salt,
                Attempts = 0,
                MaxAttempts = 5,
                IsUsed = false,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            _db.MerchantOtpChallenges.Add(challenge);
            await _db.SaveChangesAsync();

            if (_emailSender != null)
            {
                try
                {
                    var (subject, html, plain) = EmailTemplates.EmailVerificationOtp(store.StoreName, store.OwnerName, code, 15);
                    await _emailSender.SendAsync(store.Email, store.OwnerName, subject, html, plain);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send email OTP to {Domain}", store.Email.Split('@').LastOrDefault());
                }
            }

            return Ok(new { success = true, message = "تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني." });
        }

        [HttpPost("verify-phone")]
        public async Task<IActionResult> VerifyPhone()
        {
            await Task.CompletedTask;
            return StatusCode(503, new
            {
                success = false,
                status = "Unavailable",
                message = "خدمة التحقق من الهاتف عبر الرسائل النصية غير مفعلة حالياً. يمكنك متابعة استخدام متجرك وتأكيد البريد الإلكتروني."
            });
        }
    }
}
