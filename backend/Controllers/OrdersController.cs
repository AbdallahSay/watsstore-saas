using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/public/stores/{storeSlug}/orders")]
    [EnableRateLimiting("sensitive-policy")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _db;

        public OrdersController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder(string storeSlug, [FromBody] CreateOrderRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (request.Items == null || request.Items.Count == 0 || request.Items.Any(i => i == null)) return BadRequest();
            if (Sanitizer.Sanitize(request.CustomerName, 100).Length < 2 || Sanitizer.Sanitize(request.CustomerAddress, 300).Length < 5) return BadRequest(new { message = "بيانات العميل غير مكتملة" });
            if (!SlugGenerator.IsValidEgyptianMobile(request.CustomerPhone))
                return BadRequest(new { message = "رقم الهاتف المصري غير صالح" });
            if (request.Channel == "online" && string.IsNullOrWhiteSpace(request.IdempotencyKey))
                return BadRequest(new { message = "مفتاح إعادة المحاولة مطلوب" });
            var hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(request))));
            var strategy = _db.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync<IActionResult>(async () =>
            {
                _db.ChangeTracker.Clear();
                await using var transaction = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                var store = await _db.Stores.FirstOrDefaultAsync(s => s.Slug == storeSlug.Trim().ToLower() && s.IsActive);
                if (store == null) return NotFound();
                // Serialize order mutations for this tenant; also coordinates lifecycle and inventory writes.
                await _db.Stores.Where(s => s.Id == store.Id).ExecuteUpdateAsync(u => u.SetProperty(s => s.ViewCount, s => s.ViewCount));
                if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
                {
                    var existing = await _db.WhatsAppOrders.AsNoTracking().FirstOrDefaultAsync(o => o.StoreId == store.Id && o.IdempotencyKey == request.IdempotencyKey);
                    if (existing != null)
                        return existing.RequestHash == hash ? Ok(BuildResponse(existing, store)) : Conflict(new { message = "مفتاح إعادة المحاولة مرتبط بطلب مختلف" });
                }
                if (store.IsTrialExpired()) return StatusCode(403, new { message = "اشتراك المتجر منتهي" });
                var settings = await _db.CommerceSettings.AsNoTracking().SingleOrDefaultAsync(x => x.StoreId == store.Id)
                    ?? new CommerceSettings { StoreId = store.Id, InstaPay = !string.IsNullOrWhiteSpace(store.InstaPayAddress), MobileWallet = !string.IsNullOrWhiteSpace(store.VodafoneCashNumber) };
                if (settings.CheckoutMode != "both" && settings.CheckoutMode != request.Channel)
                    return BadRequest(new { message = "طريقة إتمام الطلب غير متاحة" });
                var payment = request.PaymentMethod ?? "الدفع عند الاستلام";
                var cash = payment is "cod" or "الدفع عند الاستلام";
                var instapay = payment is "instapay" or "إنستاباي";
                var wallet = payment is "wallet" or "محفظة إلكترونية" or "فودافون كاش";
                if (!(cash && settings.CashOnDelivery || instapay && settings.InstaPay && !string.IsNullOrWhiteSpace(store.InstaPayAddress) || wallet && settings.MobileWallet && !string.IsNullOrWhiteSpace(store.VodafoneCashNumber)))
                    return BadRequest(new { message = "طريقة الدفع غير متاحة" });
                if (!cash && string.IsNullOrWhiteSpace(request.TransferReference))
                    return BadRequest(new { message = "أدخل مرجع التحويل للمراجعة" });
                var zones = JsonSerializer.Deserialize<List<ShippingZone>>(settings.ShippingZonesJson, CommerceRules.Json) ?? new();
                var deliveryFee = store.DeliveryFee;
                string? shippingSummary = null;
                if (zones.Count > 0)
                {
                    var zone = zones.SingleOrDefault(z => z.Id == request.ShippingZoneId);
                    if (zone == null || zone.Governorate != request.Governorate)
                        return BadRequest(new { message = "اختر المحافظة ومنطقة التوصيل الصحيحة" });
                    deliveryFee = zone.Fee;
                    shippingSummary = $"{zone.Governorate} — {zone.Name} — {zone.Estimate}";
                }
                if (deliveryFee < 0) return BadRequest(new { message = "إعدادات الشحن غير صالحة" });
                var ids = request.Items.Select(x => x.ProductId).Distinct().ToList();
                var products = await _db.Products.Where(p => p.StoreId == store.Id && ids.Contains(p.Id) && p.IsAvailable).ToDictionaryAsync(p => p.Id);
                if (ids.Count != products.Count) return BadRequest(new { message = "بعض المنتجات غير متاحة في هذا المتجر" });
                var savedItems = new List<SavedOrderItemRecord>();
                decimal subtotal = 0;
                foreach (var item in request.Items)
                {
                    var p = products[item.ProductId];
                    if (p.Price <= 0 || !CommerceRules.ValidVariants(p, item.SelectedVariants))
                        return BadRequest(new { message = "اختيارات المنتج غير صالحة" });
                    var variantKey = CommerceRules.VariantKey(item.SelectedVariants);
                    var stock = await _db.InventoryStocks.AsNoTracking().SingleOrDefaultAsync(x => x.StoreId == store.Id && x.ProductId == p.Id && x.VariantKey == variantKey);
                    // A base row optionally caps total product stock in addition to each variant.
                    var stockKeys = new List<string>();
                    if (stock != null) stockKeys.Add(variantKey);
                    if (variantKey != "" && await _db.InventoryStocks.AnyAsync(x => x.StoreId == store.Id && x.ProductId == p.Id && x.VariantKey == "")) stockKeys.Add("");
                    var hasVariantStock = await _db.InventoryStocks.AnyAsync(x => x.StoreId == store.Id && x.ProductId == p.Id && x.VariantKey != "");
                    if (hasVariantStock && variantKey != "" && stock == null)
                        return Conflict(new { message = "هذا الاختيار غير متوفر في المخزون" });
                    foreach (var key in stockKeys)
                    {
                        var updated = await _db.InventoryStocks.Where(x => x.StoreId == store.Id && x.ProductId == p.Id && x.VariantKey == key && x.Quantity >= item.Quantity)
                            .ExecuteUpdateAsync(u => u.SetProperty(x => x.Quantity, x => x.Quantity - item.Quantity));
                        if (updated != 1) return Conflict(new { message = "الكمية المطلوبة غير متوفرة" });
                    }
                    var line = decimal.Round(p.Price * item.Quantity, 2);
                    subtotal += line;
                    if (subtotal + deliveryFee > 99999999.99m) return BadRequest(new { message = "قيمة الطلب تتجاوز الحد المسموح" });
                    savedItems.Add(new SavedOrderItemRecord { ProductId = p.Id, ProductName = p.Name, ProductSlug = p.Slug, ImageUrl = p.ImageUrl, UnitPrice = p.Price, Quantity = item.Quantity, Subtotal = line, SelectedVariants = item.SelectedVariants, StockKey = string.Join(",", stockKeys.Select(k => k == "" ? "base" : k)) });
                }
                decimal discountAmount = 0;
                StoreCoupon? appliedCoupon = null;
                if (!string.IsNullOrWhiteSpace(request.CouponCode))
                {
                    var code = request.CouponCode.Trim().ToUpperInvariant();
                    appliedCoupon = await _db.StoreCoupons.AsNoTracking().SingleOrDefaultAsync(x => x.StoreId == store.Id && x.Code == code && x.IsActive);
                    if (appliedCoupon == null || appliedCoupon.ExpiryDate < DateTime.UtcNow || appliedCoupon.UsageLimit.HasValue && appliedCoupon.TimesUsed >= appliedCoupon.UsageLimit)
                        return BadRequest(new { message = "كود الخصم غير صالح أو انتهى" });
                    var updated = await _db.StoreCoupons.Where(x => x.Id == appliedCoupon.Id && (!x.UsageLimit.HasValue || x.TimesUsed < x.UsageLimit.Value))
                        .ExecuteUpdateAsync(u => u.SetProperty(x => x.TimesUsed, x => x.TimesUsed + 1));
                    if (updated != 1) return Conflict(new { message = "انتهى حد استخدام الكوبون" });
                    discountAmount = Math.Clamp(appliedCoupon.DiscountType == "Percentage" ? decimal.Round(subtotal * appliedCoupon.DiscountValue / 100, 2) : appliedCoupon.DiscountValue, 0, subtotal);
                }
                var order = new WhatsAppOrder
                {
                    StoreId = store.Id, CustomerName = Sanitizer.Sanitize(request.CustomerName, 100),
                    CustomerPhone = SlugGenerator.NormalizeEgyptianPhone(request.CustomerPhone), CustomerAddress = Sanitizer.Sanitize(request.CustomerAddress, 300),
                    CustomerNotes = Sanitizer.Sanitize(request.CustomerNotes ?? "", 500), PaymentMethod = cash ? "cod" : instapay ? "instapay" : "wallet",
                    PaymentStatus = cash ? "Unpaid" : "AwaitingVerification", TransferReference = request.TransferReference,
                    ItemsJson = JsonSerializer.Serialize(savedItems, CommerceRules.Json), Subtotal = subtotal,
                    DiscountAmount = discountAmount, DeliveryFee = deliveryFee, TotalAmount = subtotal - discountAmount + deliveryFee,
                    CouponCode = appliedCoupon?.Code, ShippingSummary = shippingSummary, Channel = request.Channel,
                    IdempotencyKey = request.IdempotencyKey, RequestHash = hash, InventoryDeducted = true,
                    TrackingToken = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant()
                };
                _db.WhatsAppOrders.Add(order);
                _db.OrderHistories.Add(new OrderHistory { OrderId = order.Id, StoreId = store.Id, Status = "Pending" });
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(BuildResponse(order, store));
            });
        }

        private static CreateOrderResponse BuildResponse(WhatsAppOrder order, Store store)
        {
            var savedItems = JsonSerializer.Deserialize<List<SavedOrderItemRecord>>(order.ItemsJson, CommerceRules.Json) ?? new();
            var subtotal = order.Subtotal;
            var discountAmount = order.DiscountAmount;
            var deliveryFee = order.DeliveryFee;
            var totalAmount = order.TotalAmount;
            var appliedCoupon = string.IsNullOrEmpty(order.CouponCode) ? null : new StoreCoupon { Code = order.CouponCode };
            // Format Arabic WhatsApp message
            var sb = new StringBuilder();
            sb.AppendLine($"🛒 *طلب جديد رقم #{order.OrderNumber}*");
            sb.AppendLine($"🏪 *متجر:* {store.StoreName}");
            sb.AppendLine($"📅 *التاريخ:* {DateTime.UtcNow.AddHours(3):yyyy-MM-dd hh:mm tt}");
            sb.AppendLine("──────────────────────");
            sb.AppendLine("👤 *بيانات العميل:*");
            sb.AppendLine($"• الاسم: {order.CustomerName}");
            sb.AppendLine($"• الهاتف: {order.CustomerPhone}");
            sb.AppendLine($"• العنوان: {order.CustomerAddress}");
            if (!string.IsNullOrWhiteSpace(order.CustomerNotes))
            {
                sb.AppendLine($"• ملاحظات: {order.CustomerNotes}");
            }
            sb.AppendLine("──────────────────────");
            sb.AppendLine("📦 *المنتجات المطلوبة:*");

            int idx = 1;
            foreach (var item in savedItems)
            {
                sb.Append($"{idx++}. *{item.ProductName}*");
                if (item.SelectedVariants != null && item.SelectedVariants.Any())
                {
                    var variantTexts = item.SelectedVariants.Select(kv => $"{kv.Key}: {kv.Value}");
                    sb.Append($" ({string.Join(" - ", variantTexts)})");
                }
                sb.AppendLine();
                sb.AppendLine($"   الكمية: {item.Quantity} × {item.UnitPrice:N2} = {item.Subtotal:N2} {store.Currency}");
            }

            sb.AppendLine("──────────────────────");
            sb.AppendLine($"💵 *المجموع الفرعي:* {subtotal:N2} {store.Currency}");
            if (discountAmount > 0 && appliedCoupon != null)
            {
                sb.AppendLine($"🏷️ *كود الخصم ({appliedCoupon.Code}):* -{discountAmount:N2} {store.Currency}");
            }
            if (deliveryFee > 0)
            {
                sb.AppendLine($"🚚 *رسوم التوصيل:* {deliveryFee:N2} {store.Currency}");
            }
            else
            {
                sb.AppendLine($"🚚 *التوصيل:* مجاني");
            }
            sb.AppendLine($"💰 *الإجمالي المستحق:* *{totalAmount:N2} {store.Currency}*");
            sb.AppendLine("──────────────────────");
            sb.AppendLine($"💳 *طريقة الدفع:* {order.PaymentMethod}");
            if (order.PaymentMethod.Contains("محفظة") || order.PaymentMethod.Contains("كاش") || order.PaymentMethod.Contains("Cash"))
            {
                if (!string.IsNullOrWhiteSpace(store.VodafoneCashNumber))
                {
                    sb.AppendLine($"📱 *رقم التحويل (كاش):* {store.VodafoneCashNumber}");
                }
                sb.AppendLine($"⚠️ _يرجى إرسال لقطة شاشة لإشعار التحويل هنا في المحادثة_");
            }
            else if (order.PaymentMethod.Contains("إنستاباي") || order.PaymentMethod.Contains("InstaPay"))
            {
                if (!string.IsNullOrWhiteSpace(store.InstaPayAddress))
                {
                    sb.AppendLine($"🏦 *عنوان إنستاباي:* {store.InstaPayAddress}");
                }
                sb.AppendLine($"⚠️ _يرجى إرسال لقطة شاشة لإشعار التحويل هنا في المحادثة_");
            }
            sb.AppendLine("──────────────────────");
            sb.AppendLine("⚡ *تم الإرسال عبر منصة WatsStore by Masar Tech*");

            var formattedMessage = sb.ToString();
            var encodedMsg = Uri.EscapeDataString(formattedMessage);

            var storePhone = SlugGenerator.NormalizeEgyptianPhone(store.WhatsAppNumber);
            var whatsAppRedirectUrl = $"https://wa.me/{storePhone}?text={encodedMsg}";

            return new CreateOrderResponse
            {
                Items = savedItems.Select(PublicOrderItemSnapshot.From).ToList(), PaymentMethod = order.PaymentMethod,
                ShippingSummary = order.ShippingSummary, Currency = store.Currency, CreatedAt = order.CreatedAt,
                OrderId = order.Id, OrderNumber = order.OrderNumber, TrackingToken = order.TrackingToken,
                Status = order.Status, PaymentStatus = order.PaymentStatus, Subtotal = order.Subtotal,
                DiscountAmount = order.DiscountAmount, CouponCode = order.CouponCode,
                DeliveryFee = order.DeliveryFee, TotalAmount = order.TotalAmount,
                WhatsAppRedirectUrl = order.Channel == "whatsapp" ? whatsAppRedirectUrl : "", FormattedMessage = formattedMessage
            };
        }

        [HttpGet("track/{token}")]
        public async Task<IActionResult> Track(string storeSlug, string token)
        {
            if (token.Length != 64 || !token.All(Uri.IsHexDigit)) return NotFound();
            Response.Headers["Cache-Control"] = "no-store";
            Response.Headers["Referrer-Policy"] = "no-referrer";
            var order = await _db.WhatsAppOrders.AsNoTracking().Where(o => o.TrackingToken == token && o.Store!.Slug == storeSlug && o.Store.IsActive)
                .Select(o => new { o.OrderNumber, o.Status, o.PaymentStatus, o.PaymentMethod, o.ItemsJson, o.Subtotal, o.DiscountAmount, o.DeliveryFee, o.TotalAmount, o.ShippingSummary, o.CreatedAt, o.StoreId, o.Id, o.Store!.Currency }).SingleOrDefaultAsync();
            if (order == null) return NotFound();
            var history = await _db.OrderHistories.AsNoTracking().Where(x => x.StoreId == order.StoreId && x.OrderId == order.Id).OrderBy(x => x.CreatedAt).Select(x => new { x.Status, x.CreatedAt }).ToListAsync();
            return Ok(new { order.OrderNumber, order.Status, order.PaymentStatus, order.PaymentMethod, order.Currency,
                items = (JsonSerializer.Deserialize<List<SavedOrderItemRecord>>(order.ItemsJson, CommerceRules.Json) ?? new()).Select(PublicOrderItemSnapshot.From),
                order.Subtotal, order.DiscountAmount, order.DeliveryFee, order.TotalAmount, order.ShippingSummary, order.CreatedAt,
                lastUpdatedAt = history.Count > 0 ? history.Max(x => x.CreatedAt) : order.CreatedAt, history });
        }
    }
}
