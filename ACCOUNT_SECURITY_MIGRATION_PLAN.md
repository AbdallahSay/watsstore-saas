# WatsStore — Account Security Database Migration Plan

**Release Phase:** WatsStore 2.0 — Phase 12  
**Target Environment:** MonsterASP Production (`https://watsstore.runasp.net`) & Local Development  
**Database Engine:** Microsoft SQL Server (Production) / SQLite (Testing)  
**Migration Strategy:** Zero-Downtime, Non-Breaking, Grandfathered Existing Merchants  

---

## 1. Objectives & Safety Commitments

1. **Protect Active Merchants:** Under no circumstances should existing merchants lose access to their store dashboard, existing theme configurations, products, or order streams.
2. **Grandfather Existing Accounts:** Merchants registered prior to Phase 12 deployment will be automatically grandfathered (`EmailVerified = true`, `EmailVerificationStatus = "Grandfathered"`) to ensure zero operational disruption.
3. **Seamless Schema Evolution:** Add non-breaking nullable columns and the new `MerchantOtpChallenges` table with indexed foreign keys.
4. **Zero Downtime:** Schema updates can be applied without taking the backend offline or interrupting shopping checkout.

---

## 2. Schema Delta (DDL Specification)

### 2.1. Columns Added to `Stores` Table

```sql
-- Production SQL Server Migration Script
ALTER TABLE [Stores] ADD [EmailVerified] BIT NOT NULL CONSTRAINT [DF_Stores_EmailVerified] DEFAULT (0);
ALTER TABLE [Stores] ADD [EmailVerifiedAt] DATETIME2 NULL;
ALTER TABLE [Stores] ADD [EmailVerificationStatus] NVARCHAR(50) NOT NULL CONSTRAINT [DF_Stores_EmailVerificationStatus] DEFAULT ('Pending');
ALTER TABLE [Stores] ADD [PhoneVerified] BIT NOT NULL CONSTRAINT [DF_Stores_PhoneVerified] DEFAULT (0);
ALTER TABLE [Stores] ADD [PhoneVerifiedAt] DATETIME2 NULL;
ALTER TABLE [Stores] ADD [PasswordChangedAt] DATETIME2 NULL;
ALTER TABLE [Stores] ADD [SecurityStamp] NVARCHAR(100) NULL;
GO
```

### 2.2. New Table: `MerchantOtpChallenges`

```sql
CREATE TABLE [MerchantOtpChallenges] (
    [Id] NVARCHAR(450) NOT NULL,
    [StoreId] NVARCHAR(450) NOT NULL,
    [Channel] NVARCHAR(50) NOT NULL,
    [CodeHash] NVARCHAR(256) NOT NULL,
    [Salt] NVARCHAR(128) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [ExpiresAt] DATETIME2 NOT NULL,
    [IsUsed] BIT NOT NULL CONSTRAINT [DF_MerchantOtpChallenges_IsUsed] DEFAULT (0),
    [UsedAt] DATETIME2 NULL,
    [AttemptCount] INT NOT NULL CONSTRAINT [DF_MerchantOtpChallenges_AttemptCount] DEFAULT (0),
    [MaxAttempts] INT NOT NULL CONSTRAINT [DF_MerchantOtpChallenges_MaxAttempts] DEFAULT (5),
    [RecoveryToken] NVARCHAR(256) NULL,
    [TokenExpiresAt] DATETIME2 NULL,
    CONSTRAINT [PK_MerchantOtpChallenges] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MerchantOtpChallenges_Stores_StoreId] FOREIGN KEY ([StoreId]) 
        REFERENCES [Stores] ([Id]) ON DELETE CASCADE
);
GO

-- Composite indexes for high-throughput challenge lookups and rate-limiting
CREATE INDEX [IX_MerchantOtpChallenges_StoreId_Channel_IsUsed] 
    ON [MerchantOtpChallenges] ([StoreId], [Channel], [IsUsed]);

CREATE INDEX [IX_MerchantOtpChallenges_RecoveryToken] 
    ON [MerchantOtpChallenges] ([RecoveryToken]) 
    WHERE [RecoveryToken] IS NOT NULL;
GO
```

---

## 3. Data Migration & Grandfathering Script

To prevent active merchants from being blocked when publishing themes, run this idempotent script immediately following schema creation:

```sql
-- 1. Grandfather all existing stores created before Phase 12 deployment
UPDATE [Stores]
SET 
    [EmailVerified] = 1,
    [EmailVerificationStatus] = 'Grandfathered',
    [EmailVerifiedAt] = GETUTCDATE()
WHERE 
    [EmailVerificationStatus] = 'Pending' 
    AND [CreatedAt] < '2026-11-03 00:00:00'; -- Deployment cutoff timestamp

-- 2. Populate SecurityStamp for any existing store missing a security stamp
UPDATE [Stores]
SET [SecurityStamp] = REPLACE(CONVERT(NVARCHAR(36), NEWID()), '-', '')
WHERE [SecurityStamp] IS NULL OR [SecurityStamp] = '';
GO
```

---

## 4. Rollback & Disaster Recovery Plan

If unexpected issues arise during deployment:

### 4.1. Rollback Procedure
1. The added columns on `Stores` and the new `MerchantOtpChallenges` table are strictly additive and backward compatible with previous backend builds.
2. In the event of a rollback, redeploy the previous backend release. The previous application version will ignore the extra columns and table.
3. Do NOT drop the `Stores` columns unless explicitly instructed; doing so would destroy verification timestamps.

### 4.2. Database Backup Verification
Prior to executing the production migration on MonsterASP:
1. Access the MonsterASP MSSQL management console.
2. Create an on-demand full database snapshot (`WatsStore_Production_Backup_Phase12.bak`).
3. Verify backup file size and download a copy to secure offsite storage.
