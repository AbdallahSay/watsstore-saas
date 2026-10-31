using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.Infrastructure.Data;
namespace WatsStore.Api.Infrastructure.Notifications;

public static class NotificationOutbox
{
    // Called inside the order state transaction, before its single SaveChanges.
    public static async Task Enqueue(AppDbContext db, OrderHistory history)
    {
        if (history.Status is not ("Confirmed" or "Preparing" or "Shipped" or "Delivered" or "Cancelled" or "Rejected")) return;
        if (!await db.StoreNotificationSettings.AnyAsync(x => x.StoreId == history.StoreId && x.WebPushEnabled)) return;
        var subscriptions = await db.OrderPushSubscriptions.AsNoTracking().Where(x => x.StoreId == history.StoreId && x.OrderId == history.OrderId && x.Active && x.ExpiresAt > DateTime.UtcNow).Select(x => x.Id).ToListAsync();
        foreach (var id in subscriptions)
            db.OrderNotificationDeliveries.Add(new OrderNotificationDelivery { StoreId = history.StoreId, OrderId = history.OrderId,
                EventId = history.Id, SubscriptionId = id, OrderStatus = history.Status });
    }
}
