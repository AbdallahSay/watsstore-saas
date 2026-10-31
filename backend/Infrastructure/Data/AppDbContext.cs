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
        public DbSet<CommerceSettings> CommerceSettings => Set<CommerceSettings>();
        public DbSet<InventoryStock> InventoryStocks => Set<InventoryStock>();
        public DbSet<OrderHistory> OrderHistories => Set<OrderHistory>();
        public DbSet<InventoryAdjustment> InventoryAdjustments => Set<InventoryAdjustment>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<WhatsAppOrder> WhatsAppOrders => Set<WhatsAppOrder>();
        public DbSet<StoreReview> StoreReviews => Set<StoreReview>();
        public DbSet<StoreCoupon> StoreCoupons => Set<StoreCoupon>();
        public DbSet<SuperAdmin> SuperAdmins => Set<SuperAdmin>();
        public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();
        public DbSet<SubscriptionRequest> SubscriptionRequests => Set<SubscriptionRequest>();
        public DbSet<PaymentGatewaySetting> PaymentGateways => Set<PaymentGatewaySetting>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<CommerceSettings>(e =>
            {
                e.HasKey(x => x.StoreId);
                e.HasOne(x => x.Store).WithOne().HasForeignKey<CommerceSettings>(x => x.StoreId);
            });
            modelBuilder.Entity<InventoryStock>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.StoreId, x.ProductId, x.VariantKey }).IsUnique();
            });
            modelBuilder.Entity<OrderHistory>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.StoreId, x.OrderId, x.CreatedAt });
            });

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

                entity.HasMany(s => s.Reviews)
                      .WithOne(r => r.Store)
                      .HasForeignKey(r => r.StoreId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(s => s.Coupons)
                      .WithOne(c => c.Store)
                      .HasForeignKey(c => c.StoreId)
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
                entity.Property(o => o.Status).HasMaxLength(30);
                entity.Property(o => o.PaymentStatus).HasMaxLength(30);
                entity.Property(o => o.Channel).HasMaxLength(20);
                entity.Property(o => o.TrackingToken).HasMaxLength(64);
                entity.Property(o => o.IdempotencyKey).HasMaxLength(80);
                entity.Property(o => o.RequestHash).HasMaxLength(64);
                entity.Property(o => o.Subtotal).HasPrecision(10, 2);
                entity.Property(o => o.DiscountAmount).HasPrecision(10, 2);
                entity.Property(o => o.DeliveryFee).HasPrecision(10, 2);
                entity.HasIndex(o => new { o.StoreId, o.IdempotencyKey }).IsUnique()
                      .HasFilter(Database.IsNpgsql() ? "\"IdempotencyKey\" IS NOT NULL" : "[IdempotencyKey] IS NOT NULL");
                entity.HasIndex(o => o.TrackingToken).IsUnique()
                      .HasFilter(Database.IsNpgsql() ? "\"TrackingToken\" IS NOT NULL" : "[TrackingToken] IS NOT NULL");
                
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

            // StoreReview Configuration
            modelBuilder.Entity<StoreReview>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.Property(r => r.CustomerName).HasMaxLength(150).IsRequired();
                entity.Property(r => r.Comment).HasMaxLength(1000).IsRequired();
                entity.Property(r => r.Rating).IsRequired();
                entity.Property(r => r.IsApproved).HasDefaultValue(false);

                entity.HasIndex(r => new { r.StoreId, r.IsApproved });
                entity.HasIndex(r => new { r.StoreId, r.CreatedAt });
            });

            // StoreCoupon Configuration
            modelBuilder.Entity<StoreCoupon>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Code).HasMaxLength(50).IsRequired();
                entity.Property(c => c.DiscountType).HasMaxLength(20).HasDefaultValue("Percentage");
                entity.Property(c => c.DiscountValue).HasPrecision(10, 2);
                entity.Property(c => c.IsActive).HasDefaultValue(true);

                entity.HasIndex(c => new { c.StoreId, c.Code }).IsUnique();
                entity.HasIndex(c => new { c.StoreId, c.IsActive });
            });

            // SuperAdmin Configuration
            modelBuilder.Entity<SuperAdmin>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.Property(a => a.Email).HasMaxLength(150).IsRequired();
                entity.Property(a => a.PasswordHash).HasMaxLength(255).IsRequired();
                entity.Property(a => a.ResetToken).HasMaxLength(100);
                entity.HasIndex(a => a.Email).IsUnique();
            });

            // SubscriptionRequest Configuration
            modelBuilder.Entity<SubscriptionRequest>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.Property(r => r.StoreName).HasMaxLength(150);
                entity.Property(r => r.MerchantEmail).HasMaxLength(200);
                entity.Property(r => r.MerchantPhone).HasMaxLength(50);
                entity.Property(r => r.PlanType).HasMaxLength(20).IsRequired();
                entity.Property(r => r.BillingCycle).HasMaxLength(20).IsRequired();
                entity.Property(r => r.PaymentMethod).HasMaxLength(50).IsRequired();
                entity.Property(r => r.DestinationAccount).HasMaxLength(100);
                entity.Property(r => r.TransactionId).HasMaxLength(100).IsRequired();
                entity.Property(r => r.Status).HasMaxLength(20).HasDefaultValue("Pending");
                entity.Property(r => r.Amount).HasPrecision(10, 2);

                entity.HasOne(r => r.Store)
                      .WithMany()
                      .HasForeignKey(r => r.StoreId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(r => new { r.StoreId, r.Status });
                entity.HasIndex(r => r.CreatedAt);
            });

            // PaymentGatewaySetting Configuration
            modelBuilder.Entity<PaymentGatewaySetting>(entity =>
            {
                entity.HasKey(g => g.Id);
                entity.Property(g => g.GatewayKey).HasMaxLength(50).IsRequired();
                entity.Property(g => g.DisplayName).HasMaxLength(150).IsRequired();
                entity.Property(g => g.IsEnabled).HasDefaultValue(true);
                entity.Property(g => g.Instructions).HasMaxLength(2000);
                entity.Property(g => g.SortOrder).HasDefaultValue(0);

                entity.HasIndex(g => g.GatewayKey).IsUnique();
                entity.HasIndex(g => new { g.IsEnabled, g.SortOrder });
            });
        }
    }
}
