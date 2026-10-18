using System;

namespace WatsStore.Api.Domain.Entities
{
    public class StoreCoupon
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid StoreId { get; set; }
        public string Code { get; set; } = string.Empty; // e.g. "SUMMER10", uppercase
        public string DiscountType { get; set; } = "Percentage"; // "Percentage" or "FixedAmount"
        public decimal DiscountValue { get; set; } // e.g. 10 (10%) or 50 (50 EGP)
        public DateTime? ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public int TimesUsed { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Store? Store { get; set; }
    }
}
