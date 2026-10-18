using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WatsStore.Api.Domain.Entities;

namespace WatsStore.Api.Infrastructure.Utils
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(Store store);
    }

    public class JwtTokenGenerator : IJwtTokenGenerator
    {
        private readonly IConfiguration _configuration;

        public JwtTokenGenerator(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(Store store)
        {
            var secretKey = _configuration["Jwt:SecretKey"] ?? "WatsStore_Super_Secret_Key_For_Egypt_Merchants_2026_Secure_Key!";
            var issuer = _configuration["Jwt:Issuer"] ?? "WatsStoreApi";
            var audience = _configuration["Jwt:Audience"] ?? "WatsStoreClients";
            var expiryDays = int.TryParse(_configuration["Jwt:ExpiryDays"], out var days) ? days : 30;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, store.Id.ToString()),
                new Claim("storeId", store.Id.ToString()),
                new Claim("slug", store.Slug),
                new Claim("planType", store.PlanType),
                new Claim("email", store.Email),
                new Claim("storeName", store.StoreName),
                new Claim("ownerName", store.OwnerName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(expiryDays),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
