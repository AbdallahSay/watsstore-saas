using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WatsStore.Api.DTOs
{
    public class AdminLoginRequest
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? SecretKey { get; set; }
    }

    public class AdminLoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = "Admin";
    }

    public class AdminStoreSummaryDto
    {
        public Guid Id { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string WhatsAppNumber { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string PublicCode { get; set; } = string.Empty;
        public string Subdomain { get; set; } = string.Empty;
        public string BusinessCategory { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PlanType { get; set; } = "Free";
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int OrdersCount { get; set; }
        public int ProductsCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public long ViewCount { get; set; }
    }

    public class AdminPlatformStatsDto
    {
        public int TotalStores { get; set; }
        public int ActiveStores { get; set; }
        public int SuspendedStores { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalProducts { get; set; }
        public int TotalReviews { get; set; }
        public long TotalViews { get; set; }
        public List<AdminStoreSummaryDto> RecentStores { get; set; } = new();
        public List<AdminStoreSummaryDto> TopStores { get; set; } = new();
    }

    public class ToggleStoreStatusResponse
    {
        public Guid Id { get; set; }
        public bool IsActive { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class AdminChangePasswordRequest
    {
        [Required(ErrorMessage = "كلمة المرور الحالية مطلوبة")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور الجديدة مطلوبة")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "كلمة المرور الجديدة يجب أن تكون بين 6 و 100 حرف")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class AdminForgotPasswordRequest
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة")]
        public string Email { get; set; } = string.Empty;
    }

    public class AdminForgotPasswordResponse
    {
        public string Message { get; set; } = string.Empty;
        public string ResetToken { get; set; } = string.Empty;
        public int ExpiresInMinutes { get; set; } = 15;
    }

    public class AdminResetPasswordRequest
    {
        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "رمز استعادة كلمة المرور مطلوب")]
        public string ResetToken { get; set; } = string.Empty;

        [Required(ErrorMessage = "كلمة المرور الجديدة مطلوبة")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "كلمة المرور الجديدة يجب أن تكون بين 6 و 100 حرف")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
