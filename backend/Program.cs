using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using WatsStore.Api.Domain.Entities;
using WatsStore.Api.Infrastructure.Data;
using WatsStore.Api.Infrastructure.Utils;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context - Dual Provider (PostgreSQL & SQL Server)
var provider = builder.Configuration.GetValue<string>("DatabaseProvider") 
               ?? Environment.GetEnvironmentVariable("DB_PROVIDER") 
               ?? "";

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=.;Database=WatsStoreDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

bool isPostgres = provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase) 
               || provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase)
               || connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase)
               || connectionString.Contains("Port=5432", StringComparison.OrdinalIgnoreCase)
               || connectionString.Contains("Username=", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (isPostgres)
    {
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
        });
    }
    else
    {
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
        });
    }
});

// 2. Dependency Injection
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// 3. JWT Authentication
var secretKey = builder.Configuration["Jwt:SecretKey"] ?? "WatsStore_Super_Secret_Key_For_Egypt_Merchants_2026_Secure_Key_Must_Be_Long_Enough!";
var issuer = builder.Configuration["Jwt:Issuer"] ?? "WatsStoreApi";
var audience = builder.Configuration["Jwt:Audience"] ?? "WatsStoreClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// 4. CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                  string.IsNullOrEmpty(origin) ||
                  origin.EndsWith(".vercel.app") ||
                  origin.StartsWith("http://localhost") ||
                  origin.StartsWith("https://localhost"))
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 5. Controllers with JSON configuration
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 6. Swagger documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "WatsStore SaaS API",
        Version = "v1",
        Description = "Micro-SaaS API for Egyptian merchants - Instant WhatsApp Store & Catalog"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCors("AllowAll");

