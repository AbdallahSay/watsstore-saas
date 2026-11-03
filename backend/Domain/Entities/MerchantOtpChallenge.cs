using System;

namespace WatsStore.Api.Domain.Entities
{
    public class MerchantOtpChallenge
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid StoreId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        
        /// <summary>
        /// Purpose of the challenge: "EmailVerification", "PasswordRecovery", "PhoneVerification", "EmailChange"
        /// </summary>
        public string Purpose { get; set; } = string.Empty;

        /// <summary>
        /// SHA-256 keyed hash of the code + salt. Never store plaintext.
        /// </summary>
        public string CodeHash { get; set; } = string.Empty;
        
        /// <summary>
        /// Cryptographic salt used for hashing.
        /// </summary>
        public string Salt { get; set; } = string.Empty;

        /// <summary>
        /// Number of incorrect attempts. Max 5.
        /// </summary>
        public int Attempts { get; set; } = 0;
        public int MaxAttempts { get; set; } = 5;

        public bool IsUsed { get; set; } = false;
        public DateTime? UsedAt { get; set; }

        /// <summary>
        /// Single-use recovery token issued upon successful OTP verification for password reset.
        /// </summary>
        public string? RecoveryToken { get; set; }
        public DateTime? RecoveryTokenExpiresAt { get; set; }

        public string? IpAddress { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Store? Store { get; set; }

        public bool IsExpired => DateTime.UtcNow > ExpiresAt;
        public bool IsLocked => Attempts >= MaxAttempts;
    }
}
