using System;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class PlatformSettingsDto
    {
        // Pro Plan
        public decimal ProMonthlyPrice { get; set; } = 299m;
        public decimal ProAnnualPrice { get; set; } = 2499m;
        public int ProProductLimit { get; set; } = 100;
        public int ProCouponLimit { get; set; } = 15;
        public int ProAiLimit { get; set; } = 15;

        // VIP Plan
        public decimal VipMonthlyPrice { get; set; } = 599m;
        public decimal VipAnnualPrice { get; set; } = 4999m;
        public int VipProductLimit { get; set; } = 999999;
        public int VipCouponLimit { get; set; } = 999999;
        public int VipAiLimit { get; set; } = 150;

        // Psychological Marketing & Urgency Hooks
        public bool IsLaunchDiscountBannerActive { get; set; } = true;
        public string LaunchDiscountText { get; set; } = "🔥 عروض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!";

        // Platform Local Payment Wallets
        public string VodafoneCashWallet { get; set; } = "01027150123";
        public string InstaPayHandle { get; set; } = "watsstore@instapay";

        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdatePlatformSettingsRequest
    {
        [Range(0, 100000, ErrorMessage = "السعر الشهري لباقة Pro غير صالح")]
        public decimal ProMonthlyPrice { get; set; } = 299m;

        [Range(0, 1000000, ErrorMessage = "السعر السنوي لباقة Pro غير صالح")]
        public decimal ProAnnualPrice { get; set; } = 2499m;

        [Range(1, 100000, ErrorMessage = "حد منتجات Pro غير صالح")]
        public int ProProductLimit { get; set; } = 100;

        [Range(1, 1000, ErrorMessage = "حد كوبونات Pro غير صالح")]
        public int ProCouponLimit { get; set; } = 15;

        [Range(0, 10000, ErrorMessage = "رصيد الذكاء الاصطناعي لباقة Pro غير صالح")]
        public int ProAiLimit { get; set; } = 15;

        [Range(0, 100000, ErrorMessage = "السعر الشهري لباقة VIP غير صالح")]
        public decimal VipMonthlyPrice { get; set; } = 599m;

        [Range(0, 1000000, ErrorMessage = "السعر السنوي لباقة VIP غير صالح")]
        public decimal VipAnnualPrice { get; set; } = 4999m;

        [Range(1, 1000000, ErrorMessage = "حد منتجات VIP غير صالح")]
        public int VipProductLimit { get; set; } = 999999;

        [Range(1, 1000000, ErrorMessage = "حد كوبونات VIP غير صالح")]
        public int VipCouponLimit { get; set; } = 999999;

        [Range(0, 10000, ErrorMessage = "رصيد الذكاء الاصطناعي لباقة VIP غير صالح")]
        public int VipAiLimit { get; set; } = 150;

        public bool IsLaunchDiscountBannerActive { get; set; } = true;

        [StringLength(500, ErrorMessage = "نص البنر التسويقي طويل جداً")]
        public string? LaunchDiscountText { get; set; }

        [StringLength(50, ErrorMessage = "رقم محفظة فودافون كاش غير صالح")]
        public string? VodafoneCashWallet { get; set; }

        [StringLength(100, ErrorMessage = "عنوان إنستاباي غير صالح")]
        public string? InstaPayHandle { get; set; }
    }
}
