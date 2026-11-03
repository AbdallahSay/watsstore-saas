using System;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class ForgotPasswordRequest
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyRecoveryCodeRequest
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "رمز التحقق مطلوب")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "رمز التحقق يجب أن يتكون من 6 أرقام")]
        public string Code { get; set; } = string.Empty;
    }

    public class VerifyRecoveryCodeResponse
    {
        public bool Success { get; set; } = true;
        public string RecoveryToken { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int ExpiresInMinutes { get; set; } = 15;
    }

    public class ResetPasswordRequest
    {
        [Required(ErrorMessage = "رمز استعادة الجلسة مطلوب")]
        public string RecoveryToken { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور الجديدة مطلوبة")]
        [MinLength(6, ErrorMessage = "كلمة المرور يجب ألا تقل عن 6 أحرف")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class VerifyEmailRequest
    {
        public string? Email { get; set; }

        [Required(ErrorMessage = "رمز التحقق مطلوب")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "رمز التحقق يجب أن يتكون من 6 أرقام")]
        public string Code { get; set; } = string.Empty;
    }

    public class ResendEmailOtpRequest
    {
        public string? Email { get; set; }
    }

    public class ChangeMerchantPasswordRequest
    {
        [Required(ErrorMessage = "كلمة المرور الحالية مطلوبة")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور الجديدة مطلوبة")]
        [MinLength(6, ErrorMessage = "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class MerchantSecurityStatusResponse
    {
        public string Email { get; set; } = string.Empty;
        public bool EmailVerified { get; set; }
        public DateTime? EmailVerifiedAt { get; set; }
        public string EmailVerificationStatus { get; set; } = "Pending";
        public string WhatsAppNumber { get; set; } = string.Empty;
        public bool PhoneVerified { get; set; }
        public DateTime? PhoneVerifiedAt { get; set; }
        public DateTime? PasswordChangedAt { get; set; }
        public bool CanPublishStore { get; set; }
    }
}
