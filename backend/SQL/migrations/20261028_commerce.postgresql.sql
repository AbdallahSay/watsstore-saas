BEGIN;
-- Additive schema only. Rehearse against a restored production backup first.
-- Existing orders retain Pending; no inference of payment or fulfilled sales.
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "Status" varchar(30) NOT NULL DEFAULT 'Pending';
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "PaymentStatus" varchar(30) NOT NULL DEFAULT 'Unpaid';
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "TransferReference" varchar(100) NULL;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "TrackingToken" varchar(64) NULL;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "IdempotencyKey" varchar(80) NULL;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "RequestHash" varchar(64) NULL;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "Channel" varchar(20) NOT NULL DEFAULT 'whatsapp';
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "Subtotal" decimal(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "DiscountAmount" decimal(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "DeliveryFee" decimal(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "CouponCode" varchar(50) NULL;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "ShippingSummary" text NULL;
ALTER TABLE "WhatsAppOrders" ADD COLUMN IF NOT EXISTS "InventoryDeducted" boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS "CommerceSettings" (
  "StoreId" uuid NOT NULL,
  "PublishedTheme" varchar(20) NOT NULL DEFAULT 'editorial',
  "DraftTheme" varchar(20) NOT NULL DEFAULT 'editorial',
  "PreviousTheme" varchar(20) NOT NULL DEFAULT 'editorial',
  "CheckoutMode" varchar(20) NOT NULL DEFAULT 'whatsapp',
  "CashOnDelivery" boolean NOT NULL DEFAULT true,
  "InstaPay" boolean NOT NULL DEFAULT false,
  "MobileWallet" boolean NOT NULL DEFAULT false,
  "ShippingZonesJson" text NOT NULL DEFAULT '[]',
  PRIMARY KEY ("StoreId"),
  FOREIGN KEY ("StoreId") REFERENCES "Stores"("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "InventoryStocks" (
  "Id" uuid NOT NULL,
  "StoreId" uuid NOT NULL,
  "ProductId" uuid NOT NULL,
  "VariantKey" varchar(64) NOT NULL DEFAULT '',
  "SelectedVariantsJson" text NOT NULL DEFAULT '{}',
  "Quantity" int NOT NULL DEFAULT 0,
  "LowStockThreshold" int NOT NULL DEFAULT 5,
  PRIMARY KEY ("Id"),
  CHECK ("Quantity" >= 0),
  CHECK ("LowStockThreshold" >= 0)
);
CREATE TABLE IF NOT EXISTS "OrderHistories" (
  "Id" uuid NOT NULL,
  "OrderId" uuid NOT NULL,
  "StoreId" uuid NOT NULL,
  "Status" varchar(30) NOT NULL DEFAULT 'Pending',
  "Note" varchar(500) NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  PRIMARY KEY ("Id")
);
CREATE TABLE IF NOT EXISTS "InventoryAdjustments" (
  "Id" uuid NOT NULL,
  "StoreId" uuid NOT NULL,
  "ProductId" uuid NOT NULL,
  "VariantKey" varchar(64) NOT NULL DEFAULT '',
  "Adjustment" int NOT NULL,
  "Reason" varchar(500) NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  PRIMARY KEY ("Id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_WhatsAppOrders_StoreId_IdempotencyKey" ON "WhatsAppOrders" ("StoreId", "IdempotencyKey") WHERE "IdempotencyKey" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "IX_WhatsAppOrders_TrackingToken" ON "WhatsAppOrders" ("TrackingToken") WHERE "TrackingToken" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "IX_InventoryStocks_StoreId_ProductId_VariantKey" ON "InventoryStocks" ("StoreId", "ProductId", "VariantKey");
CREATE INDEX IF NOT EXISTS "IX_OrderHistories_StoreId_OrderId_CreatedAt" ON "OrderHistories" ("StoreId", "OrderId", "CreatedAt");
COMMIT;
