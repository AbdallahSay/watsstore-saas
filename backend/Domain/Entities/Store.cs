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
        public string PlanType { get; set; } = "Free"; // Free, Pro, VIP
        public bool IsActive { get; set; } = true;
        public DateTime? SubscriptionEndsAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Category> Categories { get; set; } = new List<Category>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<WhatsAppOrder> Orders { get; set; } = new List<WhatsAppOrder>();
    }
}
