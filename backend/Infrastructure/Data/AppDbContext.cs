using Microsoft.EntityFrameworkCore;
using WatsStore.Api.Domain.Entities;

namespace WatsStore.Api.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Store> Stores => Set<Store>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<WhatsAppOrder> WhatsAppOrders => Set<WhatsAppOrder>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Store Configuration
            modelBuilder.Entity<Store>(entity =>
            {
                entity.HasKey(s => s.Id);

                entity.HasIndex(s => s.Email).IsUnique();
                entity.HasIndex(s => s.Slug).IsUnique();
                entity.HasIndex(s => s.PublicCode).IsUnique();

                // Composite index for local SEO directory search
                entity.HasIndex(s => new { s.City, s.BusinessCategory, s.IsActive })
                      .HasDatabaseName("IX_Stores_City_BusinessCategory_IsActive");

                entity.Property(s => s.StoreName).HasMaxLength(150).IsRequired();
                entity.Property(s => s.OwnerName).HasMaxLength(150).IsRequired();
                entity.Property(s => s.Email).HasMaxLength(200).IsRequired();
                entity.Property(s => s.Slug).HasMaxLength(100).IsRequired();
                entity.Property(s => s.PublicCode).HasMaxLength(20).IsRequired();
                entity.Property(s => s.WhatsAppNumber).HasMaxLength(30).IsRequired();
                entity.Property(s => s.BusinessCategory).HasMaxLength(100).IsRequired();
                entity.Property(s => s.City).HasMaxLength(100).IsRequired();
                entity.Property(s => s.ThemeColor).HasMaxLength(20).HasDefaultValue("#10B981");
                entity.Property(s => s.Currency).HasMaxLength(20).HasDefaultValue("ج.م");
                entity.Property(s => s.PlanType).HasMaxLength(20).HasDefaultValue("Free");
                entity.Property(s => s.VodafoneCashNumber).HasMaxLength(20);
                entity.Property(s => s.InstaPayAddress).HasMaxLength(100);

                entity.Property(s => s.DeliveryFee).HasPrecision(10, 2);

                entity.HasMany(s => s.Categories)
                      .WithOne(c => c.Store)
                      .HasForeignKey(c => c.StoreId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(s => s.Products)
                      .WithOne(p => p.Store)
                      .HasForeignKey(p => p.StoreId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(s => s.Orders)
                      .WithOne(o => o.Store)
                      .HasForeignKey(o => o.StoreId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Category Configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Name).HasMaxLength(100).IsRequired();

                entity.HasIndex(c => new { c.StoreId, c.SortOrder });

                entity.HasMany(c => c.Products)
                      .WithOne(p => p.Category)
                      .HasForeignKey(p => p.CategoryId)
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            // Product Configuration
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Name).HasMaxLength(200).IsRequired();
                entity.Property(p => p.Slug).HasMaxLength(200).IsRequired();
                entity.Property(p => p.Price).HasPrecision(10, 2);
                entity.Property(p => p.CompareAtPrice).HasPrecision(10, 2);

                entity.HasIndex(p => new { p.StoreId, p.Slug });
                entity.HasIndex(p => new { p.StoreId, p.IsAvailable });
            });

            // WhatsAppOrder Configuration
            modelBuilder.Entity<WhatsAppOrder>(entity =>
            {
                entity.HasKey(o => o.Id);
                
                if (Database.ProviderName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true)
                {
                    entity.Property(o => o.OrderNumber)
                          .UseIdentityByDefaultColumn()
                          .HasIdentityOptions(startValue: 1001, incrementBy: 1);
                }
                else
                {
                    entity.Property(o => o.OrderNumber).UseIdentityColumn(1001, 1);
                }

                entity.Property(o => o.TotalAmount).HasPrecision(10, 2);
                entity.Property(o => o.PaymentMethod).HasMaxLength(50).HasDefaultValue("الدفع عند الاستلام");
                entity.Property(o => o.CustomerName).HasMaxLength(150).IsRequired();
                entity.Property(o => o.CustomerPhone).HasMaxLength(30).IsRequired();
                entity.Property(o => o.CustomerAddress).HasMaxLength(500).IsRequired();

                entity.HasIndex(o => new { o.StoreId, o.CreatedAt });
            });
        }
    }
}
