using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class CreateOrderRequest
    {
        [Required(ErrorMessage = "اسم العميل مطلوب")]
        public string CustomerName { get; set; } = string.Empty;

        [Required(ErrorMessage = "رقم هاتف العميل مطلوب")]
        public string CustomerPhone { get; set; } = string.Empty;

        [Required(ErrorMessage = "عنوان التوصيل مطلوب")]
        public string CustomerAddress { get; set; } = string.Empty;

        public string? CustomerNotes { get; set; }
        public string? PaymentMethod { get; set; } = "الدفع عند الاستلام";

        [Required]
        [MinLength(1, ErrorMessage = "يجب اختيار منتج واحد على الأقل")]
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
        public Guid OrderId { get; set; }
        public int OrderNumber { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal TotalAmount { get; set; }
        public string WhatsAppRedirectUrl { get; set; } = string.Empty;
        public string FormattedMessage { get; set; } = string.Empty;
    }

    public class SavedOrderItemRecord
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }
        public Dictionary<string, string>? SelectedVariants { get; set; }
    }
}
