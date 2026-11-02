using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers;

[ApiController, Authorize(Roles = "Merchant"), Route("api/merchant/commerce")]
public class CommerceController(AppDbContext db) : ControllerBase
{
    private Guid Tenant => Guid.TryParse(User.FindFirst("storeId")?.Value, out var id) ? id : throw new UnauthorizedAccessException();

    [HttpGet("settings")]
    public async Task<IActionResult> Settings()
    {
        var store = await db.Stores.AsNoTracking().SingleOrDefaultAsync(s => s.Id == Tenant);
        if (store == null) return NotFound();
        var settings = await db.CommerceSettings.AsNoTracking().SingleOrDefaultAsync(x => x.StoreId == Tenant)
            ?? new CommerceSettings { StoreId = Tenant, InstaPay = !string.IsNullOrWhiteSpace(store.InstaPayAddress), MobileWallet = !string.IsNullOrWhiteSpace(store.VodafoneCashNumber) };
        return Ok(new { settings.PublishedTheme, settings.DraftTheme, settings.PreviousTheme, settings.CheckoutMode,
            settings.CashOnDelivery, settings.InstaPay, settings.MobileWallet,
            shippingZones = JsonSerializer.Deserialize<List<ShippingZone>>(settings.ShippingZonesJson, CommerceRules.Json), store.Slug });
    }

    [HttpPut("settings")]
    public async Task<IActionResult> Save(CommerceSettingsRequest request)
    {
        if (request.ShippingZones.Select(x => x.Id).Distinct().Count() != request.ShippingZones.Count || request.ShippingZones.Any(x => x.Pickup && x.Fee != 0))
            return BadRequest(new { message = "المناطق يجب أن تكون فريدة والاستلام مجاني" });
        if (!request.CashOnDelivery && !request.InstaPay && !request.MobileWallet) return BadRequest(new { message = "اختر طريقة دفع واحدة على الأقل" });
        var store = await db.Stores.SingleOrDefaultAsync(s => s.Id == Tenant && s.IsActive);
        if (store == null) return NotFound();
        if (request.InstaPay && string.IsNullOrWhiteSpace(store.InstaPayAddress) || request.MobileWallet && string.IsNullOrWhiteSpace(store.VodafoneCashNumber))
            return BadRequest(new { message = "أضف بيانات حساب التحويل في إعدادات المتجر أولاً" });
        var settings = await db.CommerceSettings.SingleOrDefaultAsync(x => x.StoreId == Tenant);
        if (settings == null) { settings = new CommerceSettings { StoreId = Tenant }; db.CommerceSettings.Add(settings); }
        settings.DraftTheme = request.DraftTheme;
        settings.CheckoutMode = request.CheckoutMode;
        settings.CashOnDelivery = request.CashOnDelivery;
        settings.InstaPay = request.InstaPay;
        settings.MobileWallet = request.MobileWallet;
        settings.ShippingZonesJson = JsonSerializer.Serialize(request.ShippingZones, CommerceRules.Json);
        await db.SaveChangesAsync();
        return Ok(new { message = "تم حفظ المسودة وإعدادات التجارة" });
    }

    [HttpPost("theme/{op}")]
    public async Task<IActionResult> Publish(string op)
    {
        if (op is not ("publish" or "restore")) return NotFound();
        var settings = await db.CommerceSettings.SingleOrDefaultAsync(x => x.StoreId == Tenant);
        if (settings == null) return BadRequest(new { message = "احفظ المسودة أولاً" });
        var previous = settings.PublishedTheme;
        settings.PublishedTheme = op == "restore" ? settings.PreviousTheme : settings.DraftTheme;
        settings.PreviousTheme = previous;
        settings.DraftTheme = settings.PublishedTheme;
        await db.SaveChangesAsync();
        return Ok(new { settings.PublishedTheme, settings.PreviousTheme, settings.DraftTheme });
    }

    [HttpGet("inventory")]
    public async Task<IActionResult> Inventory() => Ok(await db.InventoryStocks.AsNoTracking().Where(x => x.StoreId == Tenant).ToListAsync());

