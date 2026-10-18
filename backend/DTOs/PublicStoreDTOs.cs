using System;
using System.Collections.Generic;

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
}
