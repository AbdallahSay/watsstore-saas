using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Notifications;
namespace WatsStore.Api.Controllers;

[ApiController, Route("api/public/stores/{slug}/notifications"), EnableRateLimiting("sensitive-policy")]
public class OrderNotificationsController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet("config")]
    public async Task<IActionResult> Config(string slug)
    {
        Response.Headers.CacheControl = "no-store";
        var store = await db.Stores.AsNoTracking().SingleOrDefaultAsync(x => x.Slug == slug && x.IsActive);
        if (store == null) return NotFound();
        var enabled = PushRules.Enabled(config) && await db.StoreNotificationSettings.AnyAsync(x => x.StoreId == store.Id && x.WebPushEnabled);
        return Ok(new { enabled, publicKey = enabled ? config["WebPush:PublicKey"] : null });
    }

    [HttpPost("subscriptions")]
    public async Task<IActionResult> Subscribe(string slug, SubscribeRequest request)
    {
        if (!PushRules.Enabled(config)) return StatusCode(503, new { message = "تنبيهات الخلفية غير مفعلة حالياً. تحديثات الصفحة متاحة." });
        if (!PushRules.ValidEndpoint(request.Endpoint) || !PushRules.ValidKeys(request.P256dh, request.Auth)) return BadRequest();
        return await db.Database.CreateExecutionStrategy().ExecuteAsync<IActionResult>(async () =>
        {
            db.ChangeTracker.Clear();
            await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            var order = await db.WhatsAppOrders.AsNoTracking().Where(x => x.TrackingToken == request.TrackingToken && x.Store!.Slug == slug && x.Store.IsActive).Select(x => new { x.Id, x.StoreId }).SingleOrDefaultAsync();
            if (order == null) return NotFound();
            await db.Stores.Where(x => x.Id == order.StoreId).ExecuteUpdateAsync(u => u.SetProperty(x => x.ViewCount, x => x.ViewCount));
            if (!await db.StoreNotificationSettings.AnyAsync(x => x.StoreId == order.StoreId && x.WebPushEnabled)) return StatusCode(503);
            var endpointHash = PushRules.Hash(request.Endpoint);
            var subscription = await db.OrderPushSubscriptions.SingleOrDefaultAsync(x => x.StoreId == order.StoreId && x.OrderId == order.Id && x.EndpointHash == endpointHash);
            if (subscription == null)
            {
                if (await db.OrderPushSubscriptions.CountAsync(x => x.StoreId == order.StoreId && x.OrderId == order.Id && x.Active && x.ExpiresAt > DateTime.UtcNow) >= 5) return StatusCode(429);
                subscription = new() { StoreId = order.StoreId, OrderId = order.Id, Endpoint = request.Endpoint, EndpointHash = endpointHash };
                db.OrderPushSubscriptions.Add(subscription);
            }
            var revoke = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            subscription.P256dh = request.P256dh; subscription.Auth = request.Auth;
            subscription.RevocationHash = PushRules.Hash(revoke); subscription.Active = true; subscription.ExpiresAt = DateTime.UtcNow.AddDays(90);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            Response.Headers.CacheControl = "no-store";
            return Ok(new { subscription.Id, revokeKey = revoke, subscription.ExpiresAt });
        });
    }

    [HttpDelete("subscriptions/{id:guid}")]
    public async Task<IActionResult> Revoke(string slug, Guid id, RevokeRequest request)
    {
        var hash = PushRules.Hash(request.RevokeKey);
        var store = await db.Stores.AsNoTracking().Where(x => x.Slug == slug).Select(x => x.Id).SingleOrDefaultAsync();
        var count = await db.OrderPushSubscriptions.Where(x => x.Id == id && x.StoreId == store && x.RevocationHash == hash).ExecuteUpdateAsync(u => u.SetProperty(x => x.Active, false));
        return count == 1 ? Ok(new { revoked = true }) : NotFound();
    }
}

