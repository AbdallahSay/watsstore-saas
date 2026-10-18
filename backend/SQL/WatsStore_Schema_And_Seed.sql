-- ===================================================================================
-- WatsStore SaaS Database Schema & Seed Data (SQL Server)
-- Micro-SaaS for Egyptian Merchants: Instant WhatsApp Store & Digital Catalog
-- ===================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'WatsStoreDb')
BEGIN
    CREATE DATABASE [WatsStoreDb];
END
GO

USE [WatsStoreDb];
GO

-- 1. Create Stores Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stores]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Stores] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [OwnerName] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(200) NOT NULL,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [StoreName] NVARCHAR(150) NOT NULL,
        [Slug] NVARCHAR(100) NOT NULL,
        [PublicCode] NVARCHAR(20) NOT NULL,
        [WhatsAppNumber] NVARCHAR(30) NOT NULL,
        [BusinessCategory] NVARCHAR(100) NOT NULL,
        [City] NVARCHAR(100) NOT NULL,
        [AddressDetails] NVARCHAR(MAX) NULL,
        [LogoUrl] NVARCHAR(MAX) NULL,
        [CoverUrl] NVARCHAR(MAX) NULL,
        [ThemeColor] NVARCHAR(20) NOT NULL DEFAULT N'#10B981',
        [Currency] NVARCHAR(20) NOT NULL DEFAULT N'ج.م',
        [DeliveryFee] DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        [SeoTitle] NVARCHAR(MAX) NULL,
        [SeoDescription] NVARCHAR(MAX) NULL,
        [MetaPixelId] NVARCHAR(MAX) NULL,
        [PlanType] NVARCHAR(20) NOT NULL DEFAULT N'Free', -- Free, Pro, VIP
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SubscriptionEndsAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX [IX_Stores_Email] ON [dbo].[Stores]([Email]);
    CREATE UNIQUE INDEX [IX_Stores_Slug] ON [dbo].[Stores]([Slug]);
    CREATE UNIQUE INDEX [IX_Stores_PublicCode] ON [dbo].[Stores]([PublicCode]);
    CREATE INDEX [IX_Stores_City_BusinessCategory_IsActive] ON [dbo].[Stores]([City], [BusinessCategory], [IsActive]);
END
GO

-- 2. Create Categories Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Categories] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [StoreId] UNIQUEIDENTIFIER NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_Categories_Stores_StoreId] FOREIGN KEY ([StoreId]) 
            REFERENCES [dbo].[Stores]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_Categories_StoreId_SortOrder] ON [dbo].[Categories]([StoreId], [SortOrder]);
END
GO

-- 3. Create Products Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Products] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [StoreId] UNIQUEIDENTIFIER NOT NULL,
        [CategoryId] INT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Slug] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [Price] DECIMAL(10,2) NOT NULL,
        [CompareAtPrice] DECIMAL(10,2) NULL,
        [ImageUrl] NVARCHAR(MAX) NULL,
        [VariantsJson] NVARCHAR(MAX) NULL, -- JSON formatted: [{"name":"المقاس","options":["M","L"]}]
        [IsAvailable] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_Products_Stores_StoreId] FOREIGN KEY ([StoreId]) 
            REFERENCES [dbo].[Stores]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Products_Categories_CategoryId] FOREIGN KEY ([CategoryId]) 
            REFERENCES [dbo].[Categories]([Id]) ON DELETE SET NULL
    );

    CREATE INDEX [IX_Products_StoreId_Slug] ON [dbo].[Products]([StoreId], [Slug]);
    CREATE INDEX [IX_Products_StoreId_IsAvailable] ON [dbo].[Products]([StoreId], [IsAvailable]);
END
GO

-- 4. Create WhatsAppOrders Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WhatsAppOrders]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WhatsAppOrders] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [StoreId] UNIQUEIDENTIFIER NOT NULL,
        [OrderNumber] INT IDENTITY(1001,1) NOT NULL,
        [CustomerName] NVARCHAR(150) NOT NULL,
        [CustomerPhone] NVARCHAR(30) NOT NULL,
        [CustomerAddress] NVARCHAR(500) NOT NULL,
        [CustomerNotes] NVARCHAR(MAX) NULL,
        [ItemsJson] NVARCHAR(MAX) NOT NULL,
        [TotalAmount] DECIMAL(10,2) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_WhatsAppOrders_Stores_StoreId] FOREIGN KEY ([StoreId]) 
            REFERENCES [dbo].[Stores]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_WhatsAppOrders_StoreId_CreatedAt] ON [dbo].[WhatsAppOrders]([StoreId], [CreatedAt]);
END
GO

