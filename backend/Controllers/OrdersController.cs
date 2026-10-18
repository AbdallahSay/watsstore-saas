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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Items == null || !request.Items.Any())
                return BadRequest(new { message = "سلة المشتريات فارغة. يرجى اختيار منتج واحد على الأقل." });

            var normalizedSlug = storeSlug.Trim().ToLowerInvariant();

            var store = await _db.Stores
                .FirstOrDefaultAsync(s => s.Slug == normalizedSlug && s.IsActive);

            if (store == null)
                return NotFound(new { message = "المتجر غير موجود أو غير نشط حالياً." });

            if (store.IsTrialExpired())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { 
                    isTrialExpired = true, 
                    message = "هذا المتجر غير متاح لاستقبال الطلبات حالياً نظراً لانتهاء الفترة التجريبية المجانية الخاصة به. يرجى التواصل مع صاحب المتجر لتفعيل باقة الاشتراك." 
                });
            }

            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();

            // Fetch actual database prices to guarantee security and prevent tampering
            var dbProducts = await _db.Products
                .Where(p => productIds.Contains(p.Id) && p.StoreId == store.Id && p.IsAvailable)
                .ToDictionaryAsync(p => p.Id);

            if (dbProducts.Count != productIds.Count)
            {
                return BadRequest(new { message = "بعض المنتجات المحددة غير متوفرة حالياً أو لا تتبع هذا المتجر." });
            }

            decimal subtotal = 0m;
            var savedItems = new List<SavedOrderItemRecord>();

            foreach (var itemReq in request.Items)
            {
                var dbProd = dbProducts[itemReq.ProductId];
                var lineTotal = dbProd.Price * itemReq.Quantity;
                subtotal += lineTotal;

                savedItems.Add(new SavedOrderItemRecord
                {
                    ProductId = dbProd.Id,
                    ProductName = dbProd.Name,
                    UnitPrice = dbProd.Price,
                    Quantity = itemReq.Quantity,
                    Subtotal = lineTotal,
                    SelectedVariants = itemReq.SelectedVariants
                });
            }

            // Coupon Code Validation & Discount Engine
            decimal discountAmount = 0m;
            StoreCoupon? appliedCoupon = null;

            if (!string.IsNullOrWhiteSpace(request.CouponCode))
            {
                var couponCode = request.CouponCode.Trim().ToUpperInvariant();
                appliedCoupon = await _db.StoreCoupons
                    .FirstOrDefaultAsync(c => c.StoreId == store.Id && c.Code == couponCode && c.IsActive);

                if (appliedCoupon != null)
                {
                    bool isExpired = appliedCoupon.ExpiryDate.HasValue && appliedCoupon.ExpiryDate.Value < DateTime.UtcNow;
                    bool limitExceeded = appliedCoupon.UsageLimit.HasValue && appliedCoupon.TimesUsed >= appliedCoupon.UsageLimit.Value;

                    if (!isExpired && !limitExceeded)
                    {
                        if (string.Equals(appliedCoupon.DiscountType, "Percentage", StringComparison.OrdinalIgnoreCase))
                        {
                            discountAmount = Math.Round(subtotal * (appliedCoupon.DiscountValue / 100m), 2);
                        }
                        else
                        {
                            discountAmount = appliedCoupon.DiscountValue;
                        }

                        discountAmount = Math.Clamp(discountAmount, 0, subtotal);
                        appliedCoupon.TimesUsed++; // Increment usage count
                    }
                }
            }

            var deliveryFee = store.DeliveryFee;
            var discountedSubtotal = subtotal - discountAmount;
            var totalAmount = discountedSubtotal + deliveryFee;

            var cleanCustomerName = Sanitizer.Sanitize(request.CustomerName, 100);
            var cleanCustomerAddress = Sanitizer.Sanitize(request.CustomerAddress, 250);
            var cleanCustomerNotes = string.IsNullOrWhiteSpace(request.CustomerNotes) ? null : Sanitizer.Sanitize(request.CustomerNotes, 500);
            var cleanPaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) 
                ? "الدفع عند الاستلام" 
                : Sanitizer.Sanitize(request.PaymentMethod, 50);

            var normalizedCustomerPhone = SlugGenerator.NormalizeEgyptianPhone(request.CustomerPhone);
            var itemsJson = JsonSerializer.Serialize(savedItems);

            var order = new WhatsAppOrder
            {
                Id = Guid.NewGuid(),
                StoreId = store.Id,
                CustomerName = cleanCustomerName,
                CustomerPhone = normalizedCustomerPhone,
                CustomerAddress = cleanCustomerAddress,
                CustomerNotes = cleanCustomerNotes,
                PaymentMethod = cleanPaymentMethod,
                ItemsJson = itemsJson,
                TotalAmount = totalAmount,
                CreatedAt = DateTime.UtcNow
            };

            _db.WhatsAppOrders.Add(order);
            await _db.SaveChangesAsync(); // Auto-generates OrderNumber (e.g. 1001)

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

            return Ok(new CreateOrderResponse
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                Subtotal = subtotal,
                DiscountAmount = discountAmount,
                CouponCode = appliedCoupon?.Code,
                DeliveryFee = deliveryFee,
                TotalAmount = totalAmount,
                WhatsAppRedirectUrl = whatsAppRedirectUrl,
                FormattedMessage = formattedMessage
            });
        }
    }
}
