using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WatsStore.Api.Infrastructure.Email;
using Xunit;

namespace WatsStore.Tests
{
    /// <summary>
    /// Unit tests for BrevoEmailSender.
    /// Uses a FakeHttpMessageHandler — no external dependencies required.
    /// </summary>
    public class EmailTests
    {
        // ── Fake HTTP infrastructure ──────────────────────────────────────────────

        public sealed class CapturedRequest
        {
            public HttpMethod Method { get; set; } = HttpMethod.Get;
            public Uri? RequestUri { get; set; }
            public Dictionary<string, IEnumerable<string>> Headers { get; set; } = new();
            public string Body { get; set; } = string.Empty;
        }

        /// <summary>
        /// Configurable fake handler that records all requests made and returns
        /// pre-configured responses in order.
        /// </summary>
        private sealed class FakeHttpMessageHandler : HttpMessageHandler
        {
            private readonly Queue<HttpResponseMessage> _responses = new();
            public List<CapturedRequest> Requests { get; } = new();

            public void Enqueue(HttpStatusCode statusCode, string content = "{}")
                => _responses.Enqueue(new HttpResponseMessage(statusCode)
                {
                    Content = new StringContent(content, Encoding.UTF8, "application/json")
                });

            protected override async Task<HttpResponseMessage> SendAsync(
                HttpRequestMessage request, CancellationToken cancellationToken)
            {
                var captured = new CapturedRequest
                {
                    Method = request.Method,
                    RequestUri = request.RequestUri,
                    Headers = request.Headers.ToDictionary(h => h.Key, h => h.Value),
                    Body = request.Content != null ? await request.Content.ReadAsStringAsync(cancellationToken) : string.Empty
                };
                Requests.Add(captured);

                if (_responses.TryDequeue(out var response))
                    return response;
                throw new InvalidOperationException("FakeHttpMessageHandler ran out of responses.");
            }
        }

        private static (BrevoEmailSender sender, FakeHttpMessageHandler handler) Build(
            string apiKey = "test-key",
            int maxRetries = 2)
        {
            var handler = new FakeHttpMessageHandler();
            var httpClient = new HttpClient(handler)
            {
                BaseAddress = new Uri("https://api.brevo.com/v3/")
            };

            var factory = new FixedHttpClientFactory(httpClient);

            var options = Options.Create(new BrevoOptions
            {
                ApiKey = apiKey,
                SenderEmail = "noreply@watsstore.com",
                SenderName = "WatsStore",
                TimeoutSeconds = 10,
                MaxRetries = maxRetries
            });

            var sender = new BrevoEmailSender(factory, options, NullLogger<BrevoEmailSender>.Instance);
            return (sender, handler);
        }

        /// <summary>
        /// Wraps a single HttpClient in an IHttpClientFactory — avoids needing Moq.
        /// </summary>
        private sealed class FixedHttpClientFactory : IHttpClientFactory
        {
            private readonly HttpClient _client;
            public FixedHttpClientFactory(HttpClient client) => _client = client;
            public HttpClient CreateClient(string name) => _client;
        }

        // ── Unit Tests ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task SendAsync_SendsCorrectHttpRequest()
        {
            var (sender, handler) = Build();
            handler.Enqueue(HttpStatusCode.Created, @"{""messageId"":""<abc123>""}");

            await sender.SendAsync(
                "buyer@example.com",
                "Test Buyer",
                "Welcome!",
                "<p>Hello</p>",
                "Hello");

            Assert.Single(handler.Requests);
            var req = handler.Requests[0];

            // Correct HTTP method and path
            Assert.Equal(HttpMethod.Post, req.Method);
            Assert.Contains("smtp/email", req.RequestUri!.ToString());

            // api-key header present
            Assert.True(req.Headers.ContainsKey("api-key"));
            var apiKeyHeader = string.Join("", req.Headers["api-key"]);
            Assert.Equal("test-key", apiKeyHeader);

            // Body is valid JSON with required fields
            using var doc = JsonDocument.Parse(req.Body);
            var root = doc.RootElement;

            Assert.Equal("Welcome!", root.GetProperty("subject").GetString());
            Assert.Equal("buyer@example.com",
                root.GetProperty("to")[0].GetProperty("email").GetString());
            Assert.Equal("noreply@watsstore.com",
                root.GetProperty("sender").GetProperty("email").GetString());
            Assert.Equal("<p>Hello</p>", root.GetProperty("htmlContent").GetString());
        }

