using System;
using System.Collections.Generic;
using System.Text.Json;

namespace WatsStore.Api.Domain.Entities
{
    public class GatewayAccountItem
    {
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string? QrCodeUrl { get; set; }
    }

    public class PaymentGatewaySetting
    {
        public int Id { get; set; }
        public string GatewayKey { get; set; } = string.Empty; // e.g. "VodafoneCash", "InstaPay", "OnlineCard", "BankTransfer"
        public string DisplayName { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = true;
        public string Instructions { get; set; } = string.Empty;
        public string AccountsJson { get; set; } = "[]";
        public int SortOrder { get; set; } = 0;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<GatewayAccountItem> GetAccounts()
        {
            if (string.IsNullOrWhiteSpace(AccountsJson))
                return new List<GatewayAccountItem>();

            try
            {
                return JsonSerializer.Deserialize<List<GatewayAccountItem>>(AccountsJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<GatewayAccountItem>();
            }
            catch
            {
                return new List<GatewayAccountItem>();
            }
        }

        public void SetAccounts(List<GatewayAccountItem> accounts)
        {
            AccountsJson = JsonSerializer.Serialize(accounts ?? new List<GatewayAccountItem>());
        }
    }
}
