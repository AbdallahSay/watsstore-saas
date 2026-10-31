using System;

namespace WatsStore.Api.Domain.Entities
{
    public class WhatsAppOrder
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid StoreId { get; set; }
        public int OrderNumber { get; set; } // Identity starting at 1001
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CustomerAddress { get; set; } = string.Empty;
        public string? CustomerNotes { get; set; }
        public string PaymentMethod { get; set; } = "الدفع عند الاستلام";
        public string ItemsJson { get; set; } = "[]";
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Pending";
        public string PaymentStatus { get; set; } = "Unpaid";
        public string? TransferReference { get; set; }
        public string? TrackingToken { get; set; }
        public string? IdempotencyKey { get; set; }
        public string? RequestHash { get; set; }
        public string Channel { get; set; } = "whatsapp";
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal DeliveryFee { get; set; }
        public string? CouponCode { get; set; }
        public string? ShippingSummary { get; set; }
        public bool InventoryDeducted { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Store? Store { get; set; }
    }
}
