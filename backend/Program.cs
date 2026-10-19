using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
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
                  origin.EndsWith("watsstore.com") ||
                  origin.EndsWith("masartech.com") ||
                  origin.EndsWith("watsstore.app") ||
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

// 6. Rate Limiting Configuration
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        context.HttpContext.Response.Headers.Append("Retry-After", "60");
        await context.HttpContext.Response.WriteAsync(
            "{\"message\":\"لقد تجاوزت الحد المسموح من الطلبات السريعة. يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.\"}",
            token);
    };

    string GetClientIp(HttpContext httpContext)
    {
        var forwarded = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var firstIp = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries)[0].Trim();
            if (!string.IsNullOrWhiteSpace(firstIp))
                return firstIp;
        }

        var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
        {
            return realIp.Trim();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
    }

    // Auth policy: Max 20 requests per minute per IP to protect against brute-force attacks
    options.AddPolicy("auth-policy", httpContext =>
    {
        var clientIp = GetClientIp(httpContext);

        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 20,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });

    // Sensitive policy (Coupons, Orders, Reviews): Max 120 requests per minute per IP
    options.AddPolicy("sensitive-policy", httpContext =>
    {
        var clientIp = GetClientIp(httpContext);

        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });

    // Admin policy: Max 200 requests per minute per IP
    options.AddPolicy("admin-policy", httpContext =>
    {
        var clientIp = GetClientIp(httpContext);

        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 200,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });

    // Public storefront policy: Max 120 requests per minute per IP
    options.AddPolicy("public-policy", httpContext =>
    {
        var clientIp = GetClientIp(httpContext);

        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });
});

// 7. Swagger documentation
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

// 0. Global Exception Handling Middleware (Zero 500 stack traces, clean structured responses)
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (BadHttpRequestException ex)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
        {
            message = "الطلب غير صالح أو البيانات المدخلة غير صحيحة",
            error = ex.Message
        }));
    }
    catch (UnauthorizedAccessException ex)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
        {
            message = ex.Message ?? "غير مصرح لك بالوصول، يرجى تسجيل الدخول مجدداً."
        }));
    }
    catch (System.Text.Json.JsonException ex)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
        {
            message = "صيغة JSON غير صالحة. يرجى التحقق من صحة البيانات المرسلة.",
            error = ex.Message
        }));
    }
    catch (Exception)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
        {
            message = "تعذر إتمام الطلب نظراً لبيانات غير صالحة أو غير مكتملة."
        }));
    }
});

// 1. Enterprise Security Headers Middleware
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    context.Response.Headers.Remove("X-Powered-By");

    await next();
});

// 2. Configure the HTTP request pipeline
app.UseCors("AllowAll");

