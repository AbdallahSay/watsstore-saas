# WatsStore — Demo Store & Test Data Inventory (Phase 12)

**Audit Date:** November 2026  
**Module:** Platform Multi-Tenant Cleanup & Production Readiness  
**Target:** Identification of demonstration, seed, and development stores  

---

## 1. Inventory Policy & Guiding Principles

> [!CAUTION]
> **Strict Non-Destructive Protection Policy:**  
> Real merchant data must never be deleted or altered without explicit administrator authorization. No automated cleanup script or migration may run uncontrolled `DELETE` operations on the `Stores` table.

This inventory categorizes all known demonstration and test store artifacts currently present in the codebase and test environments.

---

## 2. Codebase Seed Store Discovery

### 2.1. Seed Store: "متجر الأمل للأزياء" (Al Amal Fashion)
- **Store Name:** متجر الأمل للأزياء (Al Amal Fashion)
- **Slug:** `al-amal-fashion`
- **Owner Name:** سارة أحمد
- **Email:** `demo@watsstore.com`
- **Phone:** `01011653619`
- **City:** القاهرة
- **Category:** ملابس وأزياء
- **Plan Type:** `VIP`
- **Source Location:** `backend/Program.cs` (lines 450–600)
- **Associated Records in Seed:**
  - **Categories:**
    1. فساتين سهرة (Evening Dresses)
    2. عبايات خليجي (Gulf Abayas)
    3. أطقم كاجوال (Casual Sets)
    4. حقائب وأحذية (Bags & Shoes)
  - **Products:** 12 curated products with realistic imagery, variants, and Arabic descriptions.
  - **Theme:** Configured with active storefront theme (`editorial-luxe`).
- **Previous Vulnerability:**
  `Program.cs` previously executed `SeedDemoStoreAsync` unconditionally if the store did not exist, and the public login page had a quick-fill button exposing its credentials (`demo@watsstore.com` / `123456`).
- **Phase 12 Remediation Applied:**
  1. Quick-fill button **removed** from `frontend/src/app/login/page.tsx`.
  2. In `backend/Program.cs`, seed execution is gated:
     ```csharp
     var shouldSeedDemo = app.Environment.IsDevelopment() 
         || app.Environment.EnvironmentName == "Testing" 
         || app.Configuration.GetValue<bool>("Database:SeedDemoStore", false);
     ```
  3. The store itself remains safe as a showcase store for public directory browsing (`/s/al-amal-fashion`), but public login credentials are no longer exposed.

---

## 3. Store Classification Taxonomy

To prevent accidental data loss, all database stores in production and staging are categorized under the following taxonomy:

| Category | Definition | Action Permitted | Examples |
| :--- | :--- | :--- | :--- |
| **Category A: Production Merchant** | Real merchants onboarded via registration with genuine business catalogs and customer orders. | **STRICTLY PROTECTED.** Deletion forbidden under all circumstances. | Active stores created by genuine owners. |
| **Category B: Platform Showcase** | Official platform demonstration stores used to demonstrate themes to visitors. | **PRESERVE.** Retain storefront for public view (`/s/al-amal-fashion`), but disable public demo logins. | `al-amal-fashion` |
| **Category C: Staging / Test** | Automated test fixtures generated during E2E verification (e.g. `test-store-1234`). | **REVIEW & ARCHIVE.** Eligible for deletion only after explicit approval plan is signed off. | `test-auth-store-*` |

---

## 4. Associated Asset Analysis

Deleting a store requires accounting for cascade relationships:
1. `Categories` (FK: `StoreId`)
2. `Products` (FK: `StoreId`)
3. `Orders` & `OrderItems` (FK: `StoreId`)
4. `MerchantReviews` (FK: `StoreId`)
5. `StoreCoupons` (FK: `StoreId`)
6. `MerchantOtpChallenges` (FK: `StoreId` - new in Phase 12)
7. Uploaded assets on disk / cloud storage (logos, covers, product images).

---

## 5. Summary Recommendation

No stores should be deleted during the Phase 12 deployment. The mitigation implemented (removing public login shortcuts and gating seed generation) eliminates the security vulnerability while preserving showcase storefronts and protecting real merchant data.
