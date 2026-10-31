using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;
using Xunit;

namespace WatsStore.Tests;

public class CommerceFactory : WebApplicationFactory<Program>
{
    private readonly string path = Path.Combine(Path.GetTempPath(), $"watsstore-test-{Guid.NewGuid()}.db");
    public const string TestKey = "isolated-test-signing-key-with-at-least-32-bytes-only";
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var dir = AppContext.BaseDirectory;
        while (!string.IsNullOrEmpty(dir) && !Directory.Exists(Path.Combine(dir, "backend")))
        {
            var parent = Directory.GetParent(dir);
            if (parent == null) break;
            dir = parent.FullName;
        }
        var backendDir = Path.Combine(dir, "backend");
        builder.UseContentRoot(backendDir);
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:SecretKey", TestKey);
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(o => o.UseSqlite($"Data Source={path};Default Timeout=30"));
            services.AddControllers().AddApplicationPart(typeof(TestAssetsController).Assembly);
        });
    }
    public async Task<(Store Store, Product Product)> Seed()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        var store = new Store { Email = $"{Guid.NewGuid()}@test.invalid", Slug = Guid.NewGuid().ToString("N"), PublicCode = Guid.NewGuid().ToString("N")[..16], StoreName = "اختبار", OwnerName = "Test", WhatsAppNumber = "201012345678", BusinessCategory = "Test", City = "Cairo", PlanType = "Pro", DeliveryFee = 30 };
        var product = new Product { StoreId = store.Id, Name = "منتج", Slug = "product", Price = 100 };
        db.AddRange(store, product, new CommerceSettings { StoreId = store.Id, CheckoutMode = "both" });
        await db.SaveChangesAsync();
        return (store, product);
    }
    public HttpClient Merchant(Store store)
    {
        var client = CreateClient();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> { ["Jwt:SecretKey"] = TestKey }).Build();
        var token = new JwtTokenGenerator(config).GenerateToken(store);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }
    public async Task WithDb(Func<AppDbContext,Task> action)
    {
        using var scope = Services.CreateScope();
        await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }
}

public class CommerceTests
{
    private static CreateOrderRequest Request(Product product) => new()
    {
        Channel = "online", IdempotencyKey = Guid.NewGuid().ToString(), CustomerName = "Test Customer",
        CustomerPhone = "01012345678", CustomerAddress = "123 Cairo address", PaymentMethod = "cod",
        Items = new() { new() { ProductId = product.Id, Quantity = 1, SelectedVariants = new() } }
    };
    private static string Orders(Store store) => $"/api/public/stores/{store.Slug}/orders";