// 3. Rate Limiter Middleware
app.UseRateLimiter();

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
                    ALTER TABLE ""Stores"" ADD COLUMN IF NOT EXISTS ""ViewCount"" INT NOT NULL DEFAULT 0;
                    ALTER TABLE ""Stores"" ADD COLUMN IF NOT EXISTS ""SubscriptionEndsAt"" TIMESTAMP WITH TIME ZONE NULL;
                    ALTER TABLE ""Stores"" ADD COLUMN IF NOT EXISTS ""AiGenerationsCount"" INT NOT NULL DEFAULT 0;
                    ALTER TABLE ""Stores"" ADD COLUMN IF NOT EXISTS ""AiQuotaResetDate"" TIMESTAMP WITH TIME ZONE NULL;
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
                    CREATE TABLE IF NOT EXISTS ""StoreCoupons"" (
                        ""Id"" UUID NOT NULL PRIMARY KEY,
                        ""StoreId"" UUID NOT NULL REFERENCES ""Stores""(""Id"") ON DELETE CASCADE,
                        ""Code"" VARCHAR(50) NOT NULL,
                        ""DiscountType"" VARCHAR(20) NOT NULL DEFAULT 'Percentage',
                        ""DiscountValue"" NUMERIC(10, 2) NOT NULL,
                        ""ExpiryDate"" TIMESTAMP WITH TIME ZONE NULL,
                        ""UsageLimit"" INT NULL,
                        ""TimesUsed"" INT NOT NULL DEFAULT 0,
                        ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
                        ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                    );
                    CREATE TABLE IF NOT EXISTS ""SuperAdmins"" (
                        ""Id"" UUID NOT NULL PRIMARY KEY,
                        ""Email"" VARCHAR(150) NOT NULL UNIQUE,
                        ""PasswordHash"" VARCHAR(255) NOT NULL,
                        ""ResetToken"" VARCHAR(100) NULL,
                        ""ResetTokenExpiresAt"" TIMESTAMP WITH TIME ZONE NULL,
                        ""UpdatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                    );
                    CREATE TABLE IF NOT EXISTS ""PlatformSettings"" (
                        ""Id"" INT NOT NULL PRIMARY KEY,
                        ""ProMonthlyPrice"" NUMERIC(10, 2) NOT NULL DEFAULT 299,
                        ""ProAnnualPrice"" NUMERIC(10, 2) NOT NULL DEFAULT 2499,
                        ""ProProductLimit"" INT NOT NULL DEFAULT 100,
                        ""ProCouponLimit"" INT NOT NULL DEFAULT 15,
                        ""ProAiLimit"" INT NOT NULL DEFAULT 15,
                        ""VipMonthlyPrice"" NUMERIC(10, 2) NOT NULL DEFAULT 599,
                        ""VipAnnualPrice"" NUMERIC(10, 2) NOT NULL DEFAULT 4999,
                        ""VipProductLimit"" INT NOT NULL DEFAULT 999999,
                        ""VipCouponLimit"" INT NOT NULL DEFAULT 999999,
                        ""VipAiLimit"" INT NOT NULL DEFAULT 150,
                        ""IsLaunchDiscountBannerActive"" BOOLEAN NOT NULL DEFAULT TRUE,
                        ""LaunchDiscountText"" VARCHAR(500) NOT NULL DEFAULT '🔥 عروض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!',
                        ""VodafoneCashWallet"" VARCHAR(50) NOT NULL DEFAULT '01027150123',
                        ""InstaPayHandle"" VARCHAR(100) NOT NULL DEFAULT 'watsstore@instapay',
                        ""UpdatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                    );
                    ALTER TABLE ""PlatformSettings"" ADD COLUMN IF NOT EXISTS ""VodafoneCashWallet"" VARCHAR(50) NOT NULL DEFAULT '01027150123';
                    ALTER TABLE ""PlatformSettings"" ADD COLUMN IF NOT EXISTS ""InstaPayHandle"" VARCHAR(100) NOT NULL DEFAULT 'watsstore@instapay';

                    CREATE TABLE IF NOT EXISTS ""SubscriptionRequests"" (
                        ""Id"" UUID NOT NULL PRIMARY KEY,
                        ""StoreId"" UUID NOT NULL REFERENCES ""Stores""(""Id"") ON DELETE CASCADE,
                        ""StoreName"" VARCHAR(150) NOT NULL,
                        ""MerchantEmail"" VARCHAR(200) NOT NULL,
                        ""MerchantPhone"" VARCHAR(50) NOT NULL,
                        ""PlanType"" VARCHAR(20) NOT NULL,
                        ""BillingCycle"" VARCHAR(20) NOT NULL,
                        ""Amount"" NUMERIC(10, 2) NOT NULL,
                        ""PaymentMethod"" VARCHAR(50) NOT NULL,
                        ""SenderIdentifier"" VARCHAR(100) NULL,
                        ""TransactionId"" VARCHAR(100) NOT NULL,
                        ""Notes"" TEXT NULL,
                        ""Status"" VARCHAR(20) NOT NULL DEFAULT 'Pending',
                        ""AdminNotes"" TEXT NULL,
                        ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        ""ReviewedAt"" TIMESTAMP WITH TIME ZONE NULL
                    );
                    ALTER TABLE ""SubscriptionRequests"" ADD COLUMN IF NOT EXISTS ""SenderIdentifier"" VARCHAR(100) NULL;
                    CREATE INDEX IF NOT EXISTS ""IX_SubscriptionRequests_StoreId_Status"" ON ""SubscriptionRequests"" (""StoreId"", ""Status"");
                    CREATE INDEX IF NOT EXISTS ""IX_SubscriptionRequests_CreatedAt"" ON ""SubscriptionRequests"" (""CreatedAt"");
                ");
                logger.LogInformation("PostgreSQL database columns & StoreReviews/StoreCoupons/SuperAdmins/PlatformSettings/SubscriptionRequests tables verified/applied successfully.");
            }
            else
            {
                await db.Database.ExecuteSqlRawAsync(@"
                    IF COL_LENGTH('Stores', 'VodafoneCashNumber') IS NULL 
                        ALTER TABLE Stores ADD VodafoneCashNumber NVARCHAR(20) NULL;
                    IF COL_LENGTH('Stores', 'InstaPayAddress') IS NULL 
                        ALTER TABLE Stores ADD InstaPayAddress NVARCHAR(100) NULL;
                    IF COL_LENGTH('Stores', 'ViewCount') IS NULL 
                        ALTER TABLE Stores ADD ViewCount INT NOT NULL CONSTRAINT DF_Stores_ViewCount DEFAULT 0;
                    IF COL_LENGTH('Stores', 'SubscriptionEndsAt') IS NULL 
                        ALTER TABLE Stores ADD SubscriptionEndsAt DATETIME2 NULL;
                    IF COL_LENGTH('Stores', 'AiGenerationsCount') IS NULL 
                        ALTER TABLE Stores ADD AiGenerationsCount INT NOT NULL CONSTRAINT DF_Stores_AiGenerationsCount DEFAULT 0;
                    IF COL_LENGTH('Stores', 'AiQuotaResetDate') IS NULL 
                        ALTER TABLE Stores ADD AiQuotaResetDate DATETIME2 NULL;
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

                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StoreCoupons')
                    BEGIN
                        CREATE TABLE StoreCoupons (
                            Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                            StoreId UNIQUEIDENTIFIER NOT NULL,
                            Code NVARCHAR(50) NOT NULL,
                            DiscountType NVARCHAR(20) NOT NULL DEFAULT 'Percentage',
                            DiscountValue DECIMAL(10, 2) NOT NULL,
                            ExpiryDate DATETIME2 NULL,
                            UsageLimit INT NULL,
                            TimesUsed INT NOT NULL DEFAULT 0,
                            IsActive BIT NOT NULL DEFAULT 1,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            CONSTRAINT FK_StoreCoupons_Stores_StoreId FOREIGN KEY (StoreId) REFERENCES Stores(Id) ON DELETE CASCADE
                        );
                        CREATE UNIQUE INDEX IX_StoreCoupons_StoreId_Code ON StoreCoupons (StoreId, Code);
                        CREATE INDEX IX_StoreCoupons_StoreId_IsActive ON StoreCoupons (StoreId, IsActive);
                    END

                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SuperAdmins')
                    BEGIN
                        CREATE TABLE SuperAdmins (
                            Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                            Email NVARCHAR(150) NOT NULL UNIQUE,
                            PasswordHash NVARCHAR(255) NOT NULL,
                            ResetToken NVARCHAR(100) NULL,
                            ResetTokenExpiresAt DATETIME2 NULL,
                            UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                        );
                    END

                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PlatformSettings')
                    BEGIN
                        CREATE TABLE PlatformSettings (
                            Id INT NOT NULL PRIMARY KEY DEFAULT 1,
                            ProMonthlyPrice DECIMAL(10, 2) NOT NULL DEFAULT 299,
                            ProAnnualPrice DECIMAL(10, 2) NOT NULL DEFAULT 2499,
                            ProProductLimit INT NOT NULL DEFAULT 100,
                            ProCouponLimit INT NOT NULL DEFAULT 15,
                            ProAiLimit INT NOT NULL DEFAULT 15,
                            VipMonthlyPrice DECIMAL(10, 2) NOT NULL DEFAULT 599,
                            VipAnnualPrice DECIMAL(10, 2) NOT NULL DEFAULT 4999,
                            VipProductLimit INT NOT NULL DEFAULT 999999,
                            VipCouponLimit INT NOT NULL DEFAULT 999999,
                            VipAiLimit INT NOT NULL DEFAULT 150,
                            IsLaunchDiscountBannerActive BIT NOT NULL DEFAULT 1,
                            LaunchDiscountText NVARCHAR(500) NOT NULL DEFAULT N'🔥 عروض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!',
                            VodafoneCashWallet NVARCHAR(50) NOT NULL DEFAULT N'01027150123',
                            InstaPayHandle NVARCHAR(100) NOT NULL DEFAULT N'watsstore@instapay',
                            UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                        );
                    END

                    IF COL_LENGTH('PlatformSettings', 'VodafoneCashWallet') IS NULL 
                        ALTER TABLE PlatformSettings ADD VodafoneCashWallet NVARCHAR(50) NOT NULL CONSTRAINT DF_PlatformSettings_VodafoneCashWallet DEFAULT N'01027150123';
                    IF COL_LENGTH('PlatformSettings', 'InstaPayHandle') IS NULL 
                        ALTER TABLE PlatformSettings ADD InstaPayHandle NVARCHAR(100) NOT NULL CONSTRAINT DF_PlatformSettings_InstaPayHandle DEFAULT N'watsstore@instapay';

                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SubscriptionRequests')
                    BEGIN
                        CREATE TABLE SubscriptionRequests (
                            Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                            StoreId UNIQUEIDENTIFIER NOT NULL,
                            StoreName NVARCHAR(150) NOT NULL,
                            MerchantEmail NVARCHAR(200) NOT NULL,
                            MerchantPhone NVARCHAR(50) NOT NULL,
                            PlanType NVARCHAR(20) NOT NULL,
                            BillingCycle NVARCHAR(20) NOT NULL,
                            Amount DECIMAL(10, 2) NOT NULL,
                            PaymentMethod NVARCHAR(50) NOT NULL,
                            SenderIdentifier NVARCHAR(100) NULL,
                            TransactionId NVARCHAR(100) NOT NULL,
                            Notes NVARCHAR(MAX) NULL,
                            Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
                            AdminNotes NVARCHAR(MAX) NULL,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            ReviewedAt DATETIME2 NULL,
                            CONSTRAINT FK_SubscriptionRequests_Stores_StoreId FOREIGN KEY (StoreId) REFERENCES Stores(Id) ON DELETE CASCADE
                        );
                        CREATE INDEX IX_SubscriptionRequests_StoreId_Status ON SubscriptionRequests (StoreId, Status);
                        CREATE INDEX IX_SubscriptionRequests_CreatedAt ON SubscriptionRequests (CreatedAt);
                    END

                    IF COL_LENGTH('SubscriptionRequests', 'SenderIdentifier') IS NULL 
                        ALTER TABLE SubscriptionRequests ADD SenderIdentifier NVARCHAR(100) NULL;
                ");
                logger.LogInformation("SQL Server database column migrations & StoreReviews/StoreCoupons/SuperAdmins/PlatformSettings/SubscriptionRequests tables checked and applied successfully.");
            }
        }
        catch (Exception colEx)
        {
            logger.LogWarning(colEx, "Column/Table migration check skipped or failed.");
        }

        // Auto-seed default Super Admin account (abdallahsay10@gmail.com)
        try
        {
            var adminEmail = "abdallahsay10@gmail.com";
            var existingAdmin = await db.SuperAdmins.FirstOrDefaultAsync(a => a.Email == adminEmail);
            if (existingAdmin == null)
            {
                var legacyAdmin = await db.SuperAdmins.FirstOrDefaultAsync(a => a.Email == "admin@watsstore.com");
                if (legacyAdmin != null)
                {
                    db.SuperAdmins.Remove(legacyAdmin);
                }

                var defaultHash = BCrypt.Net.BCrypt.HashPassword("Admin@WatsStore2026!");
                db.SuperAdmins.Add(new SuperAdmin
                {
                    Id = Guid.NewGuid(),
                    Email = adminEmail,
                    PasswordHash = defaultHash,
                    UpdatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
                logger.LogInformation("Super Admin account seeded successfully for {Email}", adminEmail);
            }
        }
        catch (Exception adminEx)
        {
            logger.LogWarning(adminEx, "Super Admin seeding skipped or failed.");
        }

        // Auto-seed default PlatformSettings
        try
        {
            var existingSettings = await db.PlatformSettings.FirstOrDefaultAsync(p => p.Id == 1);
            if (existingSettings == null)
            {
                db.PlatformSettings.Add(new PlatformSetting
                {
                    Id = 1,
                    ProMonthlyPrice = 299m,
                    ProAnnualPrice = 2499m,
                    ProProductLimit = 100,
                    ProCouponLimit = 15,
                    ProAiLimit = 15,
                    VipMonthlyPrice = 599m,
                    VipAnnualPrice = 4999m,
                    VipProductLimit = 999999,
                    VipCouponLimit = 999999,
                    VipAiLimit = 150,
                    IsLaunchDiscountBannerActive = true,
                    LaunchDiscountText = "🔥 عروض الإطلاق التجاري: احصل على خصم إضافي عند الاشتراك السنوي اليوم!",
                    UpdatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
                logger.LogInformation("PlatformSettings row seeded successfully.");
            }
        }
        catch (Exception settingsEx)
        {
            logger.LogWarning(settingsEx, "PlatformSettings seeding skipped or failed.");
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

        // Seed default promo code 'MASAR10' for al-amal-fashion if none exist
        if (amalStore != null && !await db.StoreCoupons.AnyAsync(c => c.StoreId == amalStore.Id))
        {
            logger.LogInformation("Seeding default promo code 'MASAR10' for 'al-amal-fashion'...");
            var coupon1 = new StoreCoupon
            {
                Id = Guid.NewGuid(),
                StoreId = amalStore.Id,
                Code = "MASAR10",
                DiscountType = "Percentage",
                DiscountValue = 10.00m,
                ExpiryDate = DateTime.UtcNow.AddMonths(3),
                UsageLimit = 100,
                TimesUsed = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.StoreCoupons.Add(coupon1);
            await db.SaveChangesAsync();
            logger.LogInformation("Promo code 'MASAR10' seeded successfully.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database migration or seeding.");
    }
}

app.Run();
