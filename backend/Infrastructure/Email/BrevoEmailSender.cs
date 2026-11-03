using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace WatsStore.Api.Infrastructure.Email
{
    /// <summary>
    /// Sends transactional emails via the Brevo SMTP API (v3).
    /// Uses IHttpClientFactory for proper socket lifecycle management.
    /// Implements manual exponential-backoff retry to avoid adding Polly as a dependency.
    /// </summary>
    public sealed class BrevoEmailSender : IEmailSender
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly BrevoOptions _options;
        private readonly ILogger<BrevoEmailSender> _logger;

        private static readonly int[] RetryDelaysMs = { 1_000, 2_000 };

        public BrevoEmailSender(
            IHttpClientFactory httpClientFactory,
            IOptions<BrevoOptions> options,
            ILogger<BrevoEmailSender> logger)
        {
            _httpClientFactory = httpClientFactory;
            _options = options.Value;
            _logger = logger;

            // Fail fast at startup if the API key is missing
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
                throw new InvalidOperationException(
                    "Brevo API key is not configured. Set the 'Brevo__ApiKey' environment variable on the hosting server.");
        }

        /// <inheritdoc />
        public async Task SendAsync(
            string toEmail,
            string toName,
            string subject,
            string htmlBody,
            string? plainText = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new ArgumentException("Recipient email address is required.", nameof(toEmail));
            if (string.IsNullOrWhiteSpace(subject))
                throw new ArgumentException("Email subject is required.", nameof(subject));

            var payload = new
            {
                sender = new { name = _options.SenderName, email = _options.SenderEmail },
                to = new[] { new { email = toEmail, name = toName } },
                subject,
                htmlContent = htmlBody,
                textContent = plainText
            };

            int attempt = 0;
            int maxAttempts = Math.Max(1, _options.MaxRetries + 1);

            while (true)
            {
                attempt++;
                HttpResponseMessage response;

                try
                {
                    var client = _httpClientFactory.CreateClient("brevo");

                    using var request = new HttpRequestMessage(HttpMethod.Post, "smtp/email");
                    request.Headers.Add("api-key", _options.ApiKey);
                    request.Content = JsonContent.Create(payload);

                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    cts.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));

                    response = await client.SendAsync(request, cts.Token);
                }
                catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                {
                    _logger.LogError(
                        "Brevo email request timed out on attempt {Attempt}/{MaxAttempts}.",
                        attempt, maxAttempts);

                    if (attempt >= maxAttempts)
                        throw new HttpRequestException($"Brevo email API timed out after {attempt} attempt(s).");

                    int delayMs = attempt <= RetryDelaysMs.Length ? RetryDelaysMs[attempt - 1] : RetryDelaysMs[^1];
                    await Task.Delay(delayMs, cancellationToken);
                    continue;
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Transient HTTP connection error on Brevo email attempt {Attempt}/{MaxAttempts}.",
                        attempt, maxAttempts);

                    if (attempt >= maxAttempts)
                        throw;

                    int delayMs = attempt <= RetryDelaysMs.Length ? RetryDelaysMs[attempt - 1] : RetryDelaysMs[^1];
                    await Task.Delay(delayMs, cancellationToken);
                    continue;
                }

                using (response)
                {
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation(
                            "Email sent successfully via Brevo. To: {RecipientDomain}, Subject length: {SubjectLength}, Attempt: {Attempt}",
                            GetDomain(toEmail), subject.Length, attempt);
                        return;
                    }

                    var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning(
                        "Brevo returned non-success status {StatusCode} on attempt {Attempt}/{MaxAttempts}. Response length: {Length}",
                        (int)response.StatusCode, attempt, maxAttempts, errorBody.Length);

                    // Treat 429 and 5xx as transient; anything else (e.g. 400 Bad Request, 401 Unauthorized) is permanent
                    bool isTransient = (int)response.StatusCode == 429 || (int)response.StatusCode >= 500;
                    if (!isTransient || attempt >= maxAttempts)
                    {
                        throw new HttpRequestException(
                            $"Brevo email API returned HTTP {(int)response.StatusCode} after {attempt} attempt(s).");
                    }
                }

                // Wait before next retry for transient errors
                int retryDelayMs = attempt <= RetryDelaysMs.Length ? RetryDelaysMs[attempt - 1] : RetryDelaysMs[^1];
                await Task.Delay(retryDelayMs, cancellationToken);
            }
        }

        /// <summary>Returns only the domain part of an email address to avoid logging PII.</summary>
        private static string GetDomain(string email)
        {
            var atIndex = email.LastIndexOf('@');
            return atIndex >= 0 ? email[(atIndex + 1)..] : "[unknown]";
        }
    }
}
