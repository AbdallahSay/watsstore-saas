using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.Domain.Entities;

public class CommerceSettings
{
    public Guid StoreId { get; set; }
    [MaxLength(20)] public string PublishedTheme { get; set; } = "editorial";
    [MaxLength(20)] public string DraftTheme { get; set; } = "editorial";
    [MaxLength(20)] public string PreviousTheme { get; set; } = "editorial";
    [MaxLength(20)] public string CheckoutMode { get; set; } = "whatsapp";
    public bool CashOnDelivery { get; set; } = true;
    public bool InstaPay { get; set; }
    public bool MobileWallet { get; set; }
    public string ShippingZonesJson { get; set; } = "[]";
    public Store? Store { get; set; }
}

// A missing row means inventory is not tracked. An existing row is always enforced.
public class InventoryStock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    [MaxLength(64)] public string VariantKey { get; set; } = "";
    public string SelectedVariantsJson { get; set; } = "{}";
    public int Quantity { get; set; }
    public int LowStockThreshold { get; set; } = 5;
}

public class OrderHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid StoreId { get; set; }
    [MaxLength(30)] public string Status { get; set; } = "Pending";
    [MaxLength(500)] public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class InventoryAdjustment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    [MaxLength(64)] public string VariantKey { get; set; } = "";
    public int Adjustment { get; set; }
    [MaxLength(500)] public string Reason { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
