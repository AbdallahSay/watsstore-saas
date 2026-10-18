using System;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "اسم التاجر مطلوب")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "اسم التاجر يجب أن يكون بين حرفين و 100 حرف")]
        public string OwnerName { get; set; } = string.Empty;

        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        [StringLength(150, ErrorMessage = "البريد الإلكتروني طويل جداً")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "كلمة المرور يجب أن لا تقل عن 6 أحرف ولا تزيد عن 100 حرف")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "اسم المتجر مطلوب")]
        [StringLength(120, MinimumLength = 2, ErrorMessage = "اسم المتجر يجب أن يكون بين حرفين و 120 حرف")]
        public string StoreName { get; set; } = string.Empty;

        [Required(ErrorMessage = "رقم الواتساب مطلوب")]
        [StringLength(20, MinimumLength = 10, ErrorMessage = "رقم الواتساب غير صالح")]
        public string WhatsAppNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "تصنيف النشاط مطلوب")]
        [StringLength(80, ErrorMessage = "تصنيف النشاط يجب ألا يتجاوز 80 حرف")]
        public string BusinessCategory { get; set; } = "ملابس وأزياء";

        [Required(ErrorMessage = "المحافظة/المدينة مطلوبة")]
        [StringLength(80, ErrorMessage = "المدينة يجب ألا تتجاوز 80 حرف")]
        public string City { get; set; } = "القاهرة";
    }

    public class LoginRequest
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        [StringLength(150, ErrorMessage = "البريد الإلكتروني طويل جداً")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [StringLength(100, ErrorMessage = "كلمة المرور طويلة جداً")]
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
