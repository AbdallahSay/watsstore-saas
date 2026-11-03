using System;
using System.Security.Cryptography;
using System.Text;

namespace WatsStore.Api.Infrastructure.Security
{
    public static class OtpHasher
    {
        /// <summary>
        /// Generates a non-predictable 6-digit verification code.
        /// </summary>
        public static string GenerateCode()
        {
            int code = RandomNumberGenerator.GetInt32(100000, 1000000);
            return code.ToString("D6");
        }

        /// <summary>
        /// Generates a random cryptographic salt.
        /// </summary>
        public static string GenerateSalt()
        {
            byte[] bytes = RandomNumberGenerator.GetBytes(16);
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        /// <summary>
        /// Keyed SHA-256 hash of the code with salt.
        /// </summary>
        public static string HashCode(string code, string salt)
        {
            var combined = Encoding.UTF8.GetBytes($"{salt}:{code}:watsstore-secure-otp-pepper");
            var hash = SHA256.HashData(combined);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        /// <summary>
        /// Verifies an input code against the stored hash in constant time.
        /// </summary>
        public static bool VerifyCode(string inputCode, string salt, string storedHash)
        {
            if (string.IsNullOrWhiteSpace(inputCode) || string.IsNullOrWhiteSpace(storedHash) || string.IsNullOrWhiteSpace(salt))
                return false;

            var computedHash = HashCode(inputCode.Trim(), salt);
            var computedBytes = Encoding.UTF8.GetBytes(computedHash);
            var storedBytes = Encoding.UTF8.GetBytes(storedHash);

            if (computedBytes.Length != storedBytes.Length)
                return false;

            return CryptographicOperations.FixedTimeEquals(computedBytes, storedBytes);
        }

        /// <summary>
        /// Generates a single-use high-entropy recovery session token (64 hex characters).
        /// </summary>
        public static string GenerateRecoveryToken()
        {
            byte[] bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