        [Fact]
        public void Constructor_ThrowsWhenApiKeyEmpty()
        {
            // Arrange
            var handler = new FakeHttpMessageHandler();
            var httpClient = new HttpClient(handler)
            {
                BaseAddress = new Uri("https://api.brevo.com/v3/")
            };
            var factory = new FixedHttpClientFactory(httpClient);
            var options = Options.Create(new BrevoOptions { ApiKey = "" });

            // Act & Assert
            Assert.Throws<InvalidOperationException>(() =>
                new BrevoEmailSender(factory, options, NullLogger<BrevoEmailSender>.Instance));
        }

        [Fact]
        public async Task SendAsync_RetriesOnTransientFailure_And_Succeeds()
        {
            var (sender, handler) = Build(maxRetries: 2);
            // First attempt: 503, second attempt: 201
            handler.Enqueue(HttpStatusCode.ServiceUnavailable);
            handler.Enqueue(HttpStatusCode.Created, @"{""messageId"":""<retry>""}");

            // Should not throw
            await sender.SendAsync("a@b.com", "A", "Sub", "<p>Hi</p>", null);

            // Two HTTP calls were made
            Assert.Equal(2, handler.Requests.Count);
        }

        [Fact]
        public async Task SendAsync_ThrowsAfterAllRetriesExhausted()
        {
            var (sender, handler) = Build(maxRetries: 2);
            // All three attempts fail with 503
            handler.Enqueue(HttpStatusCode.ServiceUnavailable);
            handler.Enqueue(HttpStatusCode.ServiceUnavailable);
            handler.Enqueue(HttpStatusCode.ServiceUnavailable);

            await Assert.ThrowsAsync<HttpRequestException>(async () =>
                await sender.SendAsync("a@b.com", "A", "Sub", "<p>Hi</p>", null));

            Assert.Equal(3, handler.Requests.Count);
        }

        [Fact]
        public async Task SendAsync_DoesNotRetryOn4xx_ClientError()
        {
            var (sender, handler) = Build(maxRetries: 2);
            // 400 is a permanent error — must not retry
            handler.Enqueue(HttpStatusCode.BadRequest, @"{""message"":""invalid sender""}");

            await Assert.ThrowsAsync<HttpRequestException>(async () =>
                await sender.SendAsync("a@b.com", "A", "Sub", "<p>Hi</p>", null));

            // Only one request — no retry on 4xx
            Assert.Single(handler.Requests);
        }

        [Fact]
        public async Task SendAsync_ThrowsWhenToEmailEmpty()
        {
            var (sender, _) = Build();
            await Assert.ThrowsAsync<ArgumentException>(async () =>
                await sender.SendAsync("", "Name", "Sub", "<p>Hi</p>", null));
        }

        [Fact]
        public async Task SendAsync_ThrowsWhenSubjectEmpty()
        {
            var (sender, _) = Build();
            await Assert.ThrowsAsync<ArgumentException>(async () =>
                await sender.SendAsync("a@b.com", "Name", "", "<p>Hi</p>", null));
        }

        [Fact]
        public async Task SendAsync_ApiKeyNeverAppearsInRequestBody()
        {
            var secretKey = "SUPER_SECRET_API_KEY_12345";
            var (sender, handler) = Build(apiKey: secretKey);
            handler.Enqueue(HttpStatusCode.Created, @"{""messageId"":""<x>""}");

            await sender.SendAsync("a@b.com", "A", "Sub", "<p>Hi</p>", null);

            // The API key must never be in the JSON body
            Assert.DoesNotContain(secretKey, handler.Requests[0].Body);
        }
    }

