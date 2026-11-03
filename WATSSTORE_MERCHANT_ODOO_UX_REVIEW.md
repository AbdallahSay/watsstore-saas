# WatsStore 2.0 — Merchant Experience Audit & Odoo-Inspired UX Review

**Reference Framework:** [Odoo 19.0 Ecommerce & Website Management](https://www.odoo.com/documentation/19.0/applications/websites/ecommerce.html)  
**Date:** 2026-11-03  
**Status:** Implemented & Verified  

---

## 1. Executive Summary

Inspired by Odoo's structured business management philosophy, WatsStore 2.0 replaces fragmented merchant administrative settings with a unified, intuitive, mobile-first merchant experience. Non-technical store owners in Egypt and the MENA region can seamlessly onboard, configure operations, manage inventory, process orders, and customize storefronts without requiring coding or design knowledge.

---

## 2. Guided Merchant Onboarding Wizard (`/dashboard/setup`)

### Onboarding Steps
```
[1. Store Identity] ---> [2. Branding] ---> [3. First Product] ---> [4. Payments & Delivery] ---> [5. Theme Choice] ---> [Store Live!]
```

1. **Step 1: Store Basics & Identity**
   - Store Name, Public Code/Subdomain slug, City, Governorate, Business Category, and WhatsApp order contact number.
   - Real-time slug availability check preventing duplicate store collisions.
2. **Step 2: Branding & Assets**
   - Store logo, cover banner, and primary brand color picker.
3. **Step 3: Initial Catalog Addition**
   - Product name, category assignment, price, discount, SKU, stock quantity, and product photography.
4. **Step 4: Payment & Delivery Methods**
   - Cash on Delivery (COD) toggle, InstaPay username/address, Vodafone Cash / Mobile Wallet number, and standard shipping zones.
5. **Step 5: Storefront Theme Selection**
   - Choice from the 20 category-matched storefront themes with live thumbnail previews.
6. **Step 6: Publishing & Sharing**
   - Instant activation, public storefront URL generation, QR code generation, and direct WhatsApp store share link.

### Progress Persistence & Resumption
- Integrated `frontend/src/lib/setup-progress.ts` tracks setup completion status across browser sessions.
- If a merchant navigates away or disconnects, the setup wizard restores their exact step without data loss.

---

## 3. Merchant Dashboard Modules & Capabilities

### Overview & Real-Time KPIs
- **Metrics Tracked:** Total Revenue (EGP), Order Count, Average Order Value (AOV), Total Catalog Views, Low-Stock Warnings.
- **Actionable Empty States:** When a merchant has 0 orders or 0 products, contextual quick-start action cards appear instead of blank tables.

### Product & Variant Management (`/dashboard/products`)
- Single and multi-variant products (Sizes: S, M, L, XL; Colors; Capacities).
- Image uploads with automatic preview and dimension validation.
- Quick in-table price editing, status toggles (Active / Inactive), and search/category filters.

### Inventory & Stock Alerts (`/dashboard/inventory`)
- Real-time stock counts.
- Low-stock badge threshold (<5 items remaining) alerting merchants before stockouts occur.
- Out-of-stock lock preventing customers from ordering depleted items.

### Order Management & Fulfillment (`/dashboard/orders`)
- Inspired by Amazon Seller Central and Odoo Sales order stages:
  `New (Unpaid/Pending)` -> `Confirmed` -> `Preparing` -> `Shipped` -> `Delivered` (or `Cancelled` / `Rejected`).
- Full order details drawer, customer contact details, delivery address, order notes, and tracking token reference.

### Egyptian Shipping Zones Management (`/dashboard/settings` & `/dashboard/themes`)
- Comprehensive coverage of all 27 Egyptian governorates with offline city and locality suggestions.
- Granular delivery fee by zone, in-store pickup options, and estimated delivery duration in business days.

### Professional Theme Studio (`/dashboard/themes`)
- Browse and filter all 20 storefront themes by category.
- Live preview canvas toggleable between Mobile (390px) and Desktop (1440px) using the merchant's real catalog data.
- Live customizer for primary/secondary colors, typography presets, button shapes, and card aspect ratios.
- Safe Draft / Publish / One-Click Restore architecture.

---

## 4. Dashboard Mobile UX & Appearance Isolation

### Responsive Touch & Ergonomics
- Replaced desktop-only tables with adaptive card rows on screens under 768px.
- Numbers and Arabic text wrap cleanly without vertical one-character column distortion.
- Minimum 44x44px touch targets on all buttons, selectors, tabs, and toggles.

### Appearance Boundary Isolation
- Merchant dashboard light/dark preference is managed independently via `ThemeLanguageBar` and local preference.
- Browsing or previewing a dark theme (such as `street-pulse`, `auto-circuit`, or `game-arena`) applies styles strictly to the storefront preview frame and **never** converts the merchant dashboard shell to dark mode unexpectedly.
