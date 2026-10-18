using System;
using System.Collections.Generic;

namespace WatsStore.Api.Domain.Entities
{
    public class Store
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string OwnerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string StoreName { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string PublicCode { get; set; } = string.Empty;
        public string WhatsAppNumber { get; set; } = string.Empty;
        public string BusinessCategory { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string? AddressDetails { get; set; }
        public string? LogoUrl { get; set; }
        public string? CoverUrl { get; set; }
        public string ThemeColor { get; set; } = "#10B981";
        public string Currency { get; set; } = "ج.م";
        public decimal DeliveryFee { get; set; } = 0.00m;
        public string? SeoTitle { get; set; }
        public string? SeoDescription { get; set; }
        public string? MetaPixelId { get; set; }
        public string? VodafoneCashNumber { get; set; }
        public string? InstaPayAddress { get; set; }
        public string PlanType { get; set; } = "Free"; // Free, Pro, VIP
        public bool IsActive { get; set; } = true;
        public int ViewCount { get; set; } = 0;
        public int AiGenerationsCount { get; set; } = 0;
        public DateTime? AiQuotaResetDate { get; set; }
        public DateTime? SubscriptionEndsAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Category> Categories { get; set; } = new List<Category>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<WhatsAppOrder> Orders { get; set; } = new List<WhatsAppOrder>();
        public ICollection<StoreReview> Reviews { get; set; } = new List<StoreReview>();
        public ICollection<StoreCoupon> Coupons { get; set; } = new List<StoreCoupon>();

        public int GetAiGenerationsLimit()
        {
            if (string.Equals(PlanType, "VIP", StringComparison.OrdinalIgnoreCase))
                return 150;
            if (string.Equals(PlanType, "Pro", StringComparison.OrdinalIgnoreCase))
                return 15;
            return 0; // Free plan has 0 AI quota (strictly locked)
        }

        public void CheckAndResetMonthlyAiQuota()
        {
            var now = DateTime.UtcNow;
            if (!AiQuotaResetDate.HasValue || now >= AiQuotaResetDate.Value.AddMonths(1))
            {
                AiGenerationsCount = 0;
                AiQuotaResetDate = now;
            }
        }

        public DateTime GetEffectiveTrialOrSubscriptionEndsAt()
        {
            if (SubscriptionEndsAt.HasValue)
                return SubscriptionEndsAt.Value;

            // Default 14-day trial from CreatedAt
            return CreatedAt.AddDays(14);
        }

        public bool IsTrialExpired()
        {
            if (string.Equals(PlanType, "Pro", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(PlanType, "VIP", StringComparison.OrdinalIgnoreCase))
            {
                if (SubscriptionEndsAt.HasValue)
                {
                    return DateTime.UtcNow > SubscriptionEndsAt.Value;
                }
                return false;
            }

            // Free plan is strictly a 14-Day Free Trial
            var expiry = GetEffectiveTrialOrSubscriptionEndsAt();
            return DateTime.UtcNow > expiry;
        }

        public int GetRemainingTrialDays()
        {
            if (string.Equals(PlanType, "Pro", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(PlanType, "VIP", StringComparison.OrdinalIgnoreCase))
            {
                return 999;
            }

            var expiry = GetEffectiveTrialOrSubscriptionEndsAt();
            var diff = expiry - DateTime.UtcNow;
            return Math.Max(0, (int)Math.Ceiling(diff.TotalDays));
        }
    }
}
