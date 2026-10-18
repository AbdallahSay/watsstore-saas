using System.Text.RegularExpressions;

namespace WatsStore.Api.Infrastructure.Utils
{
    public static class Sanitizer
    {
        private static readonly Regex HtmlTagRegex = new(@"<[^>]*>", RegexOptions.Compiled);

        public static string Sanitize(string? input, int maxLength = 1000)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            // Strip HTML and script tags
            var clean = HtmlTagRegex.Replace(input, string.Empty);
            clean = clean.Replace("\0", string.Empty).Trim();

            if (clean.Length > maxLength)
            {
                clean = clean.Substring(0, maxLength);
            }

            return clean;
        }
    }
}
