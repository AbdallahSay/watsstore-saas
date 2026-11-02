using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class CreateOrderRequest
    {
        [StringLength(80, MinimumLength = 16)]
        public string? IdempotencyKey { get; set; }
        [RegularExpression("^(online|whatsapp)$")]
        public string Channel { get; set; } = "whatsapp";
        [StringLength(60)] public string? ShippingZoneId { get; set; }
        [StringLength(100)] public string? Governorate { get; set; }
        [StringLength(100)] public string? TransferReference { get; set; }
        [Required(ErrorMessage = "اسم العميل مطلوب")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "اسم العميل يجب أن يتراوح بين حرفين و 100 حرف")]
        public string CustomerName { get; set; } = string.Empty;

        [Required(ErrorMessage = "رقم هاتف العميل مطلوب")]
        [StringLength(20, MinimumLength = 10, ErrorMessage = "رقم هاتف العميل غير صحيح")]
        public string CustomerPhone { get; set; } = string.Empty;

        [Required(ErrorMessage = "عنوان التوصيل مطلوب")]
        [StringLength(300, MinimumLength = 5, ErrorMessage = "عنوان التوصيل يجب أن يكون بين 5 و 300 حرف")]
        public string CustomerAddress { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "ملاحظات الطلب يجب ألا تتجاوز 500 حرف")]
        public string? CustomerNotes { get; set; }

        [StringLength(80, ErrorMessage = "طريقة الدفع غير صالحة")]
        public string? PaymentMethod { get; set; } = "الدفع عند الاستلام";

        [StringLength(50, ErrorMessage = "رمز كود الخصم غير صالح")]
        public string? CouponCode { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "يجب اختيار منتج واحد على الأقل")]
        [MaxLength(100)]
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        [Required]
        public Guid ProductId { get; set; }

        [Range(1, 1000, ErrorMessage = "الكمية يجب أن تكون 1 على الأقل")]
        public int Quantity { get; set; } = 1;

        public Dictionary<string, string>? SelectedVariants { get; set; }
    }

    public class CreateOrderResponse
    {
        public List<PublicOrderItemSnapshot> Items { get; set; } = new();
        public string PaymentMethod { get; set; } = "";
        public string? ShippingSummary { get; set; }
        public string Currency { get; set; } = "ج.م";
        public DateTime CreatedAt { get; set; }
        public string? TrackingToken { get; set; }
        public string Status { get; set; } = "Pending";
        public string PaymentStatus { get; set; } = "Unpaid";
        public Guid OrderId { get; set; }
        public int OrderNumber { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; } = 0.00m;
        public string? CouponCode { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal TotalAmount { get; set; }
        public string WhatsAppRedirectUrl { get; set; } = string.Empty;
        public string FormattedMessage { get; set; } = string.Empty;
    }

    public class SavedOrderItemRecord
    {
        public string? ProductSlug { get; set; }
        public string? ImageUrl { get; set; }
        public string? StockKey { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }
        public Dictionary<string, string>? SelectedVariants { get; set; }
    }

    public class PublicOrderItemSnapshot
    {
        public string ProductName { get; set; } = "";
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }
        public Dictionary<string, string>? SelectedVariants { get; set; }
        public static PublicOrderItemSnapshot From(SavedOrderItemRecord item) => new()
        { ProductName = item.ProductName, UnitPrice = item.UnitPrice, Quantity = item.Quantity,
          Subtotal = item.Subtotal, SelectedVariants = item.SelectedVariants };
    }
}
