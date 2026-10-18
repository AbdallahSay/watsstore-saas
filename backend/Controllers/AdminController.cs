using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenGenerator _jwt;
        private readonly IConfiguration _config;

        public AdminController(AppDbContext db, IJwtTokenGenerator jwt, IConfiguration config)
        {
            _db = db;
            _jwt = jwt;
            _config = config;
        }

        private bool IsAdminAuthorized()
        {
            // 1. Check JWT Identity & Role Claims
            if (User?.Identity?.IsAuthenticated == true)
            {
                if (User.IsInRole("Admin") ||
                    User.HasClaim(c => c.Type == "role" && c.Value == "Admin") ||
                    User.HasClaim(c => c.Type == ClaimTypes.Role && c.Value == "Admin") ||
                    User.HasClaim(c => c.Type == "isAdmin" && c.Value == "true"))
                {
                    return true;
                }

                var adminEmail = _config["AdminSettings:Email"] ?? "abdallahsay10@gmail.com";
                if (User.HasClaim(c => (c.Type == "email" || c.Type == ClaimTypes.Email) &&
                    string.Equals(c.Value, adminEmail, StringComparison.OrdinalIgnoreCase)))
                {
                    return true;
                }
            }

            // 2. Check X-Admin-Key header fallback
            if (Request.Headers.TryGetValue("X-Admin-Key", out var headerKey) && !string.IsNullOrWhiteSpace(headerKey))
            {
                var secretKey = _config["AdminSettings:SecretKey"] ?? "WatsStore_SuperAdmin_SecretKey_2026_Secure!";
                if (string.Equals(headerKey.ToString(), secretKey, StringComparison.Ordinal))
                {
                    return true;
                }
            }

            return false;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginRequest request)
        {
            var adminEmail = _config["AdminSettings:Email"] ?? "abdallahsay10@gmail.com";
            var adminPassword = _config["AdminSettings:Password"] ?? "Admin@WatsStore2026!";
            var secretKey = _config["AdminSettings:SecretKey"] ?? "WatsStore_SuperAdmin_SecretKey_2026_Secure!";

            bool isValid = false;

            // Method 1: Master Secret Key
            if (!string.IsNullOrWhiteSpace(request.SecretKey) && 
                string.Equals(request.SecretKey.Trim(), secretKey, StringComparison.Ordinal))
            {
                isValid = true;
            }
            // Method 2: Admin Email + Password
            else if (!string.IsNullOrWhiteSpace(request.Email) && !string.IsNullOrWhiteSpace(request.Password))
            {
                var cleanEmail = request.Email.Trim().ToLowerInvariant();
                if (string.Equals(cleanEmail, adminEmail.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase))
                {
                    // Check database persistent hash first
                    var dbAdmin = await _db.SuperAdmins.FirstOrDefaultAsync(a => a.Email == cleanEmail);
                    if (dbAdmin != null && !string.IsNullOrWhiteSpace(dbAdmin.PasswordHash))
                    {
                        if (BCrypt.Net.BCrypt.Verify(request.Password.Trim(), dbAdmin.PasswordHash))
                        {
                            isValid = true;
                        }
                    }

                    // Fallback to config password
                    if (!isValid && string.Equals(request.Password.Trim(), adminPassword, StringComparison.Ordinal))
                    {
                        isValid = true;
                    }
                }
            }

            if (!isValid)
            {
                return Unauthorized(new { message = "بيانات الدخول غير صحيحة. يرجى التحقق من البريد أو المفتاح السري للإدارة." });
            }

            var token = _jwt.GenerateAdminToken(adminEmail, "مدير المنصة");

            return Ok(new AdminLoginResponse
            {
                Token = token,
                Email = adminEmail,
                Name = "مدير المنصة العام",
                Role = "Admin"
            });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] AdminChangePasswordRequest request)
        {
            if (!IsAdminAuthorized())
                return Unauthorized(new { message = "غير مصرح لك بتغيير كلمة مرور الإدارة العليا" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var adminEmail = _config["AdminSettings:Email"] ?? "abdallahsay10@gmail.com";
            var configPassword = _config["AdminSettings:Password"] ?? "Admin@WatsStore2026!";
            var secretKey = _config["AdminSettings:SecretKey"] ?? "WatsStore_SuperAdmin_SecretKey_2026_Secure!";

            var dbAdmin = await _db.SuperAdmins.FirstOrDefaultAsync(a => a.Email == adminEmail);
            if (dbAdmin == null)
            {
                dbAdmin = new SuperAdmin
                {
                    Id = Guid.NewGuid(),
                    Email = adminEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(configPassword),
                    UpdatedAt = DateTime.UtcNow
                };
                _db.SuperAdmins.Add(dbAdmin);
                await _db.SaveChangesAsync();
            }

            // Verify current password
            bool isCurrentValid = false;
            if (!string.IsNullOrWhiteSpace(dbAdmin.PasswordHash) &&
                BCrypt.Net.BCrypt.Verify(request.CurrentPassword.Trim(), dbAdmin.PasswordHash))
            {
                isCurrentValid = true;
            }
            else if (string.Equals(request.CurrentPassword.Trim(), configPassword, StringComparison.Ordinal) ||
                     string.Equals(request.CurrentPassword.Trim(), secretKey, StringComparison.Ordinal))
            {
                isCurrentValid = true;
            }

            if (!isCurrentValid)
            {
                return BadRequest(new { message = "كلمة المرور الحالية غير صحيحة. يرجى إعادة المحاولة." });
            }

            // Hash new password and update
            dbAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
            dbAdmin.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "تم تغيير كلمة مرور المسؤول العام بنجاح وتحديثها في النظام." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] AdminForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var cleanEmail = request.Email.Trim().ToLowerInvariant();
            var targetAdminEmail = (_config["AdminSettings:Email"] ?? "abdallahsay10@gmail.com").ToLowerInvariant();

            if (!string.Equals(cleanEmail, targetAdminEmail, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "البريد الإلكتروني المدخل غير مسجل كمسؤول عام في منصة WatsStore." });
            }

            var dbAdmin = await _db.SuperAdmins.FirstOrDefaultAsync(a => a.Email == cleanEmail);
            if (dbAdmin == null)
            {
                var defaultPassword = _config["AdminSettings:Password"] ?? "Admin@WatsStore2026!";
                dbAdmin = new SuperAdmin
                {
                    Id = Guid.NewGuid(),
                    Email = cleanEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword),
                    UpdatedAt = DateTime.UtcNow
                };
                _db.SuperAdmins.Add(dbAdmin);
            }

            // Generate temporary secure 6-digit PIN reset token
            var pin = new Random().Next(100000, 999999).ToString();
            var resetToken = $"WATS-{pin}";

            dbAdmin.ResetToken = resetToken;
            dbAdmin.ResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(15);
            dbAdmin.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new AdminForgotPasswordResponse
            {
                Message = $"تم إنشاء رمز استعادة كلمة المرور بنجاح للمسؤول العام ({targetAdminEmail}). صالح لمدة 15 دقيقة.",
                ResetToken = resetToken,
                ExpiresInMinutes = 15
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] AdminResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var cleanEmail = request.Email.Trim().ToLowerInvariant();
            var targetAdminEmail = (_config["AdminSettings:Email"] ?? "abdallahsay10@gmail.com").ToLowerInvariant();

            if (!string.Equals(cleanEmail, targetAdminEmail, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "البريد الإلكتروني المدخل غير مطابق لحساب المسؤول العام." });
            }

            var dbAdmin = await _db.SuperAdmins.FirstOrDefaultAsync(a => a.Email == cleanEmail);
            if (dbAdmin == null || string.IsNullOrWhiteSpace(dbAdmin.ResetToken))
            {
                return BadRequest(new { message = "لم يتم العثور على طلب استعادة نشط لهذا الحساب. يرجى طلب رمز استعادة جديد." });
            }

            if (!string.Equals(dbAdmin.ResetToken.Trim(), request.ResetToken.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "رمز استعادة كلمة المرور غير صحيح. يرجى التحقق وإعادة الإدخال." });
            }

            if (dbAdmin.ResetTokenExpiresAt.HasValue && dbAdmin.ResetTokenExpiresAt.Value < DateTime.UtcNow)
            {
                return BadRequest(new { message = "انتهت صلاحية رمز استعادة كلمة المرور (المدة القصوى 15 دقيقة). يرجى طلب رمز جديد." });
            }

            // Update to new password
            dbAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
            dbAdmin.ResetToken = null;
            dbAdmin.ResetTokenExpiresAt = null;
            dbAdmin.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "تمت إعادة تعيين كلمة مرور المسؤول العام بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة."
            });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetPlatformStats()
        {
            if (!IsAdminAuthorized())
                return Unauthorized(new { message = "غير مصرح لك بالوصول إلى لوحة الإدارة العليا" });

            var totalStores = await _db.Stores.CountAsync();
            var activeStores = await _db.Stores.CountAsync(s => s.IsActive);
            var suspendedStores = totalStores - activeStores;

            var totalOrders = await _db.WhatsAppOrders.CountAsync();
            var totalRevenue = await _db.WhatsAppOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;
            var totalProducts = await _db.Products.CountAsync();
            var totalReviews = await _db.StoreReviews.CountAsync();
            var totalViews = await _db.Stores.SumAsync(s => (long?)s.ViewCount) ?? 0L;

            var recentStores = await _db.Stores
                .AsNoTracking()
                .OrderByDescending(s => s.CreatedAt)
                .Take(5)
                .Select(s => new AdminStoreSummaryDto
                {
                    Id = s.Id,
                    StoreName = s.StoreName,
                    OwnerName = s.OwnerName,
                    Email = s.Email,
                    WhatsAppNumber = s.WhatsAppNumber,
                    Slug = s.Slug,
                    PublicCode = s.PublicCode,
                    Subdomain = $"{s.Slug}.watsstore.com",
                    BusinessCategory = s.BusinessCategory,
                    City = s.City,
                    PlanType = s.PlanType,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    OrdersCount = s.Orders.Count,
                    ProductsCount = s.Products.Count,
                    TotalRevenue = s.Orders.Sum(o => o.TotalAmount),
                    ViewCount = s.ViewCount
                })
                .ToListAsync();

            var topStores = await _db.Stores
                .AsNoTracking()
                .OrderByDescending(s => s.Orders.Count)
                .ThenByDescending(s => s.ViewCount)
                .Take(5)
                .Select(s => new AdminStoreSummaryDto
                {
                    Id = s.Id,
                    StoreName = s.StoreName,
                    OwnerName = s.OwnerName,
                    Email = s.Email,
                    WhatsAppNumber = s.WhatsAppNumber,
                    Slug = s.Slug,
                    PublicCode = s.PublicCode,
                    Subdomain = $"{s.Slug}.watsstore.com",
                    BusinessCategory = s.BusinessCategory,
                    City = s.City,
                    PlanType = s.PlanType,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    OrdersCount = s.Orders.Count,
                    ProductsCount = s.Products.Count,
                    TotalRevenue = s.Orders.Sum(o => o.TotalAmount),
                    ViewCount = s.ViewCount
                })
                .ToListAsync();

            return Ok(new AdminPlatformStatsDto
            {
                TotalStores = totalStores,
                ActiveStores = activeStores,
                SuspendedStores = suspendedStores,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                TotalProducts = totalProducts,
                TotalReviews = totalReviews,
                TotalViews = totalViews,
                RecentStores = recentStores,
                TopStores = topStores
            });
        }

        [HttpGet("stores")]
        public async Task<IActionResult> GetAllStores([FromQuery] string? search, [FromQuery] string? status)
        {
            if (!IsAdminAuthorized())
                return Unauthorized(new { message = "غير مصرح لك بالوصول إلى لوحة الإدارة العليا" });

            var query = _db.Stores.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(s =>
                    s.StoreName.ToLower().Contains(term) ||
                    s.Slug.ToLower().Contains(term) ||
                    s.Email.ToLower().Contains(term) ||
                    s.OwnerName.ToLower().Contains(term) ||
                    s.WhatsAppNumber.Contains(term) ||
                    s.City.ToLower().Contains(term) ||
                    s.BusinessCategory.ToLower().Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (string.Equals(status, "active", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(s => s.IsActive);
                else if (string.Equals(status, "suspended", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(s => !s.IsActive);
            }

            var stores = await query
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new AdminStoreSummaryDto
                {
                    Id = s.Id,
                    StoreName = s.StoreName,
                    OwnerName = s.OwnerName,
                    Email = s.Email,
                    WhatsAppNumber = s.WhatsAppNumber,
                    Slug = s.Slug,
                    PublicCode = s.PublicCode,
                    Subdomain = $"{s.Slug}.watsstore.com",
                    BusinessCategory = s.BusinessCategory,
                    City = s.City,
                    PlanType = s.PlanType,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    OrdersCount = s.Orders.Count,
                    ProductsCount = s.Products.Count,
                    TotalRevenue = s.Orders.Sum(o => o.TotalAmount),
                    ViewCount = s.ViewCount
                })
                .ToListAsync();

            return Ok(stores);
        }

        [HttpPatch("stores/{id}/toggle-status")]
        public async Task<IActionResult> ToggleStoreStatus(Guid id)
        {
            if (!IsAdminAuthorized())
                return Unauthorized(new { message = "غير مصرح لك بالوصول إلى لوحة الإدارة العليا" });

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id);
            if (store == null)
            {
                return NotFound(new { message = "المتجر المطلوب غير موجود في المنصة" });
            }

            store.IsActive = !store.IsActive;
            await _db.SaveChangesAsync();

            return Ok(new ToggleStoreStatusResponse
            {
                Id = store.Id,
                IsActive = store.IsActive,
                Message = store.IsActive
                    ? $"تم إعادة تفعيل متجر '{store.StoreName}' بنجاح"
                    : $"تم إيقاف متجر '{store.StoreName}' مؤقتاً"
            });
        }

        [HttpDelete("stores/{id}")]
        public async Task<IActionResult> DeleteStore(Guid id)
        {
            if (!IsAdminAuthorized())
                return Unauthorized(new { message = "غير مصرح لك بالوصول إلى لوحة الإدارة العليا" });

            var store = await _db.Stores
                .Include(s => s.Products)
                .Include(s => s.Categories)
                .Include(s => s.Orders)
                .Include(s => s.Reviews)
                .Include(s => s.Coupons)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (store == null)
            {
                return NotFound(new { message = "المتجر المطلوب غير موجود في المنصة" });
            }

            var storeName = store.StoreName;

            // Remove associated children entities to ensure clean deletion
            if (store.Products.Any()) _db.Products.RemoveRange(store.Products);
            if (store.Categories.Any()) _db.Categories.RemoveRange(store.Categories);
            if (store.Orders.Any()) _db.WhatsAppOrders.RemoveRange(store.Orders);
            if (store.Reviews.Any()) _db.StoreReviews.RemoveRange(store.Reviews);
            if (store.Coupons.Any()) _db.StoreCoupons.RemoveRange(store.Coupons);

            _db.Stores.Remove(store);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id,
                message = $"تم حذف متجر '{storeName}' وجميع بياناته المرتبطة بنجاح من المنصة."
            });
        }
    }
}
