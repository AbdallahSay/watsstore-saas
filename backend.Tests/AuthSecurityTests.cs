using System;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Email;
using WatsStore.Api.Infrastructure.Security;
using Xunit;

namespace WatsStore.Tests
{
    public class AuthSecurityTests
    {
        [Fact]
        public async Task Registration_creates_challenge_sends_email_and_marks_email_unverified()
        {
            await using var app = new CommerceFactory();
            var client = app.CreateClient();
            DevEmailSink.Clear();

            var regRequest = new RegisterRequest
            {
                OwnerName = "تاجر جديد",
                Email = $"merchant_{Guid.NewGuid():N}@test.invalid",
                Password = "ValidPassword123!",
                StoreName = "متجر الاختبار الأمني",
                WhatsAppNumber = "01011112222",
                BusinessCategory = "ملابس وأزياء",
                City = "القاهرة"
            };

            var response = await client.PostAsJsonAsync("/api/auth/register", regRequest);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
            Assert.NotNull(result);
            Assert.False(result.EmailVerified);
            Assert.Equal("Pending", result.EmailVerificationStatus);

            // Assert email captured in DevEmailSink
            var sent = DevEmailSink.SentEmails.FirstOrDefault(e => e.ToEmail == regRequest.Email);
            Assert.NotNull(sent);
            Assert.Contains("تأكيد البريد الإلكتروني", sent.Subject);

            // Assert challenge exists in DB
            await app.WithDb(async db =>
            {
                var challenge = await db.MerchantOtpChallenges.FirstOrDefaultAsync(c => c.StoreId == result.StoreId && c.Purpose == "EmailVerification");
                Assert.NotNull(challenge);
                Assert.False(challenge.IsUsed);
                Assert.Equal(0, challenge.Attempts);
            });
        }

        [Fact]
        public async Task Unverified_merchant_is_blocked_from_publishing_storefront()
        {
            await using var app = new CommerceFactory();
            var client = app.CreateClient();

            // Register fresh unverified merchant
            var regRequest = new RegisterRequest
            {
                OwnerName = "تاجر غير مؤكد",
                Email = $"unverified_{Guid.NewGuid():N}@test.invalid",
                Password = "ValidPassword123!",
                StoreName = "متجر غير مؤكد",
                WhatsAppNumber = "01022223333",
                BusinessCategory = "ملابس وأزياء",
                City = "الجيزة"
            };

            var regResponse = await client.PostAsJsonAsync("/api/auth/register", regRequest);
            var auth = await regResponse.Content.ReadFromJsonAsync<AuthResponse>();

            var merchantClient = app.CreateClient();
            merchantClient.DefaultRequestHeaders.Authorization = new("Bearer", auth!.Token);

            // Save draft settings
            var config = new CommerceSettingsRequest { DraftTheme = "street-pulse", CheckoutMode = "both", CashOnDelivery = true };
            var saveRes = await merchantClient.PutAsJsonAsync("/api/merchant/commerce/settings", config);
            Assert.Equal(HttpStatusCode.OK, saveRes.StatusCode);

            // Attempt publishing -> must be blocked with HTTP 403 Forbidden!
            var publishRes = await merchantClient.PostAsync("/api/merchant/commerce/theme/publish", null);
            Assert.Equal(HttpStatusCode.Forbidden, publishRes.StatusCode);
            var errorBody = await publishRes.Content.ReadAsStringAsync();
            Assert.Contains("يلزم تأكيد ملكية البريد الإلكتروني", errorBody);
        }

        [Fact]
        public async Task Email_verification_happy_path_wrong_code_and_lockout()
        {
            await using var app = new CommerceFactory();
            var client = app.CreateClient();
            DevEmailSink.Clear();

            var email = $"verify_{Guid.NewGuid():N}@test.invalid";
            var reg = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
            {
                OwnerName = "تاجر التحقق",
                Email = email,
                Password = "ValidPassword123!",
                StoreName = "متجر التحقق",
                WhatsAppNumber = "01033334444",
                BusinessCategory = "إلكترونيات وموبايل",
                City = "الإسكندرية"
            });
            Assert.Equal(HttpStatusCode.OK, reg.StatusCode);

