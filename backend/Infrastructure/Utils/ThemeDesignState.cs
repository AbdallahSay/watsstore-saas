using System.Text.Json;
using System.Text.RegularExpressions;

namespace WatsStore.Api.Infrastructure.Utils;

// Snapshots share the existing JSON column. No schema or tenant selection migration.
public sealed class ThemeDesignState
{
    public int ThemeStateVersion { get; set; } = 1;
    public JsonElement Draft { get; set; } = JsonSerializer.SerializeToElement(new { });
    public JsonElement Published { get; set; } = JsonSerializer.SerializeToElement(new { });
    public JsonElement Previous { get; set; } = JsonSerializer.SerializeToElement(new { });
    public DateTime? PublishedAt { get; set; }
    public static ThemeDesignState Read(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            var root = JsonSerializer.Deserialize<JsonElement>(json);
            if (root.ValueKind != JsonValueKind.Object) return new();
            if (root.TryGetProperty("themeStateVersion", out var version) && version.TryGetInt32(out var number) && number == 1)
                return JsonSerializer.Deserialize<ThemeDesignState>(json, CommerceRules.Json) ?? new();
            // Existing flat configurations remain both published and editable.
            return new() { Draft = root.Clone(), Published = root.Clone(), Previous = root.Clone() };
        }
        catch (JsonException) { return new(); }
    }
    public string Serialize()
    {
        // Older readers still see the last published appearance at the root.
        // New readers use the versioned snapshots; a binary rollback does not hide the published design.
        var value = new Dictionary<string, object?>();
        if(Published.ValueKind == JsonValueKind.Object)
            foreach(var p in Published.EnumerateObject()) value[p.Name]=p.Value;
        value["themeStateVersion"]=1; value["draft"]=Draft; value["published"]=Published;
        value["previous"]=Previous; value["publishedAt"]=PublishedAt;
        return JsonSerializer.Serialize(value, CommerceRules.Json);
    }
    public static bool TryAppearance(string json, out JsonElement result)
    {
        result = default;
        if (json.Length > 8192) return false;
        try
        {
            using var document = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 4 });
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return false;
            var seen = new HashSet<string>();
            foreach (var p in root.EnumerateObject())
            {
                if (!seen.Add(p.Name)) return false;
                // Legacy UI sends JSON.stringify: absent fields omitted; null is not a preset.
                if (p.Name is "primaryColor" or "secondaryColor")
                { if (p.Value.ValueKind != JsonValueKind.String || !Regex.IsMatch(p.Value.GetString()!, "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")) return false; }
                else if (p.Name == "announcementText")
                { if (p.Value.ValueKind != JsonValueKind.String || p.Value.GetString()!.Length > 200 || p.Value.GetString()!.IndexOfAny(['<', '>']) >= 0) return false; }
                else if (p.Name == "showHeroBadge")
                { if (p.Value.ValueKind is not (JsonValueKind.True or JsonValueKind.False)) return false; }
                else
                {
                    var choices = p.Name switch {
                        "fontPreset" => new[] { "cairo", "amiri", "tajawal", "sans", "serif" },
                        "buttonShape" => new[] { "rounded", "pill", "sharp" },
                        "gridDensity" => new[] { "compact", "standard", "spacious" },
                        "cardAspectRatio" => new[] { "4/5", "1/1", "3/4", "16/9" }, _ => [] };
                    if (p.Value.ValueKind != JsonValueKind.String || !choices.Contains(p.Value.GetString())) return false;
                }
            }
            result = root.Clone(); return true;
        }
        catch (JsonException) { return false; }
    }
}
