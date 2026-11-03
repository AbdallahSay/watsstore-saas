namespace WatsStore.Api.Infrastructure.Email
{
    /// <summary>
    /// Brevo transactional email provider configuration.
    /// Bound from the "Brevo" configuration section.
    /// </summary>
    public sealed class BrevoOptions
    {
        public string ApiKey { get; set; } = string.Empty;
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = "https://api.brevo.com/v3";
        public int TimeoutSeconds { get; set; } = 15;
        public int MaxRetries { get; set; } = 2;
    }
}
