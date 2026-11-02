using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebPush;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.Infrastructure.Data;
namespace WatsStore.Api.Infrastructure.Notifications;

public interface IOrderPushTransport
{
    Task<int> Send(OrderPushSubscription subscription, string payload, CancellationToken token);
}
public sealed class VapidPushTransport(IConfiguration config) : IOrderPushTransport
{
    public async Task<int> Send(OrderPushSubscription subscription, string payload, CancellationToken token)
    {
        if (!PushRules.ValidEndpoint(subscription.Endpoint)) return 400;
        try
        {
            // Endpoint allowlisting + no redirects prevents subscription-driven SSRF.
            using var client = new WebPushClient(new HttpClientHandler { AllowAutoRedirect = false });
            await client.SendNotificationAsync(new PushSubscription(subscription.Endpoint, subscription.P256dh, subscription.Auth), payload,
                new VapidDetails(config["WebPush:Subject"], config["WebPush:PublicKey"], config["WebPush:PrivateKey"]), token);
            return 201;
        }
        catch (WebPushException error) { return (int)error.StatusCode; }
        catch { return 0; } // Never log endpoints, auth keys or provider exception bodies.
    }
}

public sealed class PushDispatcher(AppDbContext db, IOrderPushTransport transport, IConfiguration config)
{
    public async Task<int> Run(CancellationToken token)
    {
        if (!PushRules.Enabled(config)) return 0;
        var now = DateTime.UtcNow;
        await db.OrderNotificationDeliveries.Where(x => x.State == "Sending" && x.NextAttemptAt <= now && x.Attempts >= 5).ExecuteUpdateAsync(u => u.SetProperty(x => x.State, "Uncertain"), token);
        var ids = await db.OrderNotificationDeliveries.AsNoTracking()
            .Where(x => (x.State == "Pending" || x.State == "Sending") && x.NextAttemptAt <= now && x.Attempts < 5)
            .OrderBy(x => x.NextAttemptAt).Take(5).Select(x => x.Id).ToListAsync(token);
        var processed = 0;
        foreach (var id in ids)
        {
            var lease = Guid.NewGuid();
            var claimed = await db.OrderNotificationDeliveries.Where(x => x.Id == id &&
                (x.State == "Pending" || x.State == "Sending") && x.NextAttemptAt <= now && x.Attempts < 5)
                .ExecuteUpdateAsync(u => u.SetProperty(x => x.State, "Sending").SetProperty(x => x.Lease, lease)
                    .SetProperty(x => x.NextAttemptAt, now.AddMinutes(2)).SetProperty(x => x.Attempts, x => x.Attempts + 1), token);
            if (claimed == 0) continue;
            var delivery = await db.OrderNotificationDeliveries.AsNoTracking().SingleAsync(x => x.Id == id, token);
            var sub = await db.OrderPushSubscriptions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == delivery.SubscriptionId && x.StoreId == delivery.StoreId && x.OrderId == delivery.OrderId && x.Active && x.ExpiresAt > DateTime.UtcNow, token);
            var enabled = await db.StoreNotificationSettings.AnyAsync(x => x.StoreId == delivery.StoreId && x.WebPushEnabled, token);
            var slug = await db.Stores.Where(x => x.Id == delivery.StoreId && x.IsActive).Select(x => x.Slug).SingleOrDefaultAsync(token);
            if (sub == null || !enabled || slug == null)
            {
                await db.OrderNotificationDeliveries.Where(x => x.Id == id && x.Lease == lease).ExecuteUpdateAsync(u => u.SetProperty(x => x.State, "Suppressed"), token);
                continue;
            }
            // No tracking capability, order ID, street address, phone or customer name in payload.
            var payload = JsonSerializer.Serialize(new { version = 1, eventId = delivery.Id.ToString("N"),
                status = delivery.OrderStatus, url = $"/s/{Uri.EscapeDataString(slug)}/my-orders" });
            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(token);
            deadline.CancelAfter(TimeSpan.FromSeconds(20));
            var code = await transport.Send(sub, payload, deadline.Token);
            var accepted = code is >= 200 and < 300;
            var gone = code is 404 or 410;
            var retry = code == 0 || code == 429 || code >= 500;
            var state = accepted ? "AcceptedByProvider" : gone ? "Expired" : retry && delivery.Attempts < 5 ? "Pending" : "Failed";
            await db.OrderNotificationDeliveries.Where(x => x.Id == id && x.Lease == lease).ExecuteUpdateAsync(u => u
                .SetProperty(x => x.State, state).SetProperty(x => x.LastHttpStatus, accepted || code == 0 ? (int?)null : code)
                .SetProperty(x => x.AcceptedAt, accepted ? DateTime.UtcNow : (DateTime?)null)
                .SetProperty(x => x.NextAttemptAt, DateTime.UtcNow.AddMinutes(Math.Pow(2, delivery.Attempts)))
                .SetProperty(x => x.Lease, (Guid?)null), token);
            db.PushDeliveryAttempts.Add(new PushDeliveryAttempt { DeliveryId = id, StoreId = delivery.StoreId, Attempt = delivery.Attempts, HttpStatus = accepted || code == 0 ? null : code });
            if (gone) await db.OrderPushSubscriptions.Where(x => x.Id == sub.Id).ExecuteUpdateAsync(u => u.SetProperty(x => x.Active, false), token);
            await db.SaveChangesAsync(token);
            processed++;
        }
        return processed;
    }
}
