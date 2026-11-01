using System.ComponentModel.DataAnnotations;
namespace WatsStore.Api.Domain.Entities;

public class StoreNotificationSetting
{
    public Guid StoreId { get; set; }
    public bool WebPushEnabled { get; set; }
}
public class OrderPushSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreId { get; set; }
    public Guid OrderId { get; set; }
    [MaxLength(2048)] public string Endpoint { get; set; } = "";
    [MaxLength(64)] public string EndpointHash { get; set; } = "";
    [MaxLength(100)] public string P256dh { get; set; } = "";
    [MaxLength(50)] public string Auth { get; set; } = "";
    [MaxLength(64)] public string RevocationHash { get; set; } = "";
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(90);
}
public class OrderNotificationDelivery
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreId { get; set; }
    public Guid OrderId { get; set; }
    public Guid EventId { get; set; }
    public Guid SubscriptionId { get; set; }
    [MaxLength(30)] public string OrderStatus { get; set; } = "";
    [MaxLength(30)] public string State { get; set; } = "Pending";
    public int Attempts { get; set; }
    public int ManualRetries { get; set; }
    public int? LastHttpStatus { get; set; }
    public Guid? Lease { get; set; }
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
}
public class PushDeliveryAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DeliveryId { get; set; }
    public Guid StoreId { get; set; }
    public int Attempt { get; set; }
    public int? HttpStatus { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
