using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;

namespace WatsStore.Api.Controllers
{
    [ApiController]
    [Route("api/merchant/billing")]
    [Authorize]
    [EnableRateLimiting("sensitive-policy")]
    public class MerchantBillingController : ControllerBase
    {
        private readonly AppDbContext _db;

        public MerchantBillingController(AppDbContext db)
        {
            _db = db;
        }

        private Guid? GetCurrentStoreId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(claim, out var storeId))
            {
                return storeId;
            }
            return null;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetBillingStatus()
        {
            var storeId = GetCurrentStoreId();
            if (storeId == null)
                return Unauthorized(new { message = "غير مصرح لك بالوصول، يرجى تسجيل الدخول مجدداً" });

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId.Value);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            // Check and reset monthly AI quota if new month arrived
            store.CheckAndResetMonthlyAiQuota();
            await _db.SaveChangesAsync();

            var settings = await _db.PlatformSettings.AsNoTracking().FirstOrDefaultAsync(p => p.Id == 1)
                           ?? new PlatformSetting();

            var requests = await _db.SubscriptionRequests
                .Where(r => r.StoreId == store.Id)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var pendingRequest = requests.FirstOrDefault(r => r.Status == "Pending");

            int aiLimit = store.GetAiGenerationsLimit();
            int aiRemaining = Math.Max(0, aiLimit - store.AiGenerationsCount);

            var response = new MerchantBillingStatusDto
            {
                StoreId = store.Id,
                StoreName = store.StoreName,
                PlanType = store.PlanType,
                IsActive = store.IsActive,
                IsTrialExpired = store.IsTrialExpired(),
                RemainingTrialDays = store.GetRemainingTrialDays(),
                TrialEndsAt = store.GetEffectiveTrialOrSubscriptionEndsAt(),
                SubscriptionEndsAt = store.SubscriptionEndsAt,
                AiGenerationsUsed = store.AiGenerationsCount,
                AiGenerationsLimit = aiLimit,
                RemainingAiQuota = aiRemaining,
                ActivePendingRequest = pendingRequest == null ? null : MapToDto(pendingRequest),
                InvoiceHistory = requests.Select(MapToDto).ToList(),
                VodafoneCashWallet = string.IsNullOrWhiteSpace(settings.VodafoneCashWallet) ? "01027150123" : settings.VodafoneCashWallet,
                InstaPayHandle = string.IsNullOrWhiteSpace(settings.InstaPayHandle) ? "watsstore@instapay" : settings.InstaPayHandle
            };

