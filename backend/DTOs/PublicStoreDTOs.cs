using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class PublicStoreResponse
    {
        public Guid Id { get; set; }
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
        public decimal DeliveryFee { get; set; }
        public string SeoTitle { get; set; } = string.Empty;
        public string SeoDescription { get; set; } = string.Empty;
        public string? MetaPixelId { get; set; } // Null if PlanType == "Free"
        public string? VodafoneCashNumber { get; set; }
        public string? InstaPayAddress { get; set; }
        public string PlanType { get; set; } = "Free";
        public double AverageRating { get; set; } = 5.0;
        public int TotalReviews { get; set; } = 0;
        public List<PublicReviewDto> Reviews { get; set; } = new();
        public List<PublicCategoryDto> Categories { get; set; } = new();
        public List<PublicProductDto> Products { get; set; } = new();
    }

    public class PublicCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public class PublicProductDto
    {
        public Guid Id { get; set; }
        public int? CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public string? ImageUrl { get; set; }
        public string? VariantsJson { get; set; }
        public bool IsAvailable { get; set; }
        public int SortOrder { get; set; }
    }

    public class StoreDirectoryCardDto
    {
        public string StoreName { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string PublicCode { get; set; } = string.Empty;
        public string BusinessCategory { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string ThemeColor { get; set; } = "#10B981";
        public string Currency { get; set; } = "ج.م";
        public decimal DeliveryFee { get; set; }
        public int ProductCount { get; set; }
    }

    public class SitemapDataResponse
    {
        public List<string> Slugs { get; set; } = new();
        public List<string> Cities { get; set; } = new();
        public List<string> Categories { get; set; } = new();
    }

    public class PublicReviewDto
    {
        public Guid Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class SubmitReviewRequest
    {
        [Required(ErrorMessage = "اسم العميل مطلوب")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "اسم العميل يجب أن يكون بين حرفين و 100 حرف")]
        public string CustomerName { get; set; } = string.Empty;

        [Range(1, 5, ErrorMessage = "التقييم يجب أن يكون بين 1 و 5 نجوم")]
        public int Rating { get; set; } = 5;

        [Required(ErrorMessage = "نص التقييم مطلوب")]
        [StringLength(1000, MinimumLength = 3, ErrorMessage = "نص التقييم يجب أن يكون بين 3 و 1000 حرف")]
        public string Comment { get; set; } = string.Empty;
    }

    public class ApplyCouponRequest
    {
        [Required(ErrorMessage = "كود الخصم مطلوب")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "كود الخصم غير صالح")]
        public string Code { get; set; } = string.Empty;

        [Range(0.01, 10000000, ErrorMessage = "مجموع سلة المشتريات يجب أن يكون أكبر من صفر")]
        public decimal CartSubtotal { get; set; }
    }

    public class ApplyCouponResponse
    {
        public bool IsValid { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Percentage";
        public decimal DiscountValue { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal NewSubtotal { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
