using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using WatsStore.Api.Controllers;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Notifications;
using Xunit;
namespace WatsStore.Tests;

public class FakePushTransport : IOrderPushTransport
{
    public int Code { get; set; } = 201;
    public int Calls;
    public List<string> Payloads { get; } = new();
    public Task<int> Send(OrderPushSubscription sub, string payload, CancellationToken token)
    { Interlocked.Increment(ref Calls); lock(Payloads) Payloads.Add(payload); return Task.FromResult(Code); }
}
public class PushFactory : CommerceFactory
{
    public FakePushTransport Transport { get; } = new();
    public const string DispatchKey = "isolated-notification-dispatcher-test-secret-only-123";
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseSetting("WebPush:Enabled","true");builder.UseSetting("WebPush:DeviceDeliveryVerified","true");
        builder.UseSetting("WebPush:PublicKey","isolated-public-key");builder.UseSetting("WebPush:PrivateKey","isolated-private-key");
        builder.UseSetting("WebPush:Subject","mailto:test@example.invalid");builder.UseSetting("WebPush:DispatcherKey",DispatchKey);
        builder.ConfigureServices(services=>{services.RemoveAll<IOrderPushTransport>();services.AddSingleton<IOrderPushTransport>(Transport);});
    }
}
public class OrderNotificationTests
{
    private static readonly string[] BadEndpoints = {"http://fcm.googleapis.com/send/abc","https://localhost/send","https://127.0.0.1/send","https://fcm.googleapis.com.attacker.test/send","https://user:password@fcm.googleapis.com/send","https://fcm.googleapis.com:8443/send"};
    private static string B64(byte[] bytes)=>Convert.ToBase64String(bytes).TrimEnd('=').Replace('+','-').Replace('/','_');
    private static SubscribeRequest Subscription(string token)
    {
        using var curve=ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);var p=curve.ExportParameters(false);
        return new(){TrackingToken=token,Endpoint="https://fcm.googleapis.com/fcm/send/test-"+Guid.NewGuid(),P256dh=B64(new byte[]{4}.Concat(p.Q.X!).Concat(p.Q.Y!).ToArray()),Auth=B64(RandomNumberGenerator.GetBytes(16))};
    }
    private async Task<(Store Store, CreateOrderResponse Order, JsonElement Subscription)> Prepare(PushFactory app)
    {
        var(store,p)=await app.Seed();
        await app.WithDb(async db=>{db.StoreNotificationSettings.Add(new(){StoreId=store.Id,WebPushEnabled=true});await db.SaveChangesAsync();});
        var r=await app.CreateClient().PostAsJsonAsync($"/api/public/stores/{store.Slug}/orders",new CreateOrderRequest{Channel="online",IdempotencyKey=Guid.NewGuid().ToString(),CustomerName="Private Test",CustomerPhone="01000000000",CustomerAddress="Private street address",Items=new(){new(){ProductId=p.Id,Quantity=1}}});
        Assert.Equal(HttpStatusCode.OK,r.StatusCode);var order=(await r.Content.ReadFromJsonAsync<CreateOrderResponse>())!;
        var sub=await app.CreateClient().PostAsJsonAsync($"/api/public/stores/{store.Slug}/notifications/subscriptions",Subscription(order.TrackingToken!));
        Assert.Equal(HttpStatusCode.OK,sub.StatusCode);
        return(store,order,await sub.Content.ReadFromJsonAsync<JsonElement>());
    }
    private static Task<HttpResponseMessage> State(PushFactory app,Store store,Guid id,string status)=>app.Merchant(store).PatchAsJsonAsync($"/api/merchant/commerce/orders/{id}/status",new{status});
    private static async Task<int> Dispatch(PushFactory app)
    {using var scope=app.Services.CreateScope();return await scope.ServiceProvider.GetRequiredService<PushDispatcher>().Run(CancellationToken.None);}

    [Fact]
    public async Task Background_push_is_disabled_without_configuration()
    {
        await using var app=new CommerceFactory();var(store,_)=await app.Seed();var client=app.CreateClient();
        var config=await client.GetFromJsonAsync<JsonElement>($"/api/public/stores/{store.Slug}/notifications/config");Assert.False(config.GetProperty("enabled").GetBoolean());
        Assert.Equal(HttpStatusCode.ServiceUnavailable,(await client.PostAsJsonAsync($"/api/public/stores/{store.Slug}/notifications/subscriptions",Subscription(new string('a',64)))).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable,(await app.Merchant(store).PutAsJsonAsync("/api/merchant/notifications/settings",new{enabled=true})).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,(await client.PostAsync("/api/internal/notifications/dispatch",null)).StatusCode);
    }

    [Fact]
    public async Task Subscription_validation_prevents_SSRF_bad_keys_and_cross_tenant_registration()
    {
        await using var app=new PushFactory();var(store,order,_)=await Prepare(app);var(other,_)=await app.Seed();var client=app.CreateClient();
        foreach(var endpoint in BadEndpoints){var request=Subscription(order.TrackingToken!);request.Endpoint=endpoint;Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync($"/api/public/stores/{store.Slug}/notifications/subscriptions",request)).StatusCode);}
        var bad=Subscription(order.TrackingToken!);bad.Auth="bad";Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync($"/api/public/stores/{store.Slug}/notifications/subscriptions",bad)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,(await client.PostAsJsonAsync($"/api/public/stores/{other.Slug}/notifications/subscriptions",Subscription(order.TrackingToken!))).StatusCode);
    }

    [Fact]
    public async Task Status_change_queues_one_event_and_dispatch_does_not_repeat_or_leak_tracking_capability()
    {
        await using var app=new PushFactory();var(store,order,_)=await Prepare(app);
        Assert.Equal(HttpStatusCode.OK,(await State(app,store,order.OrderId,"Confirmed")).StatusCode);
        Assert.Equal(HttpStatusCode.OK,(await State(app,store,order.OrderId,"Confirmed")).StatusCode);
        Assert.Equal(1,await Dispatch(app));Assert.Equal(0,await Dispatch(app));Assert.Equal(1,app.Transport.Calls);
        var payload=app.Transport.Payloads.Single();Assert.DoesNotContain(order.TrackingToken!,payload);Assert.DoesNotContain(order.OrderId.ToString(),payload);Assert.DoesNotContain("Private",payload);Assert.Contains("my-orders",payload);
        await app.WithDb(async db=>{Assert.Single(await db.OrderNotificationDeliveries.ToListAsync());Assert.Equal("AcceptedByProvider",(await db.OrderNotificationDeliveries.SingleAsync()).State);Assert.Single(await db.PushDeliveryAttempts.ToListAsync());});
        var response=await app.Merchant(store).GetStringAsync("/api/merchant/notifications");Assert.DoesNotContain("endpoint",response,StringComparison.OrdinalIgnoreCase);Assert.DoesNotContain("revokeKey",response);Assert.DoesNotContain("p256dh",response);
    }

    [Fact]
    public async Task Revocation_requires_device_secret_and_prevents_pending_delivery()
    {
        await using var app=new PushFactory();var(store,order,sub)=await Prepare(app);var client=app.CreateClient();var id=sub.GetProperty("id").GetGuid();var key=sub.GetProperty("revokeKey").GetString();
        await State(app,store,order.OrderId,"Confirmed");
        var bad=new HttpRequestMessage(HttpMethod.Delete,$"/api/public/stores/{store.Slug}/notifications/subscriptions/{id}"){Content=JsonContent.Create(new{revokeKey=new string('a',64)})};Assert.Equal(HttpStatusCode.NotFound,(await client.SendAsync(bad)).StatusCode);
        var good=new HttpRequestMessage(HttpMethod.Delete,$"/api/public/stores/{store.Slug}/notifications/subscriptions/{id}"){Content=JsonContent.Create(new{revokeKey=key})};Assert.Equal(HttpStatusCode.OK,(await client.SendAsync(good)).StatusCode);
        Assert.Equal(0,await Dispatch(app));Assert.Equal(0,app.Transport.Calls);
        await app.WithDb(async db=>Assert.Equal("Suppressed",(await db.OrderNotificationDeliveries.SingleAsync()).State));
    }

    [Fact]
    public async Task Expired_subscriptions_are_deactivated_and_transient_errors_use_backoff()
    {
        await using var app=new PushFactory();var(store,order,_)=await Prepare(app);await State(app,store,order.OrderId,"Confirmed");
        app.Transport.Code=503;Assert.Equal(1,await Dispatch(app));Assert.Equal(0,await Dispatch(app));
        await app.WithDb(async db=>{var delivery=await db.OrderNotificationDeliveries.SingleAsync();Assert.Equal("Pending",delivery.State);Assert.Equal(1,delivery.Attempts);delivery.NextAttemptAt=DateTime.UtcNow.AddMinutes(-1);await db.SaveChangesAsync();});
        app.Transport.Code=410;Assert.Equal(1,await Dispatch(app));
        await app.WithDb(async db=>{Assert.False((await db.OrderPushSubscriptions.SingleAsync()).Active);Assert.Equal("Expired",(await db.OrderNotificationDeliveries.SingleAsync()).State);Assert.Equal(2,await db.PushDeliveryAttempts.CountAsync());});
    }

    [Fact]
    public async Task Merchant_delivery_management_and_dispatcher_are_authorized_and_tenant_scoped()
    {
        await using var app=new PushFactory();var(store,order,_)=await Prepare(app);var(other,_)=await app.Seed();await State(app,store,order.OrderId,"Confirmed");Guid id=Guid.Empty;
        await app.WithDb(async db=>{var d=await db.OrderNotificationDeliveries.SingleAsync();id=d.Id;d.State="Failed";d.LastHttpStatus=503;d.Attempts=5;await db.SaveChangesAsync();});
        Assert.Equal(HttpStatusCode.NotFound,(await app.Merchant(other).PostAsync($"/api/merchant/notifications/deliveries/{id}/retry",null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK,(await app.Merchant(store).PostAsync($"/api/merchant/notifications/deliveries/{id}/retry",null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,(await app.CreateClient().GetAsync("/api/merchant/notifications")).StatusCode);
        var client=app.CreateClient();Assert.Equal(HttpStatusCode.Unauthorized,(await client.PostAsync("/api/internal/notifications/dispatch",null)).StatusCode);
        client.DefaultRequestHeaders.Authorization=new("Bearer",PushFactory.DispatchKey);Assert.Equal(HttpStatusCode.OK,(await client.PostAsync("/api/internal/notifications/dispatch",null)).StatusCode);
        var theirs=await app.Merchant(other).GetFromJsonAsync<JsonElement>("/api/merchant/notifications");Assert.Empty(theirs.GetProperty("deliveries").EnumerateArray());Assert.Equal(0,theirs.GetProperty("optedIn").GetInt32());
    }
}