app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "WatsStore SaaS API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Auto-Seeding Database & Column Migrations on Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        await db.Database.EnsureCreatedAsync();

        // Safe production column inspection and migration
        try
        {
            if (db.Database.IsNpgsql())
            {
                await db.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""Stores"" ADD COLUMN IF NOT EXISTS ""VodafoneCashNumber"" VARCHAR(20) NULL;
                    ALTER TABLE ""Stores"" ADD COLUMN IF NOT EXISTS ""InstaPayAddress"" VARCHAR(100) NULL;
                    ALTER TABLE ""WhatsAppOrders"" ADD COLUMN IF NOT EXISTS ""PaymentMethod"" VARCHAR(50) NOT NULL DEFAULT 'الدفع عند الاستلام';

                    CREATE TABLE IF NOT EXISTS ""StoreReviews"" (
                        ""Id"" UUID NOT NULL PRIMARY KEY,
                        ""StoreId"" UUID NOT NULL REFERENCES ""Stores""(""Id"") ON DELETE CASCADE,
                        ""CustomerName"" VARCHAR(150) NOT NULL,
                        ""Rating"" INT NOT NULL,
                        ""Comment"" VARCHAR(1000) NOT NULL,
                        ""IsApproved"" BOOLEAN NOT NULL DEFAULT FALSE,
                        ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                    );
                    CREATE INDEX IF NOT EXISTS ""IX_StoreReviews_StoreId_IsApproved"" ON ""StoreReviews"" (""StoreId"", ""IsApproved"");
                    CREATE INDEX IF NOT EXISTS ""IX_StoreReviews_StoreId_CreatedAt"" ON ""StoreReviews"" (""StoreId"", ""CreatedAt"");
                ");
                logger.LogInformation("PostgreSQL database columns & StoreReviews table verified/applied successfully.");
            }
            else
            {
                await db.Database.ExecuteSqlRawAsync(@"
                    IF COL_LENGTH('Stores', 'VodafoneCashNumber') IS NULL 
                        ALTER TABLE Stores ADD VodafoneCashNumber NVARCHAR(20) NULL;
                    IF COL_LENGTH('Stores', 'InstaPayAddress') IS NULL 
                        ALTER TABLE Stores ADD InstaPayAddress NVARCHAR(100) NULL;
                    IF COL_LENGTH('WhatsAppOrders', 'PaymentMethod') IS NULL 
                        ALTER TABLE WhatsAppOrders ADD PaymentMethod NVARCHAR(50) NOT NULL CONSTRAINT DF_WhatsAppOrders_PaymentMethod DEFAULT N'الدفع عند الاستلام';

                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StoreReviews')
                    BEGIN
                        CREATE TABLE StoreReviews (
                            Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                            StoreId UNIQUEIDENTIFIER NOT NULL,
                            CustomerName NVARCHAR(150) NOT NULL,
                            Rating INT NOT NULL,
                            Comment NVARCHAR(1000) NOT NULL,
                            IsApproved BIT NOT NULL DEFAULT 0,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            CONSTRAINT FK_StoreReviews_Stores_StoreId FOREIGN KEY (StoreId) REFERENCES Stores(Id) ON DELETE CASCADE
                        );
                        CREATE INDEX IX_StoreReviews_StoreId_IsApproved ON StoreReviews (StoreId, IsApproved);
                        CREATE INDEX IX_StoreReviews_StoreId_CreatedAt ON StoreReviews (StoreId, CreatedAt);
                    END
                ");
                logger.LogInformation("SQL Server database column migrations & StoreReviews table checked and applied successfully.");
            }
        }
        catch (Exception colEx)
        {
            logger.LogWarning(colEx, "Column/Table migration check skipped or failed.");
        }

        if (!await db.Stores.AnyAsync(s => s.Slug == "al-amal-fashion"))
        {
            logger.LogInformation("Seeding default demo store 'al-amal-fashion'...");

            var demoStore = new Store
            {
                Id = Guid.NewGuid(),
                OwnerName = "أحمد الأمل",
                Email = "demo@watsstore.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                StoreName = "بوتيك الأمل للأزياء الفاخرة",
                Slug = "al-amal-fashion",
                PublicCode = "AMAL2026",
                WhatsAppNumber = "201012345678",
                BusinessCategory = "ملابس وأزياء",
                City = "الفيوم",
                AddressDetails = "شارع الجمهورية - برج الصفا - الدور الأرضي، الفيوم",
                LogoUrl = "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80",
                CoverUrl = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80",
                ThemeColor = "#10B981",
                Currency = "ج.م",
                DeliveryFee = 35.00m,
                SeoTitle = "بوتيك الأمل | أحدث صيحات الفساتين والعبايات في الفيوم",
                SeoDescription = "تصفح أحدث كولكشن فساتين سواريه وعبايات كاجوال وحقائب في بوتيك الأمل بالفيوم، اطلب عبر الواتساب واستلم خلال 24 ساعة.",
                PlanType = "Pro",
                MetaPixelId = "987654321012345",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var cat1 = new Category { StoreId = demoStore.Id, Name = "فساتين وسهرات", SortOrder = 1, IsActive = true };
            var cat2 = new Category { StoreId = demoStore.Id, Name = "عبايات كاجوال", SortOrder = 2, IsActive = true };
            var cat3 = new Category { StoreId = demoStore.Id, Name = "إكسسوارات وحقائب", SortOrder = 3, IsActive = true };

            demoStore.Categories.Add(cat1);
            demoStore.Categories.Add(cat2);
            demoStore.Categories.Add(cat3);

            var prod1 = new Product
            {
                Id = Guid.NewGuid(),
                StoreId = demoStore.Id,
                Category = cat1,
                Name = "فستان سواريه مخملي فاخر",
                Slug = "luxury-velvet-evening-dress",
                Description = "فستان سواريه أنيق مصنوع من قماش المخمل الفاخر مع تطريز يدوي على الصدر والخصر، مناسب للمناسبات الراقية وحفلات الزفاف.",
                Price = 1250.00m,
                CompareAtPrice = 1500.00m,
                ImageUrl = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
                VariantsJson = "[{\"name\":\"المقاس\",\"options\":[\"S\",\"M\",\"L\",\"XL\"]},{\"name\":\"اللون\",\"options\":[\"أسود ملكي\",\"عنابي دافئ\",\"كحلي\"]}]",
                IsAvailable = true,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow
            };

            var prod2 = new Product
            {
                Id = Guid.NewGuid(),
                StoreId = demoStore.Id,
                Category = cat2,
                Name = "عباية خليجية مطرزة بالحرير",
                Slug = "embroidered-khaleeji-abaya",
                Description = "عباية إماراتية كلاسيكية مع تطريز راقي بالخيوط الحريرية وقصة مريحة للعمل والخروجات اليومية.",
                Price = 850.00m,
                CompareAtPrice = 990.00m,
                ImageUrl = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
                VariantsJson = "[{\"name\":\"المقاس\",\"options\":[\"52\",\"54\",\"56\",\"58\"]},{\"name\":\"نوع الطرحة\",\"options\":[\"طرحة ليزر مطابقة\",\"طرحة شيفون سادة\"]}]",
                IsAvailable = true,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow
            };

            var prod3 = new Product
            {
                Id = Guid.NewGuid(),
                StoreId = demoStore.Id,
                Category = cat3,
                Name = "حقيبة يد جلدية كلاسيك",
                Slug = "classic-leather-handbag",
                Description = "شنطة يد مصنوعة من الجلد المقاوم للخدوش مع حزام كتف قابل للتعديل ومقصورات داخلية متعددة.",
                Price = 420.00m,
                CompareAtPrice = 500.00m,
                ImageUrl = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
                VariantsJson = "[{\"name\":\"اللون\",\"options\":[\"بيج أنيق\",\"أسود كلاسيك\",\"كافيه\"]}]",
                IsAvailable = true,
                SortOrder = 3,
                CreatedAt = DateTime.UtcNow
            };

            var prod4 = new Product
            {
                Id = Guid.NewGuid(),
                StoreId = demoStore.Id,
                Category = cat3,
                Name = "طقم إكسسوار زركون مطلي بالذهب",
                Slug = "gold-plated-zircon-jewelry-set",
                Description = "عقد وأقراط متناسقة بتصميم ألماسي جذاب مرصع بأحجار الزركون اللامعة ومطلي بماء الذهب عيار 18.",
                Price = 290.00m,
                CompareAtPrice = 380.00m,
                ImageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
                VariantsJson = "[{\"name\":\"الموديل\",\"options\":[\"تصميم قطرة الندى\",\"تصميم الوردة الملكية\"]}]",
                IsAvailable = true,
                SortOrder = 4,
                CreatedAt = DateTime.UtcNow
            };

            demoStore.Products.Add(prod1);
            demoStore.Products.Add(prod2);
            demoStore.Products.Add(prod3);
            demoStore.Products.Add(prod4);

            db.Stores.Add(demoStore);
            await db.SaveChangesAsync();

            logger.LogInformation("Demo store 'al-amal-fashion' seeded successfully.");
        }

        // Seed default approved reviews for al-amal-fashion if none exist
        var amalStore = await db.Stores.FirstOrDefaultAsync(s => s.Slug == "al-amal-fashion");
        if (amalStore != null && !await db.StoreReviews.AnyAsync(r => r.StoreId == amalStore.Id))
        {
            logger.LogInformation("Seeding default customer reviews for 'al-amal-fashion'...");
            var review1 = new StoreReview
            {
                Id = Guid.NewGuid(),
                StoreId = amalStore.Id,
                CustomerName = "منى محمود - الفيوم",
                Rating = 5,
                Comment = "خامات ممتازة جداً وتوصيل سريع في نفس اليوم في الفيوم، التغليف شيك وتعامل محترم على الواتساب.",
                IsApproved = true,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            };
            var review2 = new StoreReview
            {
                Id = Guid.NewGuid(),
                StoreId = amalStore.Id,
                CustomerName = "سارة خليل",
                Rating = 5,
                Comment = "الفستان السواريه تحفة وطلع أحلى من الصور بكتير، والمقاس مظبوط بالظبط، تجربة شراء ممتازة.",
                IsApproved = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            var review3 = new StoreReview
            {
                Id = Guid.NewGuid(),
                StoreId = amalStore.Id,
                CustomerName = "دعاء عبد الرحمن",
                Rating = 5,
                Comment = "سرعة في الرد وسهولة في الطلب بدون تعقيد، شكراً لذوقكم العالي.",
                IsApproved = true,
                CreatedAt = DateTime.UtcNow.AddHours(-12)
            };
            db.StoreReviews.AddRange(review1, review2, review3);
            await db.SaveChangesAsync();
            logger.LogInformation("Customer reviews seeded successfully.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database migration or seeding.");
    }
}

app.Run();
