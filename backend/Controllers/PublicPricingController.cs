using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/public/pricing")]
    [EnableRateLimiting("public-policy")]
    public class PublicPricingController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PublicPricingController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetPricing()
        {
            var settings = await _db.PlatformSettings.AsNoTracking().FirstOrDefaultAsync(p => p.Id == 1);
            if (settings == null)
            {
                return Ok(new PlatformSettingsDto
                {
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
                });
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
                UpdatedAt = settings.UpdatedAt
            });
        }
    }
}
