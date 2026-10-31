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
        string GenerateAdminToken(string email, string name = "مدير النظام");
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
            var secretKey = _configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey must be supplied through secure configuration.");
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
                new Claim(ClaimTypes.Role, "Merchant"),
                new Claim("role", "Merchant"),
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

        public string GenerateAdminToken(string email, string name = "مدير المنصة")
        {
            var secretKey = _configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey must be supplied through secure configuration.");
            var issuer = _configuration["Jwt:Issuer"] ?? "WatsStoreApi";
            var audience = _configuration["Jwt:Audience"] ?? "WatsStoreClients";
            var expiryDays = 7;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "admin-master-account"),
                new Claim(ClaimTypes.Name, name),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, "Admin"),
                new Claim("role", "Admin"),
                new Claim("isAdmin", "true"),
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
