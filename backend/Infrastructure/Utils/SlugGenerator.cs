using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace WatsStore.Api.Infrastructure.Utils
{
    public static class SlugGenerator
    {
        public static string GenerateSlug(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return Guid.NewGuid().ToString("N")[..8];

            // Normalize and lowercase
            string text = input.Trim().ToLowerInvariant();

            // Replace characters other than alphanumeric and Arabic characters
            // Arabic unicode range: \u0600-\u06FF
            text = Regex.Replace(text, @"[^a-z0-9\u0600-\u06FF\s-]", "");

            // Replace spaces with hyphens
            text = Regex.Replace(text, @"\s+", "-");

            // Replace multiple consecutive hyphens with a single hyphen
            text = Regex.Replace(text, @"-+", "-");

            // Trim hyphens from ends
            text = text.Trim('-');

            if (string.IsNullOrWhiteSpace(text))
                return Guid.NewGuid().ToString("N")[..8];

            return text;
        }

        public static string GeneratePublicCode(int length = 10)
        {
            const string chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
            var bytes = new byte[length];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);

            var result = new StringBuilder(length);
            for (int i = 0; i < length; i++)
            {
                result.Append(chars[bytes[i] % chars.Length]);
            }
            return result.ToString();
        }

        public static string NormalizeEgyptianPhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return string.Empty;

            // Remove non-digit characters
            string digits = Regex.Replace(phone, @"[^\d]", "");

            // If starts with 0020, change to 20
            if (digits.StartsWith("0020"))
                digits = digits.Substring(2);

            // If starts with +20 or 20 and has 12 digits (201xxxxxxxxx)
            if (digits.StartsWith("20") && digits.Length == 12)
                return digits;

            // If Egyptian local format starting with 01 (010, 011, 012, 015) with 11 digits
            if (digits.StartsWith("01") && digits.Length == 11)
                return "20" + digits.Substring(1);

            // If 10 digits starting with 1 (10, 11, 12, 15)
            if (digits.StartsWith("1") && digits.Length == 10)
                return "20" + digits;

            // Fallback: return digits or original
            return digits;
        }

        public static bool IsValidEgyptianMobile(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return false;

            string digits = Regex.Replace(phone, @"[^\d]", "");

            return Regex.IsMatch(digits, @"^(?:01[0125]\d{8}|201[0125]\d{8}|00201[0125]\d{8})$");
        }
    }
}
