using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class PlanTierConfigDto
    {
        public string PlanType { get; set; } = string.Empty; // Free, Pro, VIP
        public string Name { get; set; } = string.Empty;
        public decimal PriceMonthly { get; set; }
        public decimal PriceAnnual { get; set; }
        public int MaxProducts { get; set; }
        public int MaxCoupons { get; set; }
        public int AiGenerationsLimit { get; set; }
        public bool ExcelExportAllowed { get; set; }
        public bool IsPopular { get; set; }
    }

    public class AllPlansResponseDto
    {
        public List<PlanTierConfigDto> Plans { get; set; } = new();
        public string VodafoneCashWallet { get; set; } = "01027150123";
        public string InstaPayHandle { get; set; } = "watsstore@instapay";
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class MerchantUpgradeRequest
    {
        [Required(ErrorMessage = "يرجى تحديد نوع الباقة (Pro أو VIP)")]
        [RegularExpression("^(Pro|VIP)$", ErrorMessage = "نوع الباقة غير صالح. يرجى اختيار Pro أو VIP.")]
        public string PlanType { get; set; } = "Pro";

        [Required(ErrorMessage = "يرجى تحديد دورة الفوترة (Monthly أو Annual)")]
        [RegularExpression("^(Monthly|Annual)$", ErrorMessage = "دورة الفوترة غير صالحة. يرجى اختيار Monthly أو Annual.")]
        public string BillingCycle { get; set; } = "Monthly";

        [Required(ErrorMessage = "يرجى تحديد وسيلة الدفع (VodafoneCash أو InstaPay أو OnlineCard)")]
        [RegularExpression("^(VodafoneCash|InstaPay|OnlineCard)$", ErrorMessage = "وسيلة الدفع غير صالحة. الوسائل المعتمدة هي VodafoneCash و InstaPay و OnlineCard.")]
        public string PaymentMethod { get; set; } = "VodafoneCash";

        [Required(AllowEmptyStrings = false, ErrorMessage = "يرجى إدخال رقم العملية أو الحوالة التأكيدية")]
        [MinLength(3, ErrorMessage = "رقم العملية التأكيدي قصير جداً")]
        public string TransactionId { get; set; } = string.Empty;

        public string? Notes { get; set; }
    }

    public class SubscriptionRequestDto
    {
        public Guid Id { get; set; }
        public Guid StoreId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string MerchantEmail { get; set; } = string.Empty;
        public string MerchantPhone { get; set; } = string.Empty;
        public string PlanType { get; set; } = "Pro";
        public string BillingCycle { get; set; } = "Monthly";
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "VodafoneCash";
        public string TransactionId { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string Status { get; set; } = "Pending";
        public string? AdminNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    public class MerchantBillingStatusDto
    {
        public Guid StoreId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string PlanType { get; set; } = "Free";
        public bool IsActive { get; set; } = true;
        public bool IsTrialExpired { get; set; }
        public int RemainingTrialDays { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? SubscriptionEndsAt { get; set; }
        public int AiGenerationsUsed { get; set; }
        public int AiGenerationsLimit { get; set; }
        public int RemainingAiQuota { get; set; }
        public SubscriptionRequestDto? ActivePendingRequest { get; set; }
        public List<SubscriptionRequestDto> InvoiceHistory { get; set; } = new();
        public string VodafoneCashWallet { get; set; } = "01027150123";
        public string InstaPayHandle { get; set; } = "watsstore@instapay";
    }

    public class RejectSubscriptionRequest
    {
        public string? AdminNotes { get; set; }
    }
}
