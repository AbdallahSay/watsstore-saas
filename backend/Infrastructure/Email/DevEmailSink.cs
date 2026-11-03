using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace WatsStore.Api.Infrastructure.Email
{
    public record SentEmailRecord(
        string ToEmail,
        string ToName,
        string Subject,
        string HtmlBody,
        string? PlainText,
        DateTime SentAt);

    /// <summary>
    /// Safe in-memory development and integration test email sink.
    /// Captures transactional emails for test assertions without making external network calls.
    /// Never logs OTP codes or sensitive credentials to production logs.
    /// </summary>
    public sealed class DevEmailSink : IEmailSender
    {
        private readonly ILogger<DevEmailSink>? _logger;
        public static readonly ConcurrentBag<SentEmailRecord> SentEmails = new();

        public DevEmailSink(ILogger<DevEmailSink>? logger = null)
        {
            _logger = logger;
        }

        public Task SendAsync(
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

            var record = new SentEmailRecord(
                toEmail,
                toName,
                subject,
                htmlBody,
                plainText,
                DateTime.UtcNow);

            SentEmails.Add(record);

            _logger?.LogInformation(
                "Captured transactional email in DevEmailSink for {Domain} with subject length {Length}",
                GetDomain(toEmail),
                subject.Length);

            return Task.CompletedTask;
        }

        public static void Clear()
        {
            while (SentEmails.TryTake(out _)) { }
        }

        private static string GetDomain(string email)
        {
            var atIndex = email.LastIndexOf('@');
            return atIndex >= 0 ? email[(atIndex + 1)..] : "[unknown]";
        }
    }
}