            return Ok(response);
        }

        [HttpPost("upgrade-request")]
        public async Task<IActionResult> SubmitUpgradeRequest([FromBody] MerchantUpgradeRequest request)
        {
            var storeId = GetCurrentStoreId();
            if (storeId == null)
                return Unauthorized(new { message = "غير مصرح لك بالوصول، يرجى تسجيل الدخول مجدداً" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId.Value);
            if (store == null)
                return NotFound(new { message = "المتجر غير موجود" });

            var settings = await _db.PlatformSettings.FirstOrDefaultAsync(p => p.Id == 1)
                           ?? new PlatformSetting();

            // Strict Plan validation
            if (!string.Equals(request.PlanType, "Pro", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(request.PlanType, "VIP", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "نوع الباقة غير صالح. يرجى اختيار Pro أو VIP." });
            }
            string targetPlan = string.Equals(request.PlanType, "VIP", StringComparison.OrdinalIgnoreCase) ? "VIP" : "Pro";

            // Strict Billing Cycle validation
            if (!string.Equals(request.BillingCycle, "Monthly", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(request.BillingCycle, "Annual", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "دورة الفوترة غير صالحة. يرجى اختيار Monthly أو Annual." });
            }
            string cycle = string.Equals(request.BillingCycle, "Annual", StringComparison.OrdinalIgnoreCase) ? "Annual" : "Monthly";

            // Strict Payment Method validation
            string[] validMethods = { "VodafoneCash", "InstaPay", "OnlineCard" };
            if (!validMethods.Any(m => string.Equals(m, request.PaymentMethod, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { message = "وسيلة الدفع غير صالحة. الوسائل المعتمدة هي VodafoneCash و InstaPay و OnlineCard." });
            }
            string paymentMethod = validMethods.First(m => string.Equals(m, request.PaymentMethod, StringComparison.OrdinalIgnoreCase));

            // Strict Transaction ID validation
            string transactionId = request.TransactionId?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(transactionId) || transactionId.Length < 3)
            {
                return BadRequest(new { message = "يرجى كتابة رقم العملية أو كود الحوالة التأكيدي (3 أحرف أو أرقام على الأقل)." });
            }

            // Check if transaction ID was already used in a pending or approved request
            bool duplicateTx = await _db.SubscriptionRequests.AnyAsync(r => 
                r.TransactionId == transactionId && (r.Status == "Pending" || r.Status == "Approved"));
            if (duplicateTx)
            {
                return BadRequest(new { message = "رقم العملية هذا مسجل بالفعل ومستخدم في طلب سابق" });
            }

            decimal amount = 0m;
            if (targetPlan == "VIP")
            {
                amount = cycle == "Annual" ? settings.VipAnnualPrice : settings.VipMonthlyPrice;
            }
            else
            {
                amount = cycle == "Annual" ? settings.ProAnnualPrice : settings.ProMonthlyPrice;
            }

            var subRequest = new SubscriptionRequest
            {
                Id = Guid.NewGuid(),
                StoreId = store.Id,
                StoreName = store.StoreName,
                MerchantEmail = store.Email,
                MerchantPhone = store.WhatsAppNumber,
                PlanType = targetPlan,
                BillingCycle = cycle,
                Amount = amount,
                PaymentMethod = paymentMethod,
                TransactionId = transactionId,
                Notes = request.Notes?.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            // Automated Payment Hook simulation for Online Card:
            if (string.Equals(paymentMethod, "OnlineCard", StringComparison.OrdinalIgnoreCase))
            {
                // Instant activation
                subRequest.Status = "Approved";
                subRequest.ReviewedAt = DateTime.UtcNow;
                subRequest.AdminNotes = "تم التفعيل التلقائي الفوري عبر بوابة الدفع الإلكتروني";

                store.PlanType = targetPlan;
                store.AiGenerationsCount = 0;
                store.AiQuotaResetDate = DateTime.UtcNow;

                int daysToAdd = cycle == "Annual" ? 365 : 30;
                var baseDate = (store.SubscriptionEndsAt.HasValue && store.SubscriptionEndsAt.Value > DateTime.UtcNow)
                    ? store.SubscriptionEndsAt.Value
                    : DateTime.UtcNow;

                store.SubscriptionEndsAt = baseDate.AddDays(daysToAdd);

                _db.SubscriptionRequests.Add(subRequest);
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    message = $"تم الدفع الإلكتروني بنجاح وترقية متجرك إلى باقة {targetPlan} فوراً! 🎉",
                    status = "Approved",
                    requestId = subRequest.Id,
                    planType = store.PlanType,
                    subscriptionEndsAt = store.SubscriptionEndsAt
                });
            }

            // Vodafone Cash or InstaPay: pending review
            _db.SubscriptionRequests.Add(subRequest);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "تم إرسال طلب الترقية وإيصال التحويل بنجاح! سيتم مراجعة الطلب وتفعيل الباقة فورياً خلال دقائق.",
                status = "Pending",
                requestId = subRequest.Id,
                planType = targetPlan,
                amount = amount
            });
        }

        [HttpPost("webhook/simulate")]
        public async Task<IActionResult> SimulateWebhook([FromBody] SimulateWebhookRequest req)
        {
            if (req.RequestId == Guid.Empty)
                return BadRequest(new { message = "معرف الطلب غير صالح" });

            var subRequest = await _db.SubscriptionRequests
                .Include(r => r.Store)
                .FirstOrDefaultAsync(r => r.Id == req.RequestId);

            if (subRequest == null)
                return NotFound(new { message = "طلب الاشتراك غير موجود" });

            if (subRequest.Status == "Approved")
                return Ok(new { message = "الطلب مفعل بالفعل", status = "Approved" });

            subRequest.Status = "Approved";
            subRequest.ReviewedAt = DateTime.UtcNow;
            subRequest.AdminNotes = "تم الاعتماد التلقائي عبر الويب هوك السحابي (Simulated Webhook Hook)";

            if (subRequest.Store != null)
            {
                subRequest.Store.PlanType = subRequest.PlanType;
                subRequest.Store.AiGenerationsCount = 0;
                subRequest.Store.AiQuotaResetDate = DateTime.UtcNow;

                int daysToAdd = subRequest.BillingCycle == "Annual" ? 365 : 30;
                var baseDate = (subRequest.Store.SubscriptionEndsAt.HasValue && subRequest.Store.SubscriptionEndsAt.Value > DateTime.UtcNow)
                    ? subRequest.Store.SubscriptionEndsAt.Value
                    : DateTime.UtcNow;

                subRequest.Store.SubscriptionEndsAt = baseDate.AddDays(daysToAdd);
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "تم تفعيل الاشتراك والترقية بنجاح عبر الويب هوك",
                status = "Approved",
                storeName = subRequest.Store?.StoreName,
                plan = subRequest.PlanType
            });
        }

        [HttpGet("requests/{id}")]
        public async Task<IActionResult> GetBillingRequestById(Guid id)
        {
            var storeId = GetCurrentStoreId();
            if (storeId == null)
                return Unauthorized(new { message = "غير مصرح لك بالوصول، يرجى تسجيل الدخول مجدداً" });

            var sub = await _db.SubscriptionRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (sub == null)
                return NotFound(new { message = "طلب الاشتراك غير موجود" });

            if (sub.StoreId != storeId.Value)
            {
                return StatusCode(403, new { message = "غير مصرح لك بالوصول إلى بيانات متجر آخر (Cross-Tenant Access Forbidden)" });
            }

            return Ok(MapToDto(sub));
        }

        private static SubscriptionRequestDto MapToDto(SubscriptionRequest r)
        {
            return new SubscriptionRequestDto
            {
                Id = r.Id,
                StoreId = r.StoreId,
                StoreName = r.StoreName,
                MerchantEmail = r.MerchantEmail,
                MerchantPhone = r.MerchantPhone,
                PlanType = r.PlanType,
                BillingCycle = r.BillingCycle,
                Amount = r.Amount,
                PaymentMethod = r.PaymentMethod,
                TransactionId = r.TransactionId,
                Notes = r.Notes,
                Status = r.Status,
                AdminNotes = r.AdminNotes,
                CreatedAt = r.CreatedAt,
                ReviewedAt = r.ReviewedAt
            };
        }
    }

    public class SimulateWebhookRequest
    {
        public Guid RequestId { get; set; }
    }
}
