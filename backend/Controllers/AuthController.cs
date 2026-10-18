using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;

        public AuthController(AppDbContext db, IJwtTokenGenerator jwtTokenGenerator)
        {
            _db = db;
            _jwtTokenGenerator = jwtTokenGenerator;
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

            // Generate unique slug from StoreName
            var baseSlug = SlugGenerator.GenerateSlug(request.StoreName);
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
                OwnerName = request.OwnerName.Trim(),
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                StoreName = request.StoreName.Trim(),
                Slug = slug,
                PublicCode = publicCode,
                WhatsAppNumber = normalizedPhone,
                BusinessCategory = request.BusinessCategory.Trim(),
                City = request.City.Trim(),
                ThemeColor = "#10B981",
                Currency = "ج.م",
                DeliveryFee = 0.00m,
                PlanType = "Free",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SeoTitle = $"{request.StoreName.Trim()} | تسوق أونلاين عبر الواتساب في {request.City.Trim()}",
                SeoDescription = $"تصفح كتالوج ومنتجات {request.StoreName.Trim()} في {request.City.Trim()}. اطلب مباشرة وبأفضل الأسعار عبر الواتساب مع التوصيل السريع."
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

            _db.Stores.Add(store);
            await _db.SaveChangesAsync();

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
                BusinessCategory = store.BusinessCategory
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
                BusinessCategory = store.BusinessCategory
            });
        }
    }
}
