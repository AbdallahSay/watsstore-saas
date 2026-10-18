using System;

namespace WatsStore.Api.Domain.Entities
{
    public class StoreReview
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid StoreId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; } = 5; // 1 to 5
        public string Comment { get; set; } = string.Empty;
        public bool IsApproved { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Store? Store { get; set; }
    }
}