    [HttpPost("inventory/{productId:guid}")]
    public async Task<IActionResult> Adjust(Guid productId, InventoryAdjustmentRequest request)
    {
        return await db.Database.CreateExecutionStrategy().ExecuteAsync<IActionResult>(async () =>
        {
            db.ChangeTracker.Clear();
            await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            await db.Stores.Where(s => s.Id == Tenant).ExecuteUpdateAsync(u => u.SetProperty(s => s.ViewCount, s => s.ViewCount));
            var product = await db.Products.SingleOrDefaultAsync(p => p.StoreId == Tenant && p.Id == productId);
            if (product == null) return NotFound();
            if (request.SelectedVariants.Count > 0 && !CommerceRules.ValidVariants(product, request.SelectedVariants)) return BadRequest(new { message = "اختيارات غير صالحة" });
            var key = CommerceRules.VariantKey(request.SelectedVariants);
            var stock = await db.InventoryStocks.SingleOrDefaultAsync(x => x.StoreId == Tenant && x.ProductId == productId && x.VariantKey == key);
            if (stock == null)
            {
                stock = new InventoryStock { StoreId = Tenant, ProductId = productId, VariantKey = key, SelectedVariantsJson = JsonSerializer.Serialize(request.SelectedVariants, CommerceRules.Json) };
                db.InventoryStocks.Add(stock);
            }
            if ((long)stock.Quantity + request.Adjustment is < 0 or > 1000000) return Conflict(new { message = "كمية المخزون غير صالحة" });
            stock.Quantity += request.Adjustment;
            stock.LowStockThreshold = request.LowStockThreshold;
            db.InventoryAdjustments.Add(new InventoryAdjustment { StoreId = Tenant, ProductId = productId, VariantKey = key, Adjustment = request.Adjustment, Reason = request.Reason });
            await db.SaveChangesAsync();
            await tx.CommitAsync();
            return Ok(stock);
        });
    }

    [HttpPatch("orders/{id:guid}/status")]
    public async Task<IActionResult> Status(Guid id, OrderActionRequest request)
    {
        return await db.Database.CreateExecutionStrategy().ExecuteAsync<IActionResult>(async () =>
        {
            db.ChangeTracker.Clear();
            await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            await db.Stores.Where(s => s.Id == Tenant).ExecuteUpdateAsync(u => u.SetProperty(s => s.ViewCount, s => s.ViewCount));
            var order = await db.WhatsAppOrders.SingleOrDefaultAsync(o => o.Id == id && o.StoreId == Tenant);
            if (order == null) return NotFound();
            if (order.Status == request.Status) return Ok(new { order.Status });
            if (!CommerceRules.CanTransition(order.Status, request.Status)) return Conflict(new { message = "لا يمكن تغيير حالة الطلب بهذا الترتيب" });
            if (request.Status is "Cancelled" or "Rejected")
            {
                if (order.PaymentStatus == "Paid") return Conflict(new { message = "يجب تسوية المبلغ المدفوع قبل الإلغاء؛ تواصل مع الإدارة" });
                if (order.InventoryDeducted)
                {
                    var items = JsonSerializer.Deserialize<List<SavedOrderItemRecord>>(order.ItemsJson, CommerceRules.Json) ?? new();
                    foreach (var item in items)
                        foreach (var stockKey in (item.StockKey ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries))
                        {
                            var key = stockKey == "base" ? "" : stockKey;
                            await db.InventoryStocks.Where(x => x.StoreId == Tenant && x.ProductId == item.ProductId && x.VariantKey == key)
                                .ExecuteUpdateAsync(u => u.SetProperty(x => x.Quantity, x => x.Quantity + item.Quantity));
                        }
                    order.InventoryDeducted = false;
                }
                order.PaymentStatus = "Cancelled";
            }
            order.Status = request.Status;
            var history = new OrderHistory { StoreId = Tenant, OrderId = id, Status = request.Status, Note = request.Note };
            db.OrderHistories.Add(history);
            await WatsStore.Api.Infrastructure.Notifications.NotificationOutbox.Enqueue(db, history);
            await db.SaveChangesAsync();
            await tx.CommitAsync();
            return Ok(new { order.Status });
        });
    }

    [HttpPost("orders/{id:guid}/verify-payment")]
    public async Task<IActionResult> Verify(Guid id, VerifyPaymentRequest request)
    {
        return await db.Database.CreateExecutionStrategy().ExecuteAsync<IActionResult>(async () =>
        {
            db.ChangeTracker.Clear();
            await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            await db.Stores.Where(s => s.Id == Tenant).ExecuteUpdateAsync(u => u.SetProperty(s => s.ViewCount, s => s.ViewCount));
            var order = await db.WhatsAppOrders.SingleOrDefaultAsync(o => o.StoreId == Tenant && o.Id == id);
            if (order == null) return NotFound();
            if (order.Status is "Cancelled" or "Rejected") return Conflict();
            if (order.PaymentStatus == "Paid") return Ok(new { order.PaymentStatus });
            if (order.PaymentMethod == "cod" && order.Status != "Delivered") return Conflict(new { message = "أكد التسليم أولاً" });
            order.PaymentStatus = "Paid";
            db.OrderHistories.Add(new OrderHistory { StoreId = Tenant, OrderId = id, Status = "PaymentVerified", Note = request.Note });
            await db.SaveChangesAsync();
            await tx.CommitAsync();
            return Ok(new { order.PaymentStatus });
        });
    }

    [HttpGet("orders/{id:guid}/history")]
    public async Task<IActionResult> History(Guid id)
    {
        if (!await db.WhatsAppOrders.AnyAsync(o => o.StoreId == Tenant && o.Id == id)) return NotFound();
        return Ok(await db.OrderHistories.AsNoTracking().Where(x => x.StoreId == Tenant && x.OrderId == id).OrderBy(x => x.CreatedAt).ToListAsync());
    }
}
