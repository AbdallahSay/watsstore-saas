using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using WatsStore.Api.DTOs;
using WatsStore.Api.Infrastructure.Utils;
using Xunit;

namespace WatsStore.Tests;
public class ThemeDraftTests
{
    [Fact]
    public async Task Draft_customization_never_leaks_into_public_store_and_restore_restores_appearance()
    {
        await using var app = new CommerceFactory(); var (store,_) = await app.Seed(); var (other,_) = await app.Seed();
        var merchant=app.Merchant(store); var publicClient=app.CreateClient();
        async Task<JsonElement> Public()=>await publicClient.GetFromJsonAsync<JsonElement>($"/api/public/stores/{store.Slug}");
        var before=await Public();
        var request=new CommerceSettingsRequest { DraftTheme="pure-beauty", CustomizationJson="{\"primaryColor\":\"#123456\",\"announcementText\":\"Draft only\"}" };
        Assert.Equal(HttpStatusCode.OK,(await merchant.PutAsJsonAsync("/api/merchant/commerce/settings",request)).StatusCode);
        var saved=await merchant.GetFromJsonAsync<JsonElement>("/api/merchant/commerce/settings");
        Assert.Contains("Draft only",saved.GetProperty("customizationJson").GetString());
        Assert.Equal(before.GetProperty("themeId").GetString(),(await Public()).GetProperty("themeId").GetString());
        Assert.Equal(before.GetProperty("customizationJson").GetString(),(await Public()).GetProperty("customizationJson").GetString());
        Assert.Equal(HttpStatusCode.OK,(await merchant.PostAsync("/api/merchant/commerce/theme/publish",null)).StatusCode);
        Assert.Contains("Draft only",(await Public()).GetProperty("customizationJson").GetString());
        request.DraftTheme="tech-grid";request.CustomizationJson="{\"primaryColor\":\"#abcdef\"}";
        await merchant.PutAsJsonAsync("/api/merchant/commerce/settings",request);await merchant.PostAsync("/api/merchant/commerce/theme/publish",null);
        // A repeated publish of the same saved draft must retain the previous snapshot.
        await merchant.PostAsync("/api/merchant/commerce/theme/publish",null);
        await merchant.PostAsync("/api/merchant/commerce/theme/restore",null);
        var restored=await Public();Assert.Equal("pure-beauty",restored.GetProperty("themeId").GetString());Assert.Contains("#123456",restored.GetProperty("customizationJson").GetString());
        var foreign=await publicClient.GetFromJsonAsync<JsonElement>($"/api/public/stores/{other.Slug}");Assert.DoesNotContain("Draft only",foreign.GetProperty("customizationJson").GetString());
    }
    [Theory]
    [InlineData("[]")][InlineData("null")][InlineData("{\"primaryColor\":\"#12345\"}")]
    [InlineData("{\"announcementText\":\"<script>alert(1)</script>\"}")]
    [InlineData("{\"themeStateVersion\":1,\"published\":{}}")]
    [InlineData("{\"fontPreset\":\"url(evil)\"}")]
    public async Task Unsafe_customization_is_rejected_without_changing_published_data(string json)
    {
        await using var app=new CommerceFactory();var(store,_)=await app.Seed();var merchant=app.Merchant(store);
        var response=await merchant.PutAsJsonAsync("/api/merchant/commerce/settings",new CommerceSettingsRequest{CustomizationJson=json});
        Assert.Equal(HttpStatusCode.BadRequest,response.StatusCode);
        await app.WithDb(async db=>Assert.Equal("{}",(await db.CommerceSettings.FindAsync(store.Id))!.CustomizationJson));
    }
    [Fact]
    public async Task All_ten_designs_require_a_merchant_and_an_active_subscription()
    {
        await using var app=new CommerceFactory();var(store,_)=await app.Seed();var merchant=app.Merchant(store);
        var ids=new[]{"editorial-luxe","street-pulse","pure-beauty","tech-grid","fresh-market","living-space","golden-atelier","active-motion","little-joy","crafted-story"};
        foreach(var id in ids)Assert.Equal(HttpStatusCode.OK,(await merchant.PutAsJsonAsync("/api/merchant/commerce/settings",new CommerceSettingsRequest{DraftTheme=id})).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await merchant.PutAsJsonAsync("/api/merchant/commerce/settings",new {draftTheme="unknown"})).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,(await app.CreateClient().PostAsync("/api/merchant/commerce/theme/publish",null)).StatusCode);
        await app.WithDb(async db=>{var s=await db.Stores.FindAsync(store.Id);s!.SubscriptionEndsAt=DateTime.UtcNow.AddDays(-1);await db.SaveChangesAsync();});
        Assert.Equal(HttpStatusCode.Forbidden,(await merchant.PostAsync("/api/merchant/commerce/theme/publish",null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,(await merchant.PutAsJsonAsync("/api/merchant/commerce/settings",new CommerceSettingsRequest())).StatusCode);
    }
    [Fact]
    public void Flat_legacy_settings_remain_published_until_an_explicit_publish()
    {
        var state=ThemeDesignState.Read("{\"primaryColor\":\"#123456\"}");
        Assert.Equal(state.Draft.GetRawText(),state.Published.GetRawText());Assert.Null(state.PublishedAt);
        state.Draft=JsonSerializer.SerializeToElement(new {primaryColor="#abcdef"});
        Assert.Contains("#123456",ThemeDesignState.Read(state.Serialize()).Published.GetRawText());
    }
    [Fact]
    public async Task Repeated_registration_creates_one_store_and_can_be_recovered_by_login()
    {
        await using var app=new CommerceFactory();await app.Seed();var client=app.CreateClient();
        var request=new {ownerName="Isolated setup",email=$"pilot-{Guid.NewGuid():N}@test.invalid",password="Isolated-password-2026!",storeName="Pilot Store",whatsAppNumber="01012345678",businessCategory="Fashion",city="Cairo"};
        Assert.Equal(HttpStatusCode.OK,(await client.PostAsJsonAsync("/api/auth/register",request)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsJsonAsync("/api/auth/register",request)).StatusCode);
        Assert.Equal(HttpStatusCode.OK,(await client.PostAsJsonAsync("/api/auth/login",new {request.email,request.password})).StatusCode);
        await app.WithDb(db=>{Assert.Single(db.Stores.Where(s=>s.Email==request.email));return Task.CompletedTask;});
    }
}
