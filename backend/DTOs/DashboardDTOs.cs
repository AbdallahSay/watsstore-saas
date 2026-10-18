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
        public string? VodafoneCashNumber { get; set; }
        public string? InstaPayAddress { get; set; }
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
        public string? VodafoneCashNumber { get; set; }
        public string? InstaPayAddress { get; set; }
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
        public string PaymentMethod { get; set; } = "الدفع عند الاستلام";
        public string ItemsJson { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class MerchantReviewDto
    {
        public Guid Id { get; set; }
        public Guid StoreId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReviewApprovalRequest
    {
        public bool IsApproved { get; set; }
    }

    public class MerchantReviewsResponse
    {
        public int TotalCount { get; set; }
        public int ApprovedCount { get; set; }
        public int PendingCount { get; set; }
        public double AverageRating { get; set; }
        public List<MerchantReviewDto> Reviews { get; set; } = new();
    }

    public class CouponDto
    {
        public Guid Id { get; set; }
        public Guid StoreId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Percentage";
        public decimal DiscountValue { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public int TimesUsed { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateCouponRequest
    {
        [Required(ErrorMessage = "كود الخصم مطلوب")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "كود الخصم يجب أن يتكون من حرفين إلى 50 حرفاً")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "نوع الخصم مطلوب")]
        public string DiscountType { get; set; } = "Percentage"; // "Percentage" or "FixedAmount"

        [Range(0.01, 1000000, ErrorMessage = "قيمة الخصم يجب أن تكون أكبر من صفر")]
        public decimal DiscountValue { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [Range(1, 1000000, ErrorMessage = "الحد الأقصى للاستخدام يجب أن يكون 1 على الأقل")]
        public int? UsageLimit { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class MerchantAnalyticsResponse
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrdersCount { get; set; }
        public decimal AverageOrderValue { get; set; }
        public int TotalProductsCount { get; set; }
        public int TotalViews { get; set; }
        public decimal ThisMonthRevenue { get; set; }
        public int ThisMonthOrdersCount { get; set; }
        public decimal LastMonthRevenue { get; set; }
        public decimal GrowthPercentage { get; set; }
        public string Currency { get; set; } = "ج.م";
        public List<DailySalesDataPoint> DailySales { get; set; } = new();
        public List<TopProductAnalyticsDto> TopProducts { get; set; } = new();
        public List<PaymentMethodStatDto> PaymentMethodsBreakdown { get; set; } = new();
    }

    public class DailySalesDataPoint
    {
        public string Date { get; set; } = string.Empty;
        public string FormattedDate { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int OrdersCount { get; set; }
    }

    public class TopProductAnalyticsDto
    {
        public Guid ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
        public int UnitsSold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class PaymentMethodStatDto
    {
        public string Method { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
        public double Percentage { get; set; }
    }

    public class GenerateDescriptionRequest
    {
        [Required(ErrorMessage = "اسم المنتج مطلوب")]
        public string ProductName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Keywords { get; set; }
    }

    public class GenerateDescriptionResponse
    {
        public string Description { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Status { get; set; } = "success";
    }
}
