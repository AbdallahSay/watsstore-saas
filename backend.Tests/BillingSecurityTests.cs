using System.Net;
using System.Net.Http.Json;
using WatsStore.Api.Domain.Entities;
using Xunit;

namespace WatsStore.Tests;

public class BillingSecurityTests
{
    [Fact]
    public async Task Merchant_cannot_self_approve_subscription_via_removed_simulate_route()
    {
        await using var app = new CommerceFactory();
        var (store, _) = await app.Seed();

        var requestId = Guid.NewGuid();
        await app.WithDb(async db =>
        {
            var tracked = await db.Stores.FindAsync(store.Id);
            tracked!.PlanType = "Free";
            tracked.SubscriptionEndsAt = null;
            db.SubscriptionRequests.Add(new SubscriptionRequest
            {
                Id = requestId,
                StoreId = store.Id,
                StoreName = store.StoreName,
                MerchantEmail = store.Email,
                MerchantPhone = store.WhatsAppNumber,
                PlanType = "VIP",
                BillingCycle = "Annual",
                Amount = 4999m,
                PaymentMethod = "InstaPay",
                TransactionId = "TX-SEC-TEST",
                Status = "Pending"
            });
            await db.SaveChangesAsync();
        });

        var merchant = app.Merchant(store);
        var response = await merchant.PostAsJsonAsync("/api/merchant/billing/webhook/simulate", new { requestId });

        // The route no longer exists: the framework rejects it before any handler runs.
        Assert.True(response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.MethodNotAllowed,
            $"Expected 404/405, got {(int)response.StatusCode}");

        await app.WithDb(async db =>
        {
            var req = await db.SubscriptionRequests.FindAsync(requestId);
            Assert.Equal("Pending", req!.Status);
            Assert.Null(req.ReviewedAt);
            var tracked = await db.Stores.FindAsync(store.Id);
            Assert.Equal("Free", tracked!.PlanType);
            Assert.Null(tracked.SubscriptionEndsAt);
        });
    }
}