            // 1. Wrong OTP code -> HTTP 400
            var wrongRes = await client.PostAsJsonAsync("/api/auth/verify-email", new VerifyEmailRequest
            {
                Email = email,
                Code = "000000"
            });
            Assert.Equal(HttpStatusCode.BadRequest, wrongRes.StatusCode);
            var wrongBody = await wrongRes.Content.ReadAsStringAsync();
            Assert.Contains("رمز التحقق غير صحيح", wrongBody);

            // 2. Lockout after 5 wrong attempts
            for (int i = 0; i < 4; i++)
            {
                await client.PostAsJsonAsync("/api/auth/verify-email", new VerifyEmailRequest { Email = email, Code = "111111" });
            }
            var lockedRes = await client.PostAsJsonAsync("/api/auth/verify-email", new VerifyEmailRequest { Email = email, Code = "222222" });
            Assert.Equal((HttpStatusCode)429, lockedRes.StatusCode);

            // 3. Resend OTP with cooldown test
            var resendTooFast = await client.PostAsJsonAsync("/api/auth/resend-email-otp", new ResendEmailOtpRequest { Email = email });
            Assert.Equal((HttpStatusCode)429, resendTooFast.StatusCode);

            // 4. Happy Path: simulate new challenge and verify with real code
            string correctCode = "654321";
            string salt = OtpHasher.GenerateSalt();
            Guid storeId = Guid.Empty;

            await app.WithDb(async db =>
            {
                var store = await db.Stores.SingleAsync(s => s.Email == email);
                storeId = store.Id;
                // Add valid fresh challenge
                db.MerchantOtpChallenges.Add(new MerchantOtpChallenge
                {
                    StoreId = store.Id,
                    Email = email,
                    Purpose = "EmailVerification",
                    CodeHash = OtpHasher.HashCode(correctCode, salt),
                    Salt = salt,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15)
                });
                await db.SaveChangesAsync();
            });

            var successRes = await client.PostAsJsonAsync("/api/auth/verify-email", new VerifyEmailRequest
            {
                Email = email,
                Code = correctCode
            });
            Assert.Equal(HttpStatusCode.OK, successRes.StatusCode);

            // Assert store is now verified in DB
            await app.WithDb(async db =>
            {
                var store = await db.Stores.SingleAsync(s => s.Id == storeId);
                Assert.True(store.EmailVerified);
                Assert.Equal("Verified", store.EmailVerificationStatus);
                Assert.NotNull(store.EmailVerifiedAt);
            });

