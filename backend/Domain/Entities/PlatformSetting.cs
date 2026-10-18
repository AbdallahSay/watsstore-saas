using System;

namespace WatsStore.Api.Domain.Entities
{
    public class PlatformSetting
    {
        public int Id { get; set; } = 1;

        // Pro Plan Configuration
        public decimal ProMonthlyPrice { get; set; } = 299m;
        public decimal ProAnnualPrice { get; set; } = 2499m;
        public int ProProductLimit { get; set; } = 100;
        public int ProCouponLimit { get; set; } = 15;
        public int ProAiLimit { get; set; } = 15;

        // VIP Plan Configuration
        public decimal VipMonthlyPrice { get; set; } = 599m;
        public decimal VipAnnualPrice { get; set; } = 4999m;
        public int VipProductLimit { get; set; } = 999999;
        public int VipCouponLimit { get; set; } = 999999;
        public int VipAiLimit { get; set; } = 150;

        // Psychological Marketing & Urgency Hooks
        public bool IsLaunchDiscountBannerActive { get; set; } = true;
        public string LaunchDiscountText { get; set; } = "🔥 عروض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!";

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
