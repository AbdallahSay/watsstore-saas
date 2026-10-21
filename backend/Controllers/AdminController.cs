using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
    [EnableRateLimiting("admin-policy")]
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

        private IActionResult? EnsureAdminAccess()
        {
            if (IsAdminAuthorized())
            {
                return null;
            }

            if (User?.Identity?.IsAuthenticated == true)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "غير مصرح لك. تتطلب هذه العملية صلاحيات الإدارة العليا للمنصة (Admin)." });
            }

            return Unauthorized(new { message = "يجب تسجيل الدخول كمسؤول للوصول إلى لوحة الإدارة العليا." });
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth-policy")]
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
        [EnableRateLimiting("auth-policy")]
        public async Task<IActionResult> ChangePassword([FromBody] AdminChangePasswordRequest request)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

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
        [EnableRateLimiting("auth-policy")]
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
        [EnableRateLimiting("auth-policy")]
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
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var totalStores = await _db.Stores.CountAsync();
            var activeStores = await _db.Stores.CountAsync(s => s.IsActive);
            var suspendedStores = totalStores - activeStores;

            var totalOrders = await _db.WhatsAppOrders.CountAsync();
            var totalRevenue = await _db.WhatsAppOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;
            var totalProducts = await _db.Products.CountAsync();
            var totalReviews = await _db.StoreReviews.CountAsync();
            var totalViews = await _db.Stores.SumAsync(s => (long?)s.ViewCount) ?? 0L;

            var rawRecent = await _db.Stores
                .AsNoTracking()
                .OrderByDescending(s => s.CreatedAt)
                .Take(5)
                .Select(s => new
                {
                    s.Id,
                    s.StoreName,
                    s.OwnerName,
                    s.Email,
                    s.WhatsAppNumber,
                    s.Slug,
                    s.PublicCode,
                    s.BusinessCategory,
                    s.City,
                    s.PlanType,
                    s.IsActive,
                    s.CreatedAt,
                    s.SubscriptionEndsAt,
                    OrdersCount = s.Orders.Count,
                    ProductsCount = s.Products.Count,
                    TotalRevenue = s.Orders.Sum(o => o.TotalAmount),
                    s.ViewCount
                })
                .ToListAsync();

            var recentStores = rawRecent.Select(s =>
            {
                var trial = CalculateTrial(s.PlanType, s.CreatedAt, s.SubscriptionEndsAt);
                return new AdminStoreSummaryDto
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
                    IsTrialExpired = trial.IsTrialExpired,
                    RemainingTrialDays = trial.RemainingTrialDays,
                    TrialEndsAt = trial.TrialEndsAt,
                    CreatedAt = s.CreatedAt,
                    OrdersCount = s.OrdersCount,
                    ProductsCount = s.ProductsCount,
                    TotalRevenue = s.TotalRevenue,
                    ViewCount = s.ViewCount
                };
            }).ToList();

            var rawTop = await _db.Stores
                .AsNoTracking()
                .OrderByDescending(s => s.Orders.Count)
                .ThenByDescending(s => s.ViewCount)
                .Take(5)
                .Select(s => new
                {
                    s.Id,
                    s.StoreName,
                    s.OwnerName,
                    s.Email,
                    s.WhatsAppNumber,
                    s.Slug,
                    s.PublicCode,
                    s.BusinessCategory,
                    s.City,
                    s.PlanType,
                    s.IsActive,
                    s.CreatedAt,
                    s.SubscriptionEndsAt,
                    OrdersCount = s.Orders.Count,
                    ProductsCount = s.Products.Count,
                    TotalRevenue = s.Orders.Sum(o => o.TotalAmount),
                    s.ViewCount
                })
                .ToListAsync();

            var topStores = rawTop.Select(s =>
            {
                var trial = CalculateTrial(s.PlanType, s.CreatedAt, s.SubscriptionEndsAt);
                return new AdminStoreSummaryDto
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
                    IsTrialExpired = trial.IsTrialExpired,
                    RemainingTrialDays = trial.RemainingTrialDays,
                    TrialEndsAt = trial.TrialEndsAt,
                    CreatedAt = s.CreatedAt,
                    OrdersCount = s.OrdersCount,
                    ProductsCount = s.ProductsCount,
                    TotalRevenue = s.TotalRevenue,
                    ViewCount = s.ViewCount
                };
            }).ToList();

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
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

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

            var rawStores = await query
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.StoreName,
                    s.OwnerName,
                    s.Email,
                    s.WhatsAppNumber,
                    s.Slug,
                    s.PublicCode,
                    s.BusinessCategory,
                    s.City,
                    s.PlanType,
                    s.IsActive,
                    s.CreatedAt,
                    s.SubscriptionEndsAt,
                    OrdersCount = s.Orders.Count,
                    ProductsCount = s.Products.Count,
                    TotalRevenue = s.Orders.Sum(o => o.TotalAmount),
                    s.ViewCount
                })
                .ToListAsync();

            var stores = rawStores.Select(s =>
            {
                var trial = CalculateTrial(s.PlanType, s.CreatedAt, s.SubscriptionEndsAt);
                return new AdminStoreSummaryDto
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
                    IsTrialExpired = trial.IsTrialExpired,
                    RemainingTrialDays = trial.RemainingTrialDays,
                    TrialEndsAt = trial.TrialEndsAt,
                    CreatedAt = s.CreatedAt,
                    OrdersCount = s.OrdersCount,
                    ProductsCount = s.ProductsCount,
                    TotalRevenue = s.TotalRevenue,
                    ViewCount = s.ViewCount
                };
            }).ToList();

            return Ok(stores);
        }

        [HttpPatch("stores/{id}/toggle-status")]
        public async Task<IActionResult> ToggleStoreStatus(Guid id)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

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
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var store = await _db.Stores
                .Include(s => s.Products)
                .Include(s => s.Categories)
                .Include(s => s.Orders)
                .Include(s => s.Reviews)
                .Include(s => s.Coupons)
                // ⚡ Bolt Performance Optimization: Prevent Cartesian explosion when including multiple collections
                .AsSplitQuery()
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

        [HttpPatch("stores/{id}/plan")]
        [HttpPut("stores/{id}/plan")]
        public async Task<IActionResult> UpdateStorePlan(Guid id, [FromBody] UpdateStorePlanRequest request)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id);
            if (store == null)
            {
                return NotFound(new { message = "المتجر المطلوب غير موجود في المنصة" });
            }

            var validPlans = new[] { "Free", "Pro", "VIP" };
            var matchedPlan = validPlans.FirstOrDefault(p => string.Equals(p, request.Plan?.Trim(), StringComparison.OrdinalIgnoreCase)) ?? "Free";

            store.PlanType = matchedPlan;
            store.AiGenerationsCount = 0;
            store.AiQuotaResetDate = DateTime.UtcNow;

            int durationDays = (request.DurationDays.HasValue && request.DurationDays.Value > 0)
                ? request.DurationDays.Value
                : 365;

            if (matchedPlan == "Free")
            {
                store.SubscriptionEndsAt = store.CreatedAt.AddDays(14);
            }
            else if (matchedPlan == "Pro" || matchedPlan == "VIP")
            {
                // When upgraded or renewed, set or extend subscription for specified duration
                var baseDate = (store.SubscriptionEndsAt.HasValue && store.SubscriptionEndsAt.Value > DateTime.UtcNow)
                    ? store.SubscriptionEndsAt.Value
                    : DateTime.UtcNow;
                store.SubscriptionEndsAt = baseDate.AddDays(durationDays);
            }

            await _db.SaveChangesAsync();

            return Ok(new StorePlanUpdateResponse
            {
                StoreId = store.Id,
                PlanType = store.PlanType,
                IsTrialExpired = store.IsTrialExpired(),
                RemainingTrialDays = store.GetRemainingTrialDays(),
                TrialEndsAt = store.GetEffectiveTrialOrSubscriptionEndsAt(),
                Message = $"تم تحديث باقة متجر '{store.StoreName}' إلى {store.PlanType} بنجاح"
            });
        }

        [HttpPost("stores/{id}/extend-trial")]
        public async Task<IActionResult> ExtendStoreTrial(Guid id, [FromBody] ExtendStoreTrialRequest request)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id);
            if (store == null)
            {
                return NotFound(new { message = "المتجر المطلوب غير موجود في المنصة" });
            }

            int daysToAdd = request.Days != 0 ? request.Days : 14;
            var baseDate = request.Days < 0 
                ? DateTime.UtcNow 
                : (store.SubscriptionEndsAt.HasValue && store.SubscriptionEndsAt.Value > DateTime.UtcNow
                    ? store.SubscriptionEndsAt.Value
                    : DateTime.UtcNow);

            store.SubscriptionEndsAt = baseDate.AddDays(daysToAdd);
            await _db.SaveChangesAsync();

            return Ok(new StorePlanUpdateResponse
            {
                StoreId = store.Id,
                PlanType = store.PlanType,
                IsTrialExpired = store.IsTrialExpired(),
                RemainingTrialDays = store.GetRemainingTrialDays(),
                TrialEndsAt = store.GetEffectiveTrialOrSubscriptionEndsAt(),
                Message = $"تم تمديد الفترة التجريبية لمتجر '{store.StoreName}' لمدة {daysToAdd} يوماً إضافياً بنجاح"
            });
        }

        [HttpGet("pricing")]
        public async Task<IActionResult> GetPricing()
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var settings = await _db.PlatformSettings.FirstOrDefaultAsync(p => p.Id == 1);
            if (settings == null)
            {
                settings = new PlatformSetting
                {
                    Id = 1,
                    ProMonthlyPrice = 299m,
                    ProAnnualPrice = 2499m,
                    ProProductLimit = 100,
                    ProCouponLimit = 15,
                    ProAiLimit = 15,
                    VipMonthlyPrice = 599m,
                    VipAnnualPrice = 4999m,
                    VipProductLimit = 999999,
                    VipCouponLimit = 999999,
                    VipAiLimit = 150,
                    IsLaunchDiscountBannerActive = true,
                    LaunchDiscountText = "🔥 عروض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!",
                    UpdatedAt = DateTime.UtcNow
                };
                _db.PlatformSettings.Add(settings);
                await _db.SaveChangesAsync();
            }

            return Ok(new PlatformSettingsDto
            {
                ProMonthlyPrice = settings.ProMonthlyPrice,
                ProAnnualPrice = settings.ProAnnualPrice,
                ProProductLimit = settings.ProProductLimit,
                ProCouponLimit = settings.ProCouponLimit,
                ProAiLimit = settings.ProAiLimit,
                VipMonthlyPrice = settings.VipMonthlyPrice,
                VipAnnualPrice = settings.VipAnnualPrice,
                VipProductLimit = settings.VipProductLimit,
                VipCouponLimit = settings.VipCouponLimit,
                VipAiLimit = settings.VipAiLimit,
                IsLaunchDiscountBannerActive = settings.IsLaunchDiscountBannerActive,
                LaunchDiscountText = settings.LaunchDiscountText,
                VodafoneCashWallet = string.IsNullOrWhiteSpace(settings.VodafoneCashWallet) ? "01027150123" : settings.VodafoneCashWallet,
                InstaPayHandle = string.IsNullOrWhiteSpace(settings.InstaPayHandle) ? "watsstore@instapay" : settings.InstaPayHandle,
                UpdatedAt = settings.UpdatedAt
            });
        }

        [HttpPut("pricing")]
        public async Task<IActionResult> UpdatePricing([FromBody] UpdatePlatformSettingsRequest request)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var settings = await _db.PlatformSettings.FirstOrDefaultAsync(p => p.Id == 1);
            if (settings == null)
            {
                settings = new PlatformSetting { Id = 1 };
                _db.PlatformSettings.Add(settings);
            }

            // Update Pro
            settings.ProMonthlyPrice = request.ProMonthlyPrice;
            settings.ProAnnualPrice = request.ProAnnualPrice;
            settings.ProProductLimit = request.ProProductLimit > 0 ? request.ProProductLimit : 100;
            settings.ProCouponLimit = request.ProCouponLimit > 0 ? request.ProCouponLimit : 15;
            settings.ProAiLimit = request.ProAiLimit >= 0 ? request.ProAiLimit : 15;

            // Update VIP
            settings.VipMonthlyPrice = request.VipMonthlyPrice;
            settings.VipAnnualPrice = request.VipAnnualPrice;
            settings.VipProductLimit = request.VipProductLimit > 0 ? request.VipProductLimit : 999999;
            settings.VipCouponLimit = request.VipCouponLimit > 0 ? request.VipCouponLimit : 999999;
            settings.VipAiLimit = request.VipAiLimit >= 0 ? request.VipAiLimit : 150;

            // Update Marketing Banner
            settings.IsLaunchDiscountBannerActive = request.IsLaunchDiscountBannerActive;
            if (!string.IsNullOrWhiteSpace(request.LaunchDiscountText))
            {
                settings.LaunchDiscountText = request.LaunchDiscountText.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.VodafoneCashWallet))
            {
                settings.VodafoneCashWallet = request.VodafoneCashWallet.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.InstaPayHandle))
            {
                settings.InstaPayHandle = request.InstaPayHandle.Trim();
            }

            settings.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "تم حفظ وتحديث باقات الاشتراك والأسعار بنجاح! تم تطبيق التعديلات فوراً على المنصة.",
                settings = new PlatformSettingsDto
                {
                    ProMonthlyPrice = settings.ProMonthlyPrice,
                    ProAnnualPrice = settings.ProAnnualPrice,
                    ProProductLimit = settings.ProProductLimit,
                    ProCouponLimit = settings.ProCouponLimit,
                    ProAiLimit = settings.ProAiLimit,
                    VipMonthlyPrice = settings.VipMonthlyPrice,
                    VipAnnualPrice = settings.VipAnnualPrice,
                    VipProductLimit = settings.VipProductLimit,
                    VipCouponLimit = settings.VipCouponLimit,
                    VipAiLimit = settings.VipAiLimit,
                    IsLaunchDiscountBannerActive = settings.IsLaunchDiscountBannerActive,
                    LaunchDiscountText = settings.LaunchDiscountText,
                    VodafoneCashWallet = settings.VodafoneCashWallet,
                    InstaPayHandle = settings.InstaPayHandle,
                    UpdatedAt = settings.UpdatedAt
                }
            });
        }

        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var settings = await _db.PlatformSettings.FirstOrDefaultAsync(p => p.Id == 1)
                           ?? new PlatformSetting();

            var plans = new List<PlanTierConfigDto>
            {
                new PlanTierConfigDto
                {
                    PlanType = "Free",
                    Name = "تجربة مجانية (14 يوماً)",
                    PriceMonthly = 0m,
                    PriceAnnual = 0m,
                    MaxProducts = 10,
                    MaxCoupons = 1,
                    AiGenerationsLimit = 0,
                    ExcelExportAllowed = false,
                    IsPopular = false
                },
                new PlanTierConfigDto
                {
                    PlanType = "Pro",
                    Name = "باقة المحترفين (الأكثر طلباً ⭐)",
                    PriceMonthly = settings.ProMonthlyPrice,
                    PriceAnnual = settings.ProAnnualPrice,
                    MaxProducts = settings.ProProductLimit,
                    MaxCoupons = settings.ProCouponLimit,
                    AiGenerationsLimit = settings.ProAiLimit,
                    ExcelExportAllowed = true,
                    IsPopular = true
                },
                new PlanTierConfigDto
                {
                    PlanType = "VIP",
                    Name = "كبار التجار والبراندات (VIP 👑)",
                    PriceMonthly = settings.VipMonthlyPrice,
                    PriceAnnual = settings.VipAnnualPrice,
                    MaxProducts = settings.VipProductLimit,
                    MaxCoupons = settings.VipCouponLimit,
                    AiGenerationsLimit = settings.VipAiLimit,
                    ExcelExportAllowed = true,
                    IsPopular = false
                }
            };

            return Ok(new AllPlansResponseDto
            {
                Plans = plans,
                VodafoneCashWallet = string.IsNullOrWhiteSpace(settings.VodafoneCashWallet) ? "01027150123" : settings.VodafoneCashWallet,
                InstaPayHandle = string.IsNullOrWhiteSpace(settings.InstaPayHandle) ? "watsstore@instapay" : settings.InstaPayHandle,
                UpdatedAt = settings.UpdatedAt
            });
        }

        [HttpPut("plans")]
        public async Task<IActionResult> UpdatePlans([FromBody] UpdatePlatformSettingsRequest request)
        {
            return await UpdatePricing(request);
        }

        [HttpGet("payment-gateways")]
        public async Task<IActionResult> GetPaymentGateways()
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var gateways = await _db.PaymentGateways
                .OrderBy(g => g.SortOrder)
                .ThenBy(g => g.Id)
                .ToListAsync();

            var dtos = gateways.Select(g => new PaymentGatewayDto
            {
                Id = g.Id,
                GatewayKey = g.GatewayKey,
                DisplayName = g.DisplayName,
                IsEnabled = g.IsEnabled,
                Instructions = g.Instructions,
                SortOrder = g.SortOrder,
                Accounts = g.GetAccounts().Select(a => new GatewayAccountItemDto
                {
                    AccountNumber = a.AccountNumber,
                    AccountName = a.AccountName,
                    IsActive = a.IsActive,
                    QrCodeUrl = a.QrCodeUrl
                }).ToList(),
                UpdatedAt = g.UpdatedAt
            }).ToList();

            return Ok(dtos);
        }

        [HttpPut("payment-gateways")]
        public async Task<IActionResult> UpdatePaymentGateways([FromBody] UpdatePaymentGatewaysRequest request)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            if (!ModelState.IsValid || request?.Gateways == null)
                return BadRequest(ModelState);

            var existingGateways = await _db.PaymentGateways.ToListAsync();
            var existingDict = existingGateways.ToDictionary(g => g.GatewayKey, StringComparer.OrdinalIgnoreCase);

            foreach (var reqGw in request.Gateways)
            {
                if (string.IsNullOrWhiteSpace(reqGw.GatewayKey)) continue;

                var cleanAccounts = reqGw.Accounts?
                    .Where(a => !string.IsNullOrWhiteSpace(a.AccountNumber))
                    .Select(a => new GatewayAccountItem
                    {
                        AccountNumber = a.AccountNumber.Trim(),
                        AccountName = (a.AccountName ?? string.Empty).Trim(),
                        IsActive = a.IsActive,
                        QrCodeUrl = a.QrCodeUrl
                    }).ToList() ?? new List<GatewayAccountItem>();

                if (existingDict.TryGetValue(reqGw.GatewayKey, out var gw))
                {
                    gw.DisplayName = reqGw.DisplayName.Trim();
                    gw.IsEnabled = reqGw.IsEnabled;
                    gw.Instructions = reqGw.Instructions ?? string.Empty;
                    gw.SortOrder = reqGw.SortOrder;
                    gw.SetAccounts(cleanAccounts);
                    gw.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var newGw = new PaymentGatewaySetting
                    {
                        GatewayKey = reqGw.GatewayKey.Trim(),
                        DisplayName = reqGw.DisplayName.Trim(),
                        IsEnabled = reqGw.IsEnabled,
                        Instructions = reqGw.Instructions ?? string.Empty,
                        SortOrder = reqGw.SortOrder,
                        UpdatedAt = DateTime.UtcNow
                    };
                    newGw.SetAccounts(cleanAccounts);
                    _db.PaymentGateways.Add(newGw);
                }
            }

            // Also synchronize PlatformSettings wallet/handle for backward compatibility
            var settings = await _db.PlatformSettings.FirstOrDefaultAsync(p => p.Id == 1);
            if (settings != null)
            {
                var vfGw = request.Gateways.FirstOrDefault(g => string.Equals(g.GatewayKey, "VodafoneCash", StringComparison.OrdinalIgnoreCase));
                var activeVf = vfGw?.Accounts?.FirstOrDefault(a => a.IsActive && !string.IsNullOrWhiteSpace(a.AccountNumber));
                if (activeVf != null)
                {
                    settings.VodafoneCashWallet = activeVf.AccountNumber.Trim();
                }

                var ipnGw = request.Gateways.FirstOrDefault(g => string.Equals(g.GatewayKey, "InstaPay", StringComparison.OrdinalIgnoreCase));
                var activeIpn = ipnGw?.Accounts?.FirstOrDefault(a => a.IsActive && !string.IsNullOrWhiteSpace(a.AccountNumber));
                if (activeIpn != null)
                {
                    settings.InstaPayHandle = activeIpn.AccountNumber.Trim();
                }
            }

            await _db.SaveChangesAsync();

            var gateways = await _db.PaymentGateways
                .OrderBy(g => g.SortOrder)
                .ThenBy(g => g.Id)
                .ToListAsync();

            var dtos = gateways.Select(g => new PaymentGatewayDto
            {
                Id = g.Id,
                GatewayKey = g.GatewayKey,
                DisplayName = g.DisplayName,
                IsEnabled = g.IsEnabled,
                Instructions = g.Instructions,
                SortOrder = g.SortOrder,
                Accounts = g.GetAccounts().Select(a => new GatewayAccountItemDto
                {
                    AccountNumber = a.AccountNumber,
                    AccountName = a.AccountName,
                    IsActive = a.IsActive,
                    QrCodeUrl = a.QrCodeUrl
                }).ToList(),
                UpdatedAt = g.UpdatedAt
            }).ToList();

            return Ok(new
            {
                message = "تم حفظ وتحديث إعدادات وسائل الدفع والمحافظ بنجاح",
                gateways = dtos
            });
        }

        [HttpGet("subscriptions/pending")]
        public async Task<IActionResult> GetPendingSubscriptions()
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var requests = await _db.SubscriptionRequests
                .Where(r => r.Status == "Pending")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var dtos = requests.Select(MapSubToDto).ToList();
            return Ok(dtos);
        }

        [HttpGet("subscriptions")]
        public async Task<IActionResult> GetAllSubscriptions([FromQuery] string? status)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var query = _db.SubscriptionRequests.AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status.Trim());
            }

            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var dtos = requests.Select(MapSubToDto).ToList();
            return Ok(dtos);
        }

        [HttpPatch("subscriptions/{id}/approve")]
        public async Task<IActionResult> ApproveSubscription(Guid id)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var sub = await _db.SubscriptionRequests
                .Include(r => r.Store)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (sub == null)
            {
                return NotFound(new { message = "طلب الاشتراك غير موجود" });
            }

            if (sub.Status != "Pending")
            {
                return BadRequest(new { message = $"لا يمكن اعتماد هذا الطلب لأن حالته الحالية هي '{sub.Status}' وليست قيد المراجعة." });
            }

            sub.Status = "Approved";
            sub.ReviewedAt = DateTime.UtcNow;
            sub.AdminNotes = "تمت مراجعة الحوالة واعتماد الترقية بنجاح من قبل المسؤول العام";

            if (sub.Store != null)
            {
                sub.Store.PlanType = sub.PlanType;
                sub.Store.AiGenerationsCount = 0;
                sub.Store.AiQuotaResetDate = DateTime.UtcNow;

                int daysToAdd = sub.BillingCycle == "Annual" ? 365 : 30;
                var baseDate = (sub.Store.SubscriptionEndsAt.HasValue && sub.Store.SubscriptionEndsAt.Value > DateTime.UtcNow)
                    ? sub.Store.SubscriptionEndsAt.Value
                    : DateTime.UtcNow;

                sub.Store.SubscriptionEndsAt = baseDate.AddDays(daysToAdd);
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"تم قبول الحوالة واعتماد ترقية متجر '{sub.Store?.StoreName ?? sub.StoreName}' إلى باقة {sub.PlanType} بنجاح!",
                request = MapSubToDto(sub)
            });
        }

        [HttpPatch("subscriptions/{id}/reject")]
        public async Task<IActionResult> RejectSubscription(Guid id, [FromBody] RejectSubscriptionRequest req)
        {
            var authError = EnsureAdminAccess();
            if (authError != null) return authError;

            var sub = await _db.SubscriptionRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (sub == null)
            {
                return NotFound(new { message = "طلب الاشتراك غير موجود" });
            }

            if (sub.Status != "Pending")
            {
                return BadRequest(new { message = $"لا يمكن رفض هذا الطلب لأن حالته الحالية هي '{sub.Status}' وليست قيد المراجعة." });
            }

            sub.Status = "Rejected";
            sub.ReviewedAt = DateTime.UtcNow;
            sub.AdminNotes = string.IsNullOrWhiteSpace(req?.AdminNotes) 
                ? "تعذر التأكد من صحة رقم العملية أو إيصال التحويل" 
                : req.AdminNotes.Trim();

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "تم رفض طلب الاشتراك وتسجيل الملاحظة",
                request = MapSubToDto(sub)
            });
        }

        private static SubscriptionRequestDto MapSubToDto(SubscriptionRequest r)
        {
            return new SubscriptionRequestDto
            {
                Id = r.Id,
                StoreId = r.StoreId,
                StoreName = r.StoreName,
                MerchantEmail = r.MerchantEmail,
                MerchantPhone = r.MerchantPhone,
                PlanType = r.PlanType,
                BillingCycle = r.BillingCycle,
                Amount = r.Amount,
                PaymentMethod = r.PaymentMethod,
                DestinationAccount = r.DestinationAccount,
                SenderIdentifier = r.SenderIdentifier,
                TransactionId = r.TransactionId,
                Notes = r.Notes,
                Status = r.Status,
                AdminNotes = r.AdminNotes,
                CreatedAt = r.CreatedAt,
                ReviewedAt = r.ReviewedAt
            };
        }

        private static (bool IsTrialExpired, int RemainingTrialDays, DateTime? TrialEndsAt) CalculateTrial(string planType, DateTime createdAt, DateTime? subscriptionEndsAt)
        {
            DateTime expiry = subscriptionEndsAt ?? createdAt.AddDays(14);
            bool isExpired;
            int remainingDays;
            if (string.Equals(planType, "Pro", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(planType, "VIP", StringComparison.OrdinalIgnoreCase))
            {
                isExpired = subscriptionEndsAt.HasValue && DateTime.UtcNow > subscriptionEndsAt.Value;
                remainingDays = 999;
            }
            else
            {
                isExpired = DateTime.UtcNow > expiry;
                var diff = expiry - DateTime.UtcNow;
                remainingDays = Math.Max(0, (int)Math.Ceiling(diff.TotalDays));
            }
            return (isExpired, remainingDays, expiry);
        }
    }
}