-- ===================================================================================
-- Seed Demo Store: 'al-amal-fashion' (بوتيك الأمل للأزياء الفاخرة)
-- Password is '123456' hashed with BCrypt
-- ===================================================================================
DECLARE @DemoStoreId UNIQUEIDENTIFIER = 'E6B5D7A1-4F29-4B52-9A8C-2D3B89C0F101';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Stores] WHERE [Slug] = N'al-amal-fashion')
BEGIN
    INSERT INTO [dbo].[Stores] (
        [Id], [OwnerName], [Email], [PasswordHash], [StoreName], [Slug], [PublicCode], 
        [WhatsAppNumber], [BusinessCategory], [City], [AddressDetails], [LogoUrl], [CoverUrl], 
        [ThemeColor], [Currency], [DeliveryFee], [SeoTitle], [SeoDescription], 
        [MetaPixelId], [PlanType], [IsActive], [CreatedAt]
    ) VALUES (
        @DemoStoreId,
        N'أحمد الأمل',
        N'demo@watsstore.com',
        N'$2a$11$w1n2pB9eZ4i/PzXwDkQzheJ3H4lMsmf14cR1N/O7a0uS3w4aT6s1u', -- BCrypt hash of '123456'
        N'بوتيك الأمل للأزياء الفاخرة',
        N'al-amal-fashion',
        N'AMAL2026',
        N'201012345678',
        N'ملابس وأزياء',
        N'الفيوم',
        N'شارع الجمهورية - برج الصفا - الدور الأرضي، الفيوم',
        N'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80',
        N'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        N'#10B981',
        N'ج.م',
        35.00,
        N'بوتيك الأمل | أحدث صيحات الفساتين والعبايات في الفيوم',
        N'تصفح أحدث كولكشن فساتين سواريه وعبايات كاجوال وحقائب في بوتيك الأمل بالفيوم، اطلب عبر الواتساب واستلم خلال 24 ساعة.',
        N'987654321012345',
        N'Pro',
        1,
        SYSUTCDATETIME()
    );

    -- Seed Categories
    DECLARE @Cat1Id INT, @Cat2Id INT, @Cat3Id INT;

    INSERT INTO [dbo].[Categories] ([StoreId], [Name], [SortOrder], [IsActive])
    VALUES (@DemoStoreId, N'فساتين وسهرات', 1, 1);
    SET @Cat1Id = SCOPE_IDENTITY();

    INSERT INTO [dbo].[Categories] ([StoreId], [Name], [SortOrder], [IsActive])
    VALUES (@DemoStoreId, N'عبايات كاجوال', 2, 1);
    SET @Cat2Id = SCOPE_IDENTITY();

    INSERT INTO [dbo].[Categories] ([StoreId], [Name], [SortOrder], [IsActive])
    VALUES (@DemoStoreId, N'إكسسوارات وحقائب', 3, 1);
    SET @Cat3Id = SCOPE_IDENTITY();

    -- Seed Products
    INSERT INTO [dbo].[Products] (
        [Id], [StoreId], [CategoryId], [Name], [Slug], [Description], [Price], 
        [CompareAtPrice], [ImageUrl], [VariantsJson], [IsAvailable], [SortOrder], [CreatedAt]
    ) VALUES (
        NEWID(), @DemoStoreId, @Cat1Id,
        N'فستان سواريه مخملي فاخر',
        N'luxury-velvet-evening-dress',
        N'فستان سواريه أنيق مصنوع من قماش المخمل الفاخر مع تطريز يدوي على الصدر والخصر، مناسب للمناسبات الراقية وحفلات الزفاف.',
        1250.00, 1500.00,
        N'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
        N'[{"name":"المقاس","options":["S","M","L","XL"]},{"name":"اللون","options":["أسود ملكي","عنابي دافئ","كحلي"]}]',
        1, 1, SYSUTCDATETIME()
    ),
    (
        NEWID(), @DemoStoreId, @Cat2Id,
        N'عباية خليجية مطرزة بالحرير',
        N'embroidered-khaleeji-abaya',
        N'عباية إماراتية كلاسيكية مع تطريز راقي بالخيوط الحريرية وقصة مريحة للعمل والخروجات اليومية.',
        850.00, 990.00,
        N'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
        N'[{"name":"المقاس","options":["52","54","56","58"]},{"name":"نوع الطرحة","options":["طرحة ليزر مطابقة","طرحة شيفون سادة"]}]',
        1, 2, SYSUTCDATETIME()
    ),
    (
        NEWID(), @DemoStoreId, @Cat3Id,
        N'حقيبة يد جلدية كلاسيك',
        N'classic-leather-handbag',
        N'شنطة يد مصنوعة من الجلد المقاوم للخدوش مع حزام كتف قابل للتعديل ومقصورات داخلية متعددة.',
        420.00, 500.00,
        N'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
        N'[{"name":"اللون","options":["بيج أنيق","أسود كلاسيك","كافيه"]}]',
        1, 3, SYSUTCDATETIME()
    ),
    (
        NEWID(), @DemoStoreId, @Cat3Id,
        N'طقم إكسسوار زركون مطلي بالذهب',
        N'gold-plated-zircon-jewelry-set',
        N'عقد وأقراط متناسقة بتصميم ألماسي جذاب مرصع بأحجار الزركون اللامعة ومطلي بماء الذهب عيار 18.',
        290.00, 380.00,
        N'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
        N'[{"name":"الموديل","options":["تصميم قطرة الندى","تصميم الوردة الملكية"]}]',
        1, 4, SYSUTCDATETIME()
    );
END
GO
