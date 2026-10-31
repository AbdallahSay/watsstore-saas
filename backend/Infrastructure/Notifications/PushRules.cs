using System.Security.Cryptography;
using System.Text;
namespace WatsStore.Api.Infrastructure.Notifications;

public static class PushRules
{
    public static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    public static bool Enabled(IConfiguration config) => config.GetValue<bool>("WebPush:Enabled") && config.GetValue<bool>("WebPush:DeviceDeliveryVerified") &&
        !string.IsNullOrWhiteSpace(config["WebPush:PublicKey"]) && !string.IsNullOrWhiteSpace(config["WebPush:PrivateKey"]) &&
        (config["WebPush:DispatcherKey"]?.Length ?? 0) >= 32 && config["WebPush:Subject"]?.StartsWith("mailto:") == true;
    public static bool ValidEndpoint(string endpoint)
    {
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) || uri.Scheme != "https" || uri.Port != 443 ||
            !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Fragment) || endpoint.Length > 2048) return false;
        var host = uri.IdnHost.ToLowerInvariant();
        return host == "fcm.googleapis.com" || host == "updates.push.services.mozilla.com" ||
            host == "web.push.apple.com" || host.EndsWith(".push.apple.com", StringComparison.Ordinal) ||
            host.EndsWith(".notify.windows.com", StringComparison.Ordinal);
    }
    public static bool ValidKeys(string publicKey, string auth)
    {
        try
        {
            var key = Decode(publicKey); var secret = Decode(auth);
            if (key.Length != 65 || key[0] != 4 || secret.Length != 16) return false;
            using var curve = ECDiffieHellman.Create(new ECParameters { Curve = ECCurve.NamedCurves.nistP256,
                Q = new ECPoint { X = key[1..33], Y = key[33..65] } });
            return true;
        }
        catch { return false; }
    }
    private static byte[] Decode(string value) => Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/') + new string('=', (4 - value.Length % 4) % 4));
}
