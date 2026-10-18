using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class DashboardSummaryResponse
    {
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public StoreProfileDto StoreInfo { get; set; } = new();
        public List<OrderDto> RecentOrders { get; set; } = new();
    }

    public class StoreProfileDto
    {
        public Guid Id { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
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
        public decimal DeliveryFee { get; set; }
        public string? SeoTitle { get; set; }
        public string? SeoDescription { get; set; }
        public string? MetaPixelId { get; set; }
        public string PlanType { get; set; } = "Free";
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateStoreSettingsRequest
    {
        [Required(ErrorMessage = "اسم المتجر مطلوب")]
        public string StoreName { get; set; } = string.Empty;

        [Required(ErrorMessage = "رقم الواتساب مطلوب")]
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
    }

    public class CategoryCreateUpdateRequest
    {
        [Required(ErrorMessage = "اسم القسم مطلوب")]
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public int ProductCount { get; set; }
    }

    public class ProductCreateUpdateRequest
    {
        [Required(ErrorMessage = "اسم المنتج مطلوب")]
        public string Name { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public string? Description { get; set; }

        [Range(0, 10000000, ErrorMessage = "السعر يجب أن يكون أكبر من أو يساوي صفر")]
        public decimal Price { get; set; }

        public decimal? CompareAtPrice { get; set; }
        public string? ImageUrl { get; set; }
        public string? VariantsJson { get; set; } // e.g. [{"name":"المقاس","options":["M","L","XL"]}]
        public bool IsAvailable { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public class ProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public string? ImageUrl { get; set; }
        public string? VariantsJson { get; set; }
        public bool IsAvailable { get; set; }
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class OrderDto
    {
        public Guid Id { get; set; }
        public int OrderNumber { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CustomerAddress { get; set; } = string.Empty;
        public string? CustomerNotes { get; set; }
        public string ItemsJson { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
