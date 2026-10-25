using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/public/stores")]
    [EnableRateLimiting("public-policy")]
    public class PublicStoreController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PublicStoreController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPublicStores([FromQuery] string? city, [FromQuery] string? category)
        {
            return await GetDirectory(city, category);
        }

        [HttpGet("{slug}")]
        public async Task<IActionResult> GetStoreBySlug(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug))
                return BadRequest(new { message = "معرف المتجر مطلوب" });

            var normalizedSlug = slug.Trim().ToLowerInvariant();

            var store = await _db.Stores
                .AsNoTracking()
                .Include(s => s.Categories.Where(c => c.IsActive).OrderBy(c => c.SortOrder))
                .Include(s => s.Products.Where(p => p.IsAvailable).OrderBy(p => p.SortOrder).ThenByDescending(p => p.CreatedAt))
                .AsSplitQuery() // ⚡ Bolt Optimization: Prevent Cartesian Explosion by splitting query
                .FirstOrDefaultAsync(s => s.Slug == normalizedSlug && s.IsActive);

            if (store == null)
                return NotFound(new { message = "المتجر غير موجود أو تم إيقافه" });

            // Increment Store Profile Visits
            try
            {
                await _db.Database.ExecuteSqlRawAsync(
                    "UPDATE Stores SET ViewCount = ViewCount + 1 WHERE Id = {0}", store.Id);
            }
            catch { }

            // Dual Meta Pixel Rule: Only expose Merchant Pixel if PlanType is NOT Free
            string? merchantMetaPixelId = null;
            if (!string.Equals(store.PlanType, "Free", StringComparison.OrdinalIgnoreCase))
            {
                merchantMetaPixelId = store.MetaPixelId;
            }

            // Localized fallback SEO metadata if not explicitly set
            var seoTitle = !string.IsNullOrWhiteSpace(store.SeoTitle)
                ? store.SeoTitle
                : $"{store.StoreName} | متجر ومنيو إلكتروني في {store.City}";

            var seoDescription = !string.IsNullOrWhiteSpace(store.SeoDescription)
                ? store.SeoDescription
                : $"تصفح تشكيلة ومنتجات {store.StoreName} في {store.City}. اختر منتجاتك المفضلة واطلب مباشرة عبر الواتساب بضغطة زر مع أسرع خدمة توصيل.";

            var approvedReviews = await _db.StoreReviews
                .AsNoTracking()
                .Where(r => r.StoreId == store.Id && r.IsApproved)
                .OrderByDescending(r => r.CreatedAt)
                .Take(30)
                .Select(r => new PublicReviewDto
                {
                    Id = r.Id,
                    CustomerName = r.CustomerName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            var totalReviews = await _db.StoreReviews
                .CountAsync(r => r.StoreId == store.Id && r.IsApproved);

            var averageRating = totalReviews > 0
                ? Math.Round(await _db.StoreReviews
                    .Where(r => r.StoreId == store.Id && r.IsApproved)
                    .AverageAsync(r => (double)r.Rating), 1)
                : 5.0;

            var response = new PublicStoreResponse
            {
                Id = store.Id,
                StoreName = store.StoreName,
                Slug = store.Slug,
                PublicCode = store.PublicCode,
                WhatsAppNumber = store.WhatsAppNumber,
                BusinessCategory = store.BusinessCategory,
                City = store.City,
                AddressDetails = store.AddressDetails,
                LogoUrl = store.LogoUrl,
                CoverUrl = store.CoverUrl,
                ThemeColor = store.ThemeColor,
                Currency = store.Currency,
                DeliveryFee = store.DeliveryFee,
                SeoTitle = seoTitle,
                SeoDescription = seoDescription,
                MetaPixelId = merchantMetaPixelId,
                VodafoneCashNumber = store.VodafoneCashNumber,
                InstaPayAddress = store.InstaPayAddress,
                PlanType = store.PlanType,
                IsTrialExpired = store.IsTrialExpired(),
                RemainingTrialDays = store.GetRemainingTrialDays(),
                TrialEndsAt = store.GetEffectiveTrialOrSubscriptionEndsAt(),
                AverageRating = averageRating,
                TotalReviews = totalReviews,
                Reviews = approvedReviews,
                Categories = store.Categories.Select(c => new PublicCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    SortOrder = c.SortOrder
                }).ToList(),
                Products = store.Products.Select(p => new PublicProductDto
                {
                    Id = p.Id,
                    CategoryId = p.CategoryId,
                    Name = p.Name,
                    Slug = p.Slug,
                    Description = p.Description,
                    Price = p.Price,
                    CompareAtPrice = p.CompareAtPrice,
                    ImageUrl = p.ImageUrl,
                    ImagesJson = p.ImagesJson,
                    Images = ProductImageHelper.ExtractProductImages(p.ImagesJson, p.ImageUrl),
                    VariantsJson = p.VariantsJson,
                    IsAvailable = p.IsAvailable,
                    SortOrder = p.SortOrder
                }).ToList()
            };

            return Ok(response);
        }

        [HttpPost("{slug}/reviews")]
        [EnableRateLimiting("sensitive-policy")]
        public async Task<IActionResult> SubmitReview(string slug, [FromBody] SubmitReviewRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(slug))
                return BadRequest(new { message = "معرف المتجر مطلوب" });

            var normalizedSlug = slug.Trim().ToLowerInvariant();
            var store = await _db.Stores
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Slug == normalizedSlug && s.IsActive);

            if (store == null)
                return NotFound(new { message = "المتجر غير موجود أو تم إيقافه" });

            var cleanName = Sanitizer.Sanitize(request.CustomerName, 100);
            var cleanComment = Sanitizer.Sanitize(request.Comment, 500);

            var review = new StoreReview
            {
                Id = Guid.NewGuid(),
                StoreId = store.Id,
                CustomerName = cleanName,
                Rating = Math.Clamp(request.Rating, 1, 5),
                Comment = cleanComment,
                IsApproved = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.StoreReviews.Add(review);
            await _db.SaveChangesAsync();

            return StatusCode(201, new 
            { 
                message = "شكراً لتقييمك! تم إرسال تقييمك بنجاح وسيظهر في صفحة المتجر بعد مراجعة المتجر.",
                reviewId = review.Id
            });
        }

        [HttpPost("{slug}/apply-coupon")]
        [HttpPost("{slug}/coupons/validate")]
        [EnableRateLimiting("sensitive-policy")]
        public async Task<IActionResult> ApplyCoupon(string slug, [FromBody] ApplyCouponRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(slug))
                return BadRequest(new { isValid = false, message = "معرف المتجر مطلوب" });

            var normalizedSlug = slug.Trim().ToLowerInvariant();
            var store = await _db.Stores
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Slug == normalizedSlug && s.IsActive);

            if (store == null)
                return NotFound(new { isValid = false, message = "المتجر غير موجود أو تم إيقافه" });

            if (request.CartSubtotal <= 0)
                return BadRequest(new { isValid = false, message = "سلة المشتريات فارغة أو غير صالحة" });

            var couponCode = request.Code.Trim().ToUpperInvariant();
            var coupon = await _db.StoreCoupons
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.StoreId == store.Id && c.Code == couponCode);

            if (coupon == null || !coupon.IsActive)
            {
                return BadRequest(new { isValid = false, message = "كود الخصم غير موجود أو تم إيقافه" });
            }

            if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate.Value < DateTime.UtcNow)
            {
                return BadRequest(new { isValid = false, message = "كود الخصم منتهي الصلاحية" });
            }

            if (coupon.UsageLimit.HasValue && coupon.TimesUsed >= coupon.UsageLimit.Value)
            {
                return BadRequest(new { isValid = false, message = "وصل كود الخصم للحد الأقصى لعدد مرات الاستخدام" });
            }

            decimal discountAmount = 0m;
            if (string.Equals(coupon.DiscountType, "Percentage", StringComparison.OrdinalIgnoreCase))
            {
                discountAmount = Math.Round(request.CartSubtotal * (coupon.DiscountValue / 100m), 2);
            }
            else
            {
                discountAmount = coupon.DiscountValue;
            }

            discountAmount = Math.Clamp(discountAmount, 0, request.CartSubtotal);
            var newSubtotal = request.CartSubtotal - discountAmount;

            return Ok(new ApplyCouponResponse
            {
                IsValid = true,
                Code = coupon.Code,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                DiscountAmount = discountAmount,
                NewSubtotal = newSubtotal,
                Message = $"تم تطبيق كود الخصم بنجاح! وفرت {discountAmount:N2} {store.Currency}"
            });
        }

        [HttpGet("qr/{publicCode}")]
        public async Task<IActionResult> ResolveQrCode(string publicCode)
        {
            if (string.IsNullOrWhiteSpace(publicCode) || !Regex.IsMatch(publicCode, @"^[a-zA-Z0-9]{6,20}$"))
            {
                return BadRequest(new { message = "رمز QR غير صالح" });
            }

            var store = await _db.Stores
                .AsNoTracking()
                .Where(s => s.PublicCode == publicCode && s.IsActive)
                .Select(s => new { s.Slug, s.StoreName, s.IsActive })
                .FirstOrDefaultAsync();

            if (store == null)
            {
                return NotFound(new { message = "المتجر غير موجود أو غير نشط" });
            }

            return Ok(new
            {
                canonicalSlug = store.Slug,
                storeName = store.StoreName
            });
        }

        [HttpGet("directory")]
        public async Task<IActionResult> GetDirectory([FromQuery] string? city, [FromQuery] string? category)
        {
            var query = _db.Stores
                .AsNoTracking()
                .Where(s => s.IsActive);

            if (!string.IsNullOrWhiteSpace(city))
            {
                var trimmedCity = city.Trim();
                query = query.Where(s => s.City == trimmedCity);
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                var trimmedCat = category.Trim();
                query = query.Where(s => s.BusinessCategory == trimmedCat);
            }

            var stores = await query
                .OrderByDescending(s => s.PlanType == "VIP")
                .ThenByDescending(s => s.PlanType == "Pro")
                .ThenByDescending(s => s.CreatedAt)
                .Select(s => new StoreDirectoryCardDto
                {
                    StoreName = s.StoreName,
                    Slug = s.Slug,
                    PublicCode = s.PublicCode,
                    BusinessCategory = s.BusinessCategory,
                    City = s.City,
                    LogoUrl = s.LogoUrl,
                    ThemeColor = s.ThemeColor,
                    Currency = s.Currency,
                    DeliveryFee = s.DeliveryFee,
                    ProductCount = s.Products.Count(p => p.IsAvailable)
                })
                .Take(60)
                .ToListAsync();

            return Ok(stores);
        }

        [HttpGet("sitemap-data")]
        public async Task<IActionResult> GetSitemapData()
        {
            var activeStores = await _db.Stores
                .AsNoTracking()
                .Where(s => s.IsActive)
                .Select(s => new { s.Slug, s.City, s.BusinessCategory })
                .ToListAsync();

            var response = new SitemapDataResponse
            {
                Slugs = activeStores.Select(s => s.Slug).Distinct().ToList(),
                Cities = activeStores.Select(s => s.City).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList(),
                Categories = activeStores.Select(s => s.BusinessCategory).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList()
            };

            return Ok(response);
        }
    }
}