    [Fact]
    public async Task Checkout_recalculates_totals_replays_and_rejects_changed_payload()
    {
        await using var app = new CommerceFactory();
        var (store, product) = await app.Seed();
        var client = app.CreateClient(); var request = Request(product);
        var first = await client.PostAsJsonAsync(Orders(store), request);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var result = await first.Content.ReadFromJsonAsync<CreateOrderResponse>();
        Assert.Equal(130, result!.TotalAmount); Assert.Equal("", result.WhatsAppRedirectUrl);
        Assert.Equal(64, result.TrackingToken!.Length); Assert.Equal("Unpaid", result.PaymentStatus);
        var second = await client.PostAsJsonAsync(Orders(store), request);
        Assert.Equal(result.OrderId, (await second.Content.ReadFromJsonAsync<CreateOrderResponse>())!.OrderId);
        request.Items[0].Quantity = 2;
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync(Orders(store), request)).StatusCode);
        await app.WithDb(async db => Assert.Equal(1, await db.WhatsAppOrders.CountAsync()));
    }

    [Fact]
    public async Task Cross_tenant_products_orders_inventory_and_theme_cannot_be_accessed()
    {
        await using var app = new CommerceFactory();
        var (a, pa) = await app.Seed(); var (b,pb) = await app.Seed();
        var client = app.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(Orders(a), Request(pb))).StatusCode);
        var order = (await (await client.PostAsJsonAsync(Orders(b), Request(pb))).Content.ReadFromJsonAsync<CreateOrderResponse>())!;
        var merchant = app.Merchant(a);
        Assert.Equal(HttpStatusCode.Forbidden, (await merchant.GetAsync($"/api/merchant/orders/{order.OrderId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await merchant.PatchAsJsonAsync($"/api/merchant/commerce/orders/{order.OrderId}/status", new {status="Confirmed"})).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await merchant.PostAsJsonAsync($"/api/merchant/commerce/inventory/{pb.Id}", new {adjustment=10,reason="test"})).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await merchant.GetAsync($"/api/merchant/commerce/orders/{order.OrderId}/history")).StatusCode);
        var config = new CommerceSettingsRequest { DraftTheme = "streetwear", CheckoutMode = "both" };
        Assert.Equal(HttpStatusCode.OK, (await merchant.PutAsJsonAsync("/api/merchant/commerce/settings",config)).StatusCode);
        await merchant.PostAsync("/api/merchant/commerce/theme/publish",null);
        await app.WithDb(async db => {Assert.Equal("streetwear",(await db.CommerceSettings.FindAsync(a.Id))!.PublishedTheme);Assert.Equal("editorial",(await db.CommerceSettings.FindAsync(b.Id))!.PublishedTheme);});
    }

    [Fact]
    public async Task Invalid_variants_and_disabled_payments_are_rejected()
    {
        await using var app = new CommerceFactory(); var(store,p)=await app.Seed();
        await app.WithDb(async db=>{var product=await db.Products.FindAsync(p.Id);product!.VariantsJson="[{\"name\":\"Size\",\"options\":[\"M\",\"L\"]}]";await db.SaveChangesAsync();});
        var client=app.CreateClient();var request=Request(p);
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync(Orders(store),request)).StatusCode);
        request.Items[0].SelectedVariants=new(){{"Size","XL"}};
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync(Orders(store),request)).StatusCode);
        request.Items[0].SelectedVariants=new(){{"Size","M"}};request.PaymentMethod="fake-provider";
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync(Orders(store),request)).StatusCode);
    }

    [Fact]
    public async Task Stock_is_restored_once_and_invalid_transitions_fail()
    {
        await using var app = new CommerceFactory();var(store,p)=await app.Seed();
        await app.WithDb(async db=>{db.InventoryStocks.Add(new(){StoreId=store.Id,ProductId=p.Id,Quantity=1});await db.SaveChangesAsync();});
        var client=app.CreateClient();var order=(await(await client.PostAsJsonAsync(Orders(store),Request(p))).Content.ReadFromJsonAsync<CreateOrderResponse>())!;
        Assert.Equal(HttpStatusCode.Conflict,(await client.PostAsJsonAsync(Orders(store),Request(p))).StatusCode);
        var merchant=app.Merchant(store);var url=$"/api/merchant/commerce/orders/{order.OrderId}/status";
        Assert.Equal(HttpStatusCode.Conflict,(await merchant.PatchAsJsonAsync(url,new{status="Delivered"})).StatusCode);
        Assert.Equal(HttpStatusCode.OK,(await merchant.PatchAsJsonAsync(url,new{status="Cancelled"})).StatusCode);
        Assert.Equal(HttpStatusCode.OK,(await merchant.PatchAsJsonAsync(url,new{status="Cancelled"})).StatusCode);
        await app.WithDb(async db=>Assert.Equal(1,(await db.InventoryStocks.SingleAsync()).Quantity));
    }

    [Fact]
    public async Task Concurrent_checkouts_do_not_oversell_or_exceed_coupon_limit()
    {
        await using var app=new CommerceFactory();var(store,p)=await app.Seed();
        await app.WithDb(async db=>{db.InventoryStocks.Add(new(){StoreId=store.Id,ProductId=p.Id,Quantity=1});db.StoreCoupons.Add(new(){StoreId=store.Id,Code="ONE",DiscountValue=10,UsageLimit=1});await db.SaveChangesAsync();});
        var client=app.CreateClient();var requests=Enumerable.Range(0,4).Select(_=>{var r=Request(p);r.CouponCode="ONE";return client.PostAsJsonAsync(Orders(store),r);});
        var results=await Task.WhenAll(requests);
        Assert.Single(results, x => x.IsSuccessStatusCode);
        await app.WithDb(async db=>{Assert.Equal(0,(await db.InventoryStocks.SingleAsync()).Quantity);Assert.Equal(1,(await db.StoreCoupons.SingleAsync()).TimesUsed);Assert.Equal(1,await db.WhatsAppOrders.CountAsync());});
    }

    [Fact]
    public async Task Tracking_redacts_customer_data_and_scopes_token_to_store()
    {
        await using var app=new CommerceFactory();var(store,p)=await app.Seed();var(other,_)=await app.Seed();
        var client=app.CreateClient();var order=(await(await client.PostAsJsonAsync(Orders(store),Request(p))).Content.ReadFromJsonAsync<CreateOrderResponse>())!;
        var response=await client.GetAsync($"{Orders(store)}/track/{order.TrackingToken}");
        Assert.Equal(HttpStatusCode.OK,response.StatusCode);Assert.Contains("no-store",response.Headers.CacheControl!.ToString());
        var text=await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("customerPhone",text);Assert.DoesNotContain("customerAddress",text);Assert.DoesNotContain("Test Customer",text);
        Assert.Equal(HttpStatusCode.NotFound,(await client.GetAsync($"{Orders(other)}/track/{order.TrackingToken}")).StatusCode);
    }

    [Fact]
    public async Task Manual_transfers_require_reference_and_explicit_verification()
    {
        await using var app=new CommerceFactory();var(store,p)=await app.Seed();
        await app.WithDb(async db=>{(await db.Stores.FindAsync(store.Id))!.InstaPayAddress="test@instapay";(await db.CommerceSettings.FindAsync(store.Id))!.InstaPay=true;await db.SaveChangesAsync();});
        var client=app.CreateClient();var r=Request(p);r.PaymentMethod="instapay";
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync(Orders(store),r)).StatusCode);
        r.TransferReference="reference-123";
        var order=(await(await client.PostAsJsonAsync(Orders(store),r)).Content.ReadFromJsonAsync<CreateOrderResponse>())!;
        Assert.Equal("AwaitingVerification",order.PaymentStatus);
        var merchant=app.Merchant(store);var url=$"/api/merchant/commerce/orders/{order.OrderId}/verify-payment";
        Assert.Equal(HttpStatusCode.Unauthorized,(await client.PostAsJsonAsync(url,new{note="checked bank"})).StatusCode);
        Assert.Equal(HttpStatusCode.OK,(await merchant.PostAsJsonAsync(url,new{note="checked bank"})).StatusCode);
        Assert.Equal(HttpStatusCode.OK,(await merchant.PostAsJsonAsync(url,new{note="retry checked"})).StatusCode);
        await app.WithDb(async db=>Assert.Single(await db.OrderHistories.Where(x=>x.Status=="PaymentVerified").ToListAsync()));
    }

    [Fact]
    public async Task Shipping_is_server_selected_and_invalid_zone_rolls_back()
    {
        await using var app=new CommerceFactory();var(store,p)=await app.Seed();
        await app.WithDb(async db=>{(await db.CommerceSettings.FindAsync(store.Id))!.ShippingZonesJson="[{\"id\":\"cairo\",\"governorate\":\"Cairo\",\"name\":\"Zone\",\"fee\":50}]";await db.SaveChangesAsync();});
        var client=app.CreateClient();var r=Request(p);r.ShippingZoneId="fake";
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync(Orders(store),r)).StatusCode);
        r.ShippingZoneId="cairo";r.Governorate="Cairo";
        var response=await client.PostAsJsonAsync(Orders(store),r);
        Assert.Equal(150,(await response.Content.ReadFromJsonAsync<CreateOrderResponse>())!.TotalAmount);
    }

    [Fact]
    public async Task Authentication_recovery_and_cors_fail_closed()
    {
        await using var app=new CommerceFactory();await app.Seed();var client=app.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync("/api/merchant/commerce/settings")).StatusCode);
        var recovery=await client.PostAsJsonAsync("/api/admin/forgot-password",new{email="unknown@test.invalid"});
        Assert.Equal(HttpStatusCode.ServiceUnavailable,recovery.StatusCode);Assert.DoesNotContain("resetToken",await recovery.Content.ReadAsStringAsync());
        var request=new HttpRequestMessage(HttpMethod.Options,"/api/merchant/commerce/settings");request.Headers.Add("Origin","https://evilwatsstore.com");request.Headers.Add("Access-Control-Request-Method","PUT");
        var response=await client.SendAsync(request);Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
