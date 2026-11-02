-- Additive SQL Server migration. Apply only after a verified backup/restore rehearsal.
-- WebPush is disabled by default; no existing customer is automatically subscribed.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'StoreNotificationSettings',N'U') IS NULL
CREATE TABLE StoreNotificationSettings (
 StoreId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY REFERENCES Stores(Id),
 WebPushEnabled BIT NOT NULL DEFAULT 0
);
IF OBJECT_ID(N'OrderPushSubscriptions',N'U') IS NULL
CREATE TABLE OrderPushSubscriptions (
 Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
 StoreId UNIQUEIDENTIFIER NOT NULL REFERENCES Stores(Id),
 OrderId UNIQUEIDENTIFIER NOT NULL REFERENCES WhatsAppOrders(Id),
 Endpoint NVARCHAR(2048) NOT NULL,
 EndpointHash NVARCHAR(64) NOT NULL,
 P256dh NVARCHAR(100) NOT NULL,
 Auth NVARCHAR(50) NOT NULL,
 RevocationHash NVARCHAR(64) NOT NULL,
 Active BIT NOT NULL DEFAULT 1,
 CreatedAt DATETIME2 NOT NULL,
 ExpiresAt DATETIME2 NOT NULL
);
IF OBJECT_ID(N'OrderNotificationDeliveries',N'U') IS NULL
CREATE TABLE OrderNotificationDeliveries (
 Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
 StoreId UNIQUEIDENTIFIER NOT NULL,
 OrderId UNIQUEIDENTIFIER NOT NULL,
 EventId UNIQUEIDENTIFIER NOT NULL REFERENCES OrderHistories(Id),
 SubscriptionId UNIQUEIDENTIFIER NOT NULL REFERENCES OrderPushSubscriptions(Id),
 OrderStatus NVARCHAR(30) NOT NULL,
 State NVARCHAR(30) NOT NULL DEFAULT 'Pending',
 Attempts INT NOT NULL DEFAULT 0,
 ManualRetries INT NOT NULL DEFAULT 0,
 LastHttpStatus INT NULL,
 Lease UNIQUEIDENTIFIER NULL,
 NextAttemptAt DATETIME2 NOT NULL,
 CreatedAt DATETIME2 NOT NULL,
 AcceptedAt DATETIME2 NULL
);
IF OBJECT_ID(N'PushDeliveryAttempts',N'U') IS NULL
CREATE TABLE PushDeliveryAttempts (
 Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
 DeliveryId UNIQUEIDENTIFIER NOT NULL REFERENCES OrderNotificationDeliveries(Id),
 StoreId UNIQUEIDENTIFIER NOT NULL,
 Attempt INT NOT NULL,
 HttpStatus INT NULL,
 CreatedAt DATETIME2 NOT NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_OrderPushSubscriptions_StoreId_OrderId_EndpointHash' AND object_id=OBJECT_ID('OrderPushSubscriptions'))
 CREATE UNIQUE INDEX IX_OrderPushSubscriptions_StoreId_OrderId_EndpointHash ON OrderPushSubscriptions(StoreId,OrderId,EndpointHash);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_OrderPushSubscriptions_StoreId_Active' AND object_id=OBJECT_ID('OrderPushSubscriptions'))
 CREATE INDEX IX_OrderPushSubscriptions_StoreId_Active ON OrderPushSubscriptions(StoreId,Active);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_OrderNotificationDeliveries_EventId_SubscriptionId' AND object_id=OBJECT_ID('OrderNotificationDeliveries'))
 CREATE UNIQUE INDEX IX_OrderNotificationDeliveries_EventId_SubscriptionId ON OrderNotificationDeliveries(EventId,SubscriptionId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_OrderNotificationDeliveries_State_NextAttemptAt' AND object_id=OBJECT_ID('OrderNotificationDeliveries'))
 CREATE INDEX IX_OrderNotificationDeliveries_State_NextAttemptAt ON OrderNotificationDeliveries(State,NextAttemptAt);
COMMIT;