    // ── Integration Tests for Admin Test Email Endpoint ────────────────────────────

    public sealed class AdminEmailEndpointTests
    {
        private sealed class MockEmailSender : IEmailSender
        {
            public List<(string ToEmail, string ToName, string Subject)> Sent { get; } = new();

            public Task SendAsync(
                string toEmail,
                string toName,
                string subject,
                string htmlBody,
                string? plainText = null,
                CancellationToken cancellationToken = default)
            {
                Sent.Add((toEmail, toName, subject));
                return Task.CompletedTask;
            }
        }

        private sealed class EmailTestHost : WebApplicationFactory<Program>
        {
            public const string AdminSecret = "test-admin-secret-key-999";
            public const string ApprovedEmail = "admin-approved@watsstore.com";
            public MockEmailSender MockEmail { get; } = new();

            protected override void ConfigureWebHost(IWebHostBuilder builder)
            {
                var dir = AppContext.BaseDirectory;
                while (!string.IsNullOrEmpty(dir) && !Directory.Exists(Path.Combine(dir, "backend")))
                {
                    var parent = Directory.GetParent(dir);
                    if (parent == null) break;
                    dir = parent.FullName;
                }
                builder.UseContentRoot(Path.Combine(dir, "backend"));
                builder.UseEnvironment("Testing");
                builder.UseSetting("Jwt:SecretKey", CommerceFactory.TestKey);
                builder.UseSetting("AdminSettings:SecretKey", AdminSecret);
                builder.UseSetting("Brevo:TestEmailApprovedAddress", ApprovedEmail);

                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<IEmailSender>();
                    services.AddSingleton<IEmailSender>(MockEmail);
                });
            }
        }

        [Fact]
        public async Task SendTestEmail_ReturnsUnauthorized_WhenNoAdminKeyProvided()
        {
            await using var host = new EmailTestHost();
            var client = host.CreateClient();

            var response = await client.PostAsJsonAsync("/api/admin/email/test", new
            {
                toEmail = EmailTestHost.ApprovedEmail,
                toName = "Admin",
                subject = "Test"
            });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.Empty(host.MockEmail.Sent);
        }

        [Fact]
        public async Task SendTestEmail_ReturnsBadRequest_WhenRecipientNotApproved()
        {
            await using var host = new EmailTestHost();
            var client = host.CreateClient();
            client.DefaultRequestHeaders.Add("X-Admin-Key", EmailTestHost.AdminSecret);

            var response = await client.PostAsJsonAsync("/api/admin/email/test", new
            {
                toEmail = "random-unapproved@example.com",
                toName = "Random User",
                subject = "Test Unapproved"
            });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("غير مدرج", content);
            Assert.Empty(host.MockEmail.Sent);
        }

        [Fact]
        public async Task SendTestEmail_Succeeds_WhenAuthorized_And_RecipientApproved()
        {
            await using var host = new EmailTestHost();
            var client = host.CreateClient();
            client.DefaultRequestHeaders.Add("X-Admin-Key", EmailTestHost.AdminSecret);

            var response = await client.PostAsJsonAsync("/api/admin/email/test", new
            {
                toEmail = EmailTestHost.ApprovedEmail,
                toName = "Admin User",
                subject = "Production Brevo Healthcheck"
            });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("تم إرسال رسالة الاختبار بنجاح", content);

            // Verify email was actually dispatched to the mock sender
            Assert.Single(host.MockEmail.Sent);
            var sent = host.MockEmail.Sent[0];
            Assert.Equal(EmailTestHost.ApprovedEmail, sent.ToEmail);
            Assert.Equal("Admin User", sent.ToName);
            Assert.Equal("Production Brevo Healthcheck", sent.Subject);
        }
    }
}
