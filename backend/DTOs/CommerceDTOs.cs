using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs;

public class ShippingZone
{
    [Required, StringLength(60)] public string Id { get; set; } = "";
    [Required, StringLength(100)] public string Governorate { get; set; } = "";
    [Required, StringLength(100)] public string Name { get; set; } = "";
    [Range(0, 100000)] public decimal Fee { get; set; }
    public bool Pickup { get; set; }
    [StringLength(150)] public string? Estimate { get; set; }
}

public class CommerceSettingsRequest
{
    [RegularExpression("^(editorial|streetwear|lifestyle|editorial-luxe|street-pulse|pure-beauty|tech-grid|fresh-market|living-space|golden-atelier|active-motion|little-joy|crafted-story|cafe-ritual|pet-haven|bloom-studio|auto-circuit|game-arena|book-gallery|optical-studio|outdoor-trail|travel-atelier|office-pro)$")] public string DraftTheme { get; set; } = "editorial-luxe";
    public string? CustomizationJson { get; set; }
    [RegularExpression("^(online|whatsapp|both)$")] public string CheckoutMode { get; set; } = "whatsapp";
    public bool CashOnDelivery { get; set; } = true;
    public bool InstaPay { get; set; }
    public bool MobileWallet { get; set; }
    [MaxLength(100)] public List<ShippingZone> ShippingZones { get; set; } = new();
}

public class OrderActionRequest
{
    [Required, RegularExpression("^(Confirmed|Preparing|Shipped|Delivered|Cancelled|Rejected)$")] public string Status { get; set; } = "";
    [StringLength(500)] public string? Note { get; set; }
}

public class VerifyPaymentRequest
{
    [Required, MinLength(3), MaxLength(500)] public string Note { get; set; } = "";
}

public class InventoryAdjustmentRequest
{
    public Dictionary<string, string> SelectedVariants { get; set; } = new();
    [Range(-1000000, 1000000)] public int Adjustment { get; set; }
    [Range(0, 1000000)] public int LowStockThreshold { get; set; } = 5;
    [Required, MinLength(3), MaxLength(500)] public string Reason { get; set; } = "";
}
