using System;

namespace WatsStore.Api.Domain.Entities
{
    public class SubscriptionRequest
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public Guid StoreId { get; set; }
        public Store? Store { get; set; }

        public string StoreName { get; set; } = string.Empty;
        public string MerchantEmail { get; set; } = string.Empty;
        public string MerchantPhone { get; set; } = string.Empty;

        public string PlanType { get; set; } = "Pro"; // Pro, VIP
        public string BillingCycle { get; set; } = "Monthly"; // Monthly, Annual
        public decimal Amount { get; set; }

        public string PaymentMethod { get; set; } = "VodafoneCash"; // VodafoneCash, InstaPay, OnlineCard
        public string? DestinationAccount { get; set; } // The target wallet/account selected by merchant
        public string? SenderIdentifier { get; set; } // Sender phone or InstaPay address
        public string TransactionId { get; set; } = string.Empty;
        public string? Notes { get; set; }

        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Cancelled
        public string? AdminNotes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
    }
}
