using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WatsStore.Api.Domain.Entities;

namespace WatsStore.Api.Infrastructure.Utils;

public static class CommerceRules
{
    public static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    public static string VariantKey(Dictionary<string, string>? selections) => selections == null || selections.Count == 0
        ? "" : Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(selections.OrderBy(x => x.Key, StringComparer.Ordinal)))));

    public static bool ValidVariants(Product product, Dictionary<string, string>? selections)
    {
        try
        {
            var groups = JsonSerializer.Deserialize<List<VariantGroup>>(product.VariantsJson ?? "[]", Json) ?? new();
            selections ??= new();
            return groups.Count == selections.Count && groups.All(g => selections.TryGetValue(g.Name, out var value) && g.Options.Contains(value, StringComparer.Ordinal));
        }
        catch (JsonException) { return false; }
    }

    public static bool CanTransition(string from, string to) => (from, to) switch
    {
        ("Pending", "Confirmed" or "Cancelled" or "Rejected") => true,
        ("Confirmed", "Preparing" or "Cancelled") => true,
        ("Preparing", "Shipped" or "Cancelled") => true,
        ("Shipped", "Delivered") => true,
        _ => false
    };
    public static bool CountsAsSale(string status) => status is "Confirmed" or "Preparing" or "Shipped" or "Delivered";
    private sealed class VariantGroup
    {
        public string Name { get; set; } = "";
        public List<string> Options { get; set; } = new();
    }
}
