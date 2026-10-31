SET XACT_ABORT ON;
BEGIN TRANSACTION;
-- Additive schema only. Rehearse against a restored production backup first.
-- Existing orders retain Pending; no inference of payment or fulfilled sales.
IF COL_LENGTH('WhatsAppOrders','Status') IS NULL ALTER TABLE [WhatsAppOrders] ADD [Status] nvarchar(30) NOT NULL DEFAULT 'Pending';
IF COL_LENGTH('WhatsAppOrders','PaymentStatus') IS NULL ALTER TABLE [WhatsAppOrders] ADD [PaymentStatus] nvarchar(30) NOT NULL DEFAULT 'Unpaid';
IF COL_LENGTH('WhatsAppOrders','TransferReference') IS NULL ALTER TABLE [WhatsAppOrders] ADD [TransferReference] nvarchar(100) NULL;
IF COL_LENGTH('WhatsAppOrders','TrackingToken') IS NULL ALTER TABLE [WhatsAppOrders] ADD [TrackingToken] nvarchar(64) NULL;
IF COL_LENGTH('WhatsAppOrders','IdempotencyKey') IS NULL ALTER TABLE [WhatsAppOrders] ADD [IdempotencyKey] nvarchar(80) NULL;
IF COL_LENGTH('WhatsAppOrders','RequestHash') IS NULL ALTER TABLE [WhatsAppOrders] ADD [RequestHash] nvarchar(64) NULL;
IF COL_LENGTH('WhatsAppOrders','Channel') IS NULL ALTER TABLE [WhatsAppOrders] ADD [Channel] nvarchar(20) NOT NULL DEFAULT 'whatsapp';
IF COL_LENGTH('WhatsAppOrders','Subtotal') IS NULL ALTER TABLE [WhatsAppOrders] ADD [Subtotal] decimal(10,2) NOT NULL DEFAULT 0;
IF COL_LENGTH('WhatsAppOrders','DiscountAmount') IS NULL ALTER TABLE [WhatsAppOrders] ADD [DiscountAmount] decimal(10,2) NOT NULL DEFAULT 0;
IF COL_LENGTH('WhatsAppOrders','DeliveryFee') IS NULL ALTER TABLE [WhatsAppOrders] ADD [DeliveryFee] decimal(10,2) NOT NULL DEFAULT 0;
IF COL_LENGTH('WhatsAppOrders','CouponCode') IS NULL ALTER TABLE [WhatsAppOrders] ADD [CouponCode] nvarchar(50) NULL;
IF COL_LENGTH('WhatsAppOrders','ShippingSummary') IS NULL ALTER TABLE [WhatsAppOrders] ADD [ShippingSummary] nvarchar(max) NULL;
IF COL_LENGTH('WhatsAppOrders','InventoryDeducted') IS NULL ALTER TABLE [WhatsAppOrders] ADD [InventoryDeducted] bit NOT NULL DEFAULT 0;
IF OBJECT_ID(N'CommerceSettings',N'U') IS NULL BEGIN
CREATE TABLE [CommerceSettings] (
  [StoreId] uniqueidentifier NOT NULL,
  [PublishedTheme] nvarchar(20) NOT NULL DEFAULT 'editorial',
  [DraftTheme] nvarchar(20) NOT NULL DEFAULT 'editorial',
  [PreviousTheme] nvarchar(20) NOT NULL DEFAULT 'editorial',
  [CheckoutMode] nvarchar(20) NOT NULL DEFAULT 'whatsapp',
  [CashOnDelivery] bit NOT NULL DEFAULT 1,
  [InstaPay] bit NOT NULL DEFAULT 0,
  [MobileWallet] bit NOT NULL DEFAULT 0,
  [ShippingZonesJson] nvarchar(max) NOT NULL DEFAULT '[]',
  PRIMARY KEY ([StoreId]),
  FOREIGN KEY ([StoreId]) REFERENCES [Stores]([Id]) ON DELETE CASCADE
);
END;
IF OBJECT_ID(N'InventoryStocks',N'U') IS NULL BEGIN
CREATE TABLE [InventoryStocks] (
  [Id] uniqueidentifier NOT NULL,
  [StoreId] uniqueidentifier NOT NULL,
  [ProductId] uniqueidentifier NOT NULL,
  [VariantKey] nvarchar(64) NOT NULL DEFAULT '',
  [SelectedVariantsJson] nvarchar(max) NOT NULL DEFAULT '{}',
  [Quantity] int NOT NULL DEFAULT 0,
  [LowStockThreshold] int NOT NULL DEFAULT 5,
  PRIMARY KEY ([Id]),
  CHECK ([Quantity] >= 0),
  CHECK ([LowStockThreshold] >= 0)
);
END;
IF OBJECT_ID(N'OrderHistories',N'U') IS NULL BEGIN
CREATE TABLE [OrderHistories] (
  [Id] uniqueidentifier NOT NULL,
  [OrderId] uniqueidentifier NOT NULL,
  [StoreId] uniqueidentifier NOT NULL,
  [Status] nvarchar(30) NOT NULL DEFAULT 'Pending',
  [Note] nvarchar(500) NULL,
  [CreatedAt] datetime2 NOT NULL,
  PRIMARY KEY ([Id])
);
END;
IF OBJECT_ID(N'InventoryAdjustments',N'U') IS NULL BEGIN
CREATE TABLE [InventoryAdjustments] (
  [Id] uniqueidentifier NOT NULL,
  [StoreId] uniqueidentifier NOT NULL,
  [ProductId] uniqueidentifier NOT NULL,
  [VariantKey] nvarchar(64) NOT NULL DEFAULT '',
  [Adjustment] int NOT NULL,
  [Reason] nvarchar(500) NOT NULL,
  [CreatedAt] datetime2 NOT NULL,
  PRIMARY KEY ([Id])
);
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_WhatsAppOrders_StoreId_IdempotencyKey' AND object_id=OBJECT_ID('WhatsAppOrders')) EXEC('CREATE UNIQUE INDEX [IX_WhatsAppOrders_StoreId_IdempotencyKey] ON [WhatsAppOrders] ([StoreId], [IdempotencyKey]) WHERE [IdempotencyKey] IS NOT NULL');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_WhatsAppOrders_TrackingToken' AND object_id=OBJECT_ID('WhatsAppOrders')) EXEC('CREATE UNIQUE INDEX [IX_WhatsAppOrders_TrackingToken] ON [WhatsAppOrders] ([TrackingToken]) WHERE [TrackingToken] IS NOT NULL');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_InventoryStocks_StoreId_ProductId_VariantKey' AND object_id=OBJECT_ID('InventoryStocks')) CREATE UNIQUE INDEX [IX_InventoryStocks_StoreId_ProductId_VariantKey] ON [InventoryStocks] ([StoreId], [ProductId], [VariantKey]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_OrderHistories_StoreId_OrderId_CreatedAt' AND object_id=OBJECT_ID('OrderHistories')) CREATE INDEX [IX_OrderHistories_StoreId_OrderId_CreatedAt] ON [OrderHistories] ([StoreId], [OrderId], [CreatedAt]);
COMMIT;
