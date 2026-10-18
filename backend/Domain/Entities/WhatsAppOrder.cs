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
        public string ItemsJson { get; set; } = "[]";
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Store? Store { get; set; }
    }
}
