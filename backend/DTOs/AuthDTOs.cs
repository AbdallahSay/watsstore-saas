using System;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "اسم التاجر مطلوب")]
        public string OwnerName { get; set; } = string.Empty;

        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [MinLength(6, ErrorMessage = "كلمة المرور يجب أن لا تقل عن 6 أحرف")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "اسم المتجر مطلوب")]
        public string StoreName { get; set; } = string.Empty;

        [Required(ErrorMessage = "رقم الواتساب مطلوب")]
        public string WhatsAppNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "تصنيف النشاط مطلوب")]
        public string BusinessCategory { get; set; } = "ملابس وأزياء";

        [Required(ErrorMessage = "المحافظة/المدينة مطلوبة")]
        public string City { get; set; } = "القاهرة";
    }

    public class LoginRequest
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public Guid StoreId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string PublicCode { get; set; } = string.Empty;
        public string PlanType { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string WhatsAppNumber { get; set; } = string.Empty;
        public string ThemeColor { get; set; } = "#10B981";
        public string Currency { get; set; } = "ج.م";
        public string City { get; set; } = string.Empty;
        public string BusinessCategory { get; set; } = string.Empty;
    }
}
