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

    public class GatewayAccountItemDto
    {
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string? QrCodeUrl { get; set; }
    }

    public class PaymentGatewayDto
    {
        public int Id { get; set; }
        public string GatewayKey { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public string Instructions { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public List<GatewayAccountItemDto> Accounts { get; set; } = new();
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateSinglePaymentGatewayRequest
    {
        [Required(ErrorMessage = "مفتاح وسيلة الدفع مطلوب")]
        public string GatewayKey { get; set; } = string.Empty;

        [Required(ErrorMessage = "اسم وسيلة الدفع مطلوب")]
        public string DisplayName { get; set; } = string.Empty;

        public bool IsEnabled { get; set; } = true;
        public string Instructions { get; set; } = string.Empty;
        public int SortOrder { get; set; } = 0;
        public List<GatewayAccountItemDto> Accounts { get; set; } = new();
    }

    public class UpdatePaymentGatewaysRequest
    {
        public List<UpdateSinglePaymentGatewayRequest> Gateways { get; set; } = new();
    }

    public class MerchantUpgradeRequest
    {
        [Required(ErrorMessage = "يرجى تحديد نوع الباقة (Pro أو VIP)")]
        [RegularExpression("^(Pro|VIP)$", ErrorMessage = "نوع الباقة غير صالح. يرجى اختيار Pro أو VIP.")]
        public string PlanType { get; set; } = "Pro";

        [Required(ErrorMessage = "يرجى تحديد دورة الفوترة (Monthly أو Annual)")]
        [RegularExpression("^(Monthly|Annual)$", ErrorMessage = "دورة الفوترة غير صالحة. يرجى اختيار Monthly أو Annual.")]
        public string BillingCycle { get; set; } = "Monthly";

        [Required(ErrorMessage = "يرجى تحديد وسيلة الدفع")]
        [MaxLength(50, ErrorMessage = "اسم وسيلة الدفع يجب ألا يتجاوز 50 حرفاً")]
        public string PaymentMethod { get; set; } = "VodafoneCash";

        [MaxLength(100, ErrorMessage = "رقم الحساب المحول إليه يجب ألا يتجاوز 100 حرف")]
        public string? DestinationAccount { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "يرجى إدخال رقم العملية أو الحوالة التأكيدية")]
        [MinLength(6, ErrorMessage = "رقم العملية التأكيدي يجب أن يكون 6 أحرف أو أرقام على الأقل")]
        [MaxLength(50, ErrorMessage = "رقم العملية التأكيدي يجب ألا يتجاوز 50 حرفاً")]
        public string TransactionId { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "رقم المحفظة أو حساب المحول منه يجب ألا يتجاوز 100 حرف")]
        public string? SenderIdentifier { get; set; }

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
        public string? DestinationAccount { get; set; }
        public string? SenderIdentifier { get; set; }
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
        public List<PaymentGatewayDto> ActivePaymentGateways { get; set; } = new();
    }

    public class RejectSubscriptionRequest
    {
        public string? AdminNotes { get; set; }
    }
}
