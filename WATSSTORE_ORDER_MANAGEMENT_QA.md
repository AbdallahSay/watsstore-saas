# WatsStore 2.0 — Order Lifecycle, State Transitions & Security QA Report

**Reference:** Amazon Seller Central Order Management & EF Core Multi-Tenant Architecture  
**Date:** 2026-11-03  
**Status:** 100% Passing & Verified  

---

## 1. Overview & Order State Machine

Order management in WatsStore 2.0 is designed around a strictly validated state transition model that ensures financial accuracy, inventory integrity, and tenant isolation.

### State Transition Diagram
```
                     +---------------------------------------+
                     |                 NEW                   |
                     |         (Customer Placed)             |
                     +---+-------------------------------+---+
                         |                               |
                         v                               v
             +-----------------------+       +-----------------------+
             |       CONFIRMED       |       |       CANCELLED       |
             |   (Merchant Accepted) |       |   (Restores Stock)    |
             +-----------+-----------+       +-----------------------+
                         |
                         v
             +-----------------------+
             |       PREPARING       |
             |   (Order Packed)      |
             +-----------+-----------+
                         |
                         v
             +-----------------------+
             |        SHIPPED        |
             |   (Out for Delivery)  |
             +-----------+-----------+
                         |
                         v
             +-----------------------+       +-----------------------+
             |       DELIVERED       |       |       REJECTED        |
             |   (Terminal Status)   |       |   (Restores Stock)    |
             +-----------------------+       +-----------------------+
```

---

## 2. Business Rules & Financial Safety

1. **Inventory Deduction on Placement:**
   - When an order is confirmed on checkout, stock for each ordered variant/product is automatically deducted in the database within a transaction.
   - If stock is insufficient, the checkout fails with `HTTP 409 Conflict`, preventing negative inventory.
2. **Stock Restoration on Cancellation/Rejection:**
   - Transitioning an order to `Cancelled` or `Rejected` automatically replenishes the exact inventory quantities back to the product/variants.
3. **Terminal Status Immutability:**
   - Orders marked `Delivered`, `Cancelled`, or `Rejected` are terminal; no further status transitions are permitted.
4. **Server-Calculated Totals:**
   - Grand totals are recalculated on the server based on current product prices, active coupon rules, and the selected delivery zone fee. Client-submitted prices are ignored.

---

## 3. Multi-Tenant Authorization & Security Checks

- **Store-Level Isolation:**
  - In `CommerceController.cs`, `OrderAction` validates that `order.StoreId == currentStore.Id`.
  - Attempts to access or mutate another merchant's order return `HTTP 404 Not Found` (fail-closed), eliminating IDOR vulnerabilities.
- **Customer Privacy:**
  - Public order tracking requires the full 64-character high-entropy `TrackingToken`.
  - Incremental order IDs (e.g. #1001, #1002) are internal references and cannot be used to scrape customer addresses or phone numbers.

---

## 4. Automated Test Verification Matrix

| Test Suite | Assertion / Scenario | Expected Result | Actual Result |
|---|---|---|---|
| `backend.Tests/CommerceTests.cs` | Checkout recalculates totals and rejects tampered prices | Total = 319.50 EGP, tampered request rejected | **PASS** |
| `backend.Tests/CommerceTests.cs` | Inventory deducted twice for 2 items | Stock = Initial - 2 | **PASS** |
| `backend.Tests/CommerceTests.cs` | Cross-tenant orders cannot be accessed or updated | HTTP 400/404 fail-closed | **PASS** |
| `frontend/tests/customer-commerce.test.cjs` | Terminal status semantics stop delivered and cancelled | Terminal states locked | **PASS** |
| `frontend/tests/checkout.e2e.cjs` | Idempotent duplicate click submission protection | Exactly 1 order created in DB | **PASS** |
| `frontend/tests/mobile-commerce.e2e.cjs` | Coupon stale-response protection upon cart change | Stale coupon rejected | **PASS** |

**Total Order Lifecycle QA Pass Rate:** 100% (All automated assertions verified).
