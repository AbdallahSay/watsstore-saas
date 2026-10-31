using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Tests;

// Isolated test host. Never connects to production or seeds production content.
await using var factory = new CommerceFactory();
factory.UseKestrel(5000);
var fixtures = new List<object>();
foreach (var theme in new[] { "editorial", "streetwear", "lifestyle" })
{
    var (store, product) = await factory.Seed();
    await factory.WithDb(async db =>
    {
        var settings = (await db.CommerceSettings.FindAsync(store.Id))!;
        settings.PublishedTheme = theme; settings.DraftTheme = theme;
        settings.ShippingZonesJson = "[{\"id\":\"cairo\",\"name\":\"القاهرة الجديدة\",\"governorate\":\"القاهرة\",\"fee\":45,\"estimate\":\"٢–٣ أيام\"}]";
        var category = new Category { StoreId = store.Id, Name = "المجموعة الأولى" };
        db.Categories.Add(category);
        var p = (await db.Products.FindAsync(product.Id))!;
        p.Name = "منتج اختبار — تصميم عربي"; p.Category = category;
        p.VariantsJson = "[{\"name\":\"المقاس\",\"options\":[\"M\",\"L\"]}]";
        p.Description = "وصف المنتج المستخدم في اختبار معزول. لا يظهر في بيئة الإنتاج.";
        // Local generated test image avoids dependence on third-party image servers.
        p.ImageUrl = "http://localhost:5000/test-product.svg";
        var liveStore = (await db.Stores.FindAsync(store.Id))!;
        liveStore.StoreName = theme == "editorial" ? "دار التفاصيل" : theme == "streetwear" ? "شارع" : "بيت وأثر";
        liveStore.CoverUrl = "http://localhost:5000/test-product.svg";
        liveStore.SeoDescription = "تشكيلة مختارة بعناية. اختبار معزول للتسوق وإتمام الطلب.";
        db.Products.AddRange(Enumerable.Range(1,7).Select(i => new Product { StoreId = store.Id, Category = category, Name = $"منتج الاختبار {i}", Slug = $"product-{i}", Price = 80 + i * 25, ImageUrl = p.ImageUrl, Description = p.Description }));
        db.InventoryStocks.Add(new InventoryStock { StoreId = store.Id, ProductId = p.Id, Quantity = 25 });
        await db.SaveChangesAsync();
    });
    var token = factory.Merchant(store).DefaultRequestHeaders.Authorization!.Parameter;
    fixtures.Add(new { theme, slug = store.Slug, productId = product.Id, token, user = new { storeName = store.StoreName, slug = store.Slug, planType = "Pro" } });
}
Directory.CreateDirectory("work");
await File.WriteAllTextAsync("work/e2e-fixtures.json", JsonSerializer.Serialize(fixtures));
Console.WriteLine("Isolated commerce API ready at http://localhost:5000; fixture file written.");
await Task.Delay(Timeout.InfiniteTimeSpan);
