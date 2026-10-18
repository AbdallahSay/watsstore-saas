using System;

namespace WatsStore.Api.Domain.Entities
{
    public class SuperAdmin
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Email { get; set; } = "abdallahsay10@gmail.com";
        public string PasswordHash { get; set; } = string.Empty;
        public string? ResetToken { get; set; }
        public DateTime? ResetTokenExpiresAt { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