[ApiController, Route("api/merchant/notifications"), Authorize(Roles = "Merchant")]
public class MerchantNotificationsController(AppDbContext db, IConfiguration config) : ControllerBase
{
    private Guid Tenant => Guid.TryParse(User.FindFirst("storeId")?.Value, out var id) ? id : throw new UnauthorizedAccessException();
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var enabled = await db.StoreNotificationSettings.AnyAsync(x => x.StoreId == Tenant && x.WebPushEnabled);
        var optedIn = await db.OrderPushSubscriptions.CountAsync(x => x.StoreId == Tenant && x.Active && x.ExpiresAt > DateTime.UtcNow);
        var deliveries = await (from d in db.OrderNotificationDeliveries.AsNoTracking()
            join o in db.WhatsAppOrders on d.OrderId equals o.Id
            where d.StoreId == Tenant && o.StoreId == Tenant orderby d.CreatedAt descending
            select new { d.Id, o.OrderNumber, d.OrderStatus, d.State, d.Attempts, d.ManualRetries, d.LastHttpStatus, d.CreatedAt, d.AcceptedAt }).Take(100).ToListAsync();
        return Ok(new { enabled, configured = PushRules.Enabled(config), optedIn, deliveries });
    }
    [HttpPut("settings")]
    public async Task<IActionResult> Settings(NotificationSettingRequest request)
    {
        if (request.Enabled && !PushRules.Enabled(config)) return StatusCode(503, new { message = "يلزم إعداد VAPID وموزّع موثوق واختبار جهاز مدعوم أولاً." });
        if (!await db.Stores.AnyAsync(x => x.Id == Tenant && x.IsActive)) return NotFound();
        var settings = await db.StoreNotificationSettings.FindAsync(Tenant);
        if (settings == null) { settings = new() { StoreId = Tenant }; db.StoreNotificationSettings.Add(settings); }
        settings.WebPushEnabled = request.Enabled; await db.SaveChangesAsync();
        return Ok(new { enabled = settings.WebPushEnabled });
    }
    [HttpPost("deliveries/{id:guid}/retry")]
    public async Task<IActionResult> Retry(Guid id)
    {
        if (!PushRules.Enabled(config)) return StatusCode(503);
        var count = await db.OrderNotificationDeliveries.Where(x => x.Id == id && x.StoreId == Tenant && x.State == "Failed" && x.ManualRetries < 2 && (x.LastHttpStatus == 429 || x.LastHttpStatus >= 500))
            .ExecuteUpdateAsync(u => u.SetProperty(x => x.State, "Pending").SetProperty(x => x.Attempts, 0)
                .SetProperty(x => x.ManualRetries, x => x.ManualRetries + 1).SetProperty(x => x.NextAttemptAt, DateTime.UtcNow));
        return count == 1 ? Ok(new { queued = true }) : NotFound();
    }
}

[ApiController, Route("api/internal/notifications/dispatch"), EnableRateLimiting("admin-policy")]
public class NotificationDispatchController(IConfiguration config, PushDispatcher dispatcher, IHostEnvironment environment) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Dispatch(CancellationToken token)
    {
        if (!Request.IsHttps && !environment.IsEnvironment("Testing")) return BadRequest();
        var expected = config["WebPush:DispatcherKey"] ?? "";
        var actual = Request.Headers.Authorization.ToString();
        if (expected.Length < 32 || !CryptographicOperations.FixedTimeEquals(SHA256.HashData(Encoding.UTF8.GetBytes(actual)), SHA256.HashData(Encoding.UTF8.GetBytes("Bearer " + expected)))) return Unauthorized();
        if (!PushRules.Enabled(config)) return StatusCode(503);
        return Ok(new { processed = await dispatcher.Run(token) });
    }
}
public class SubscribeRequest
{
    [Required, RegularExpression("^[a-f0-9]{64}$")] public string TrackingToken { get; set; } = "";
    [Required, StringLength(2048)] public string Endpoint { get; set; } = "";
    [Required, StringLength(100)] public string P256dh { get; set; } = "";
    [Required, StringLength(50)] public string Auth { get; set; } = "";
}
public class RevokeRequest { [Required, RegularExpression("^[a-f0-9]{64}$")] public string RevokeKey { get; set; } = ""; }
public class NotificationSettingRequest { public bool Enabled { get; set; } }
