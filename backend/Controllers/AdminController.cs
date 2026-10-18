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

                var adminEmail = _config["AdminSettings:Email"] ?? "admin@watsstore.com";
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
        public IActionResult Login([FromBody] AdminLoginRequest request)
        {
            var adminEmail = _config["AdminSettings:Email"] ?? "admin@watsstore.com";
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
                if (string.Equals(cleanEmail, adminEmail.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(request.Password.Trim(), adminPassword, StringComparison.Ordinal))
                {
                    isValid = true;
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