            // 5. Replay attempt with same code must fail
            var replayRes = await client.PostAsJsonAsync("/api/auth/verify-email", new VerifyEmailRequest
            {
                Email = email,
                Code = correctCode
            });
            Assert.Equal(HttpStatusCode.BadRequest, replayRes.StatusCode);
        }

        [Fact]
        public async Task Password_recovery_flow_end_to_end_with_token_and_session_revocation()
        {
            await using var app = new CommerceFactory();
            var (store, _) = await app.Seed();
            var client = app.CreateClient();
            DevEmailSink.Clear();

            // 1. Unknown email returns generic success without leaking
            var unknownRes = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest
            {
                Email = "nonexistent_store@unknown.invalid"
            });
            Assert.Equal(HttpStatusCode.OK, unknownRes.StatusCode);
            var unknownJson = await unknownRes.Content.ReadAsStringAsync();
            Assert.Contains("إذا كان هذا البريد مسجلاً لدينا", unknownJson);
            Assert.DoesNotContain("nonexistent_store", DevEmailSink.SentEmails.Select(e => e.ToEmail));

            // 2. Real merchant requests recovery
            var realRes = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest
            {
                Email = store.Email
            });
            Assert.Equal(HttpStatusCode.OK, realRes.StatusCode);

            var sentEmail = DevEmailSink.SentEmails.FirstOrDefault(e => e.ToEmail == store.Email && e.Subject.Contains("استعادة كلمة المرور"));
            Assert.NotNull(sentEmail);

            // Extract the OTP code for test verification from DB
            string recoveryCode = "123456";
            string salt = OtpHasher.GenerateSalt();

            await app.WithDb(async db =>
            {
                // Invalidate old, insert known code
                var active = await db.MerchantOtpChallenges.Where(c => c.StoreId == store.Id && c.Purpose == "PasswordRecovery").ToListAsync();
                foreach (var a in active) a.IsUsed = true;

                db.MerchantOtpChallenges.Add(new MerchantOtpChallenge
                {
                    StoreId = store.Id,
                    Email = store.Email,
                    Purpose = "PasswordRecovery",
                    CodeHash = OtpHasher.HashCode(recoveryCode, salt),
                    Salt = salt,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(10)
                });
                await db.SaveChangesAsync();
            });

            // 3. Verify recovery code
            var verifyRes = await client.PostAsJsonAsync("/api/auth/verify-recovery-code", new VerifyRecoveryCodeRequest
            {
                Email = store.Email,
                Code = recoveryCode
            });
            Assert.Equal(HttpStatusCode.OK, verifyRes.StatusCode);
            var verifyResult = await verifyRes.Content.ReadFromJsonAsync<VerifyRecoveryCodeResponse>();
            Assert.NotNull(verifyResult);
            Assert.True(verifyResult.Success);
            Assert.False(string.IsNullOrWhiteSpace(verifyResult.RecoveryToken));

            // 4. Reset password using recovery session token
            var originalSecurityStamp = store.SecurityStamp;
            var resetRes = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest
            {
                RecoveryToken = verifyResult.RecoveryToken,
                NewPassword = "BrandNewSecurePassword2026!"
            });
            Assert.Equal(HttpStatusCode.OK, resetRes.StatusCode);

            // 5. Assert database state: new password verifies, security stamp updated, notification sent
            await app.WithDb(async db =>
            {
                var updatedStore = await db.Stores.SingleAsync(s => s.Id == store.Id);
                Assert.True(BCrypt.Net.BCrypt.Verify("BrandNewSecurePassword2026!", updatedStore.PasswordHash));
                Assert.NotEqual(originalSecurityStamp, updatedStore.SecurityStamp);
                Assert.NotNull(updatedStore.PasswordChangedAt);
            });

            // Notification email captured
            var notification = DevEmailSink.SentEmails.FirstOrDefault(e => e.ToEmail == store.Email && e.Subject.Contains("تم تغيير كلمة المرور"));
            Assert.NotNull(notification);

            // 6. Token reuse must be rejected (single-use)
            var reuseRes = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest
            {
                RecoveryToken = verifyResult.RecoveryToken,
                NewPassword = "AnotherAttemptPassword123!"
            });
            Assert.Equal(HttpStatusCode.BadRequest, reuseRes.StatusCode);

            // 7. Login with new password works
            var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest
            {
                Email = store.Email,
                Password = "BrandNewSecurePassword2026!"
            });
            Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
        }

        [Fact]
        public async Task Phone_verification_returns_honest_unavailable_status_without_faking()
        {
            await using var app = new CommerceFactory();
            var client = app.CreateClient();

            var response = await client.PostAsync("/api/auth/verify-phone", null);
            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

            var body = await response.Content.ReadAsStringAsync();
            Assert.Contains("غير مفعلة حالياً", body);
        }

        [Fact]
        public async Task Merchant_security_controller_status_and_password_change()
        {
            await using var app = new CommerceFactory();
            var (store, _) = await app.Seed();
            var merchantClient = app.Merchant(store);

            // 1. Get security status
            var statusRes = await merchantClient.GetAsync("/api/merchant/security/status");
            Assert.Equal(HttpStatusCode.OK, statusRes.StatusCode);
            var status = await statusRes.Content.ReadFromJsonAsync<MerchantSecurityStatusResponse>();
            Assert.NotNull(status);
            Assert.Equal(store.Email, status.Email);
            Assert.True(status.EmailVerified);

            // 2. Change password with incorrect current password -> 400
            var failRes = await merchantClient.PostAsJsonAsync("/api/merchant/security/change-password", new ChangeMerchantPasswordRequest
            {
                CurrentPassword = "WrongPassword!",
                NewPassword = "NewSecretPassword123!"
            });
            Assert.Equal(HttpStatusCode.BadRequest, failRes.StatusCode);

            // 3. Revoke other sessions updates security stamp
            var revokeRes = await merchantClient.PostAsync("/api/merchant/security/revoke-other-sessions", null);
            Assert.Equal(HttpStatusCode.OK, revokeRes.StatusCode);
        }
    }
}
