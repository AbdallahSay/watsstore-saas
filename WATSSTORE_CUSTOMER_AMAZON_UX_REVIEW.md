# WatsStore 2.0 — Customer Shopping Experience & Amazon-Inspired UX Review

**Reference Framework:** [Amazon Retail Usability Principles & Seller Management](https://sell.amazon.com/tools/seller-central)  
**Date:** 2026-11-03  
**Status:** Implemented & Verified  

---

## 1. Overview & Principles

Taking inspiration from Amazon's customer-obsessed shopping experience, WatsStore 2.0 ensures that customer interactions are friction-free, intuitive, accessible, and fast on mobile networks.

### Core Principles
1. **Dedicated Product Detail Pages over Popups:** Every product card leads to a dedicated canonical product page (`/s/[storeSlug]/p/[productSlug]`), providing complete product storytelling, gallery exploration, variant selection, and SEO discoverability.
2. **Transparent Pricing & Server-Side Truth:** Prices, discounts, shipping fees, and grand totals are calculated and verified exclusively on the server. Customers are never shown ambiguous totals before selecting their delivery zone.
3. **Idempotent Single-Click Checkout:** Network dropouts or multiple rapid button taps on mobile devices cannot produce duplicate orders or double-deduct inventory.
4. **Secure Tokenized Order Tracking:** Customers track order progress via private 64-character cryptographic tokens without exposing PII to public crawlers.

---

## 2. Product Discovery & Catalog Navigation

- **Real-Time Category Chips:** Filter products by category with instant client-side response and smooth horizontal touch scrolling.
- **Instant Search:** Instant search filter matching product names, descriptions, and SKUs in both Arabic and English.
- **Accurate Availability Badges:** In-stock vs Out-of-Stock indicators clearly visible on cards; out-of-stock items disable purchase actions automatically.
- **Clean Pricing Badges:** Strikethrough original prices with accurate discount badges (e.g. `وفر 25%`) computed from actual variant prices.
- **Direct Card Quick-Add:** Non-grocery themes feature an in-card plus (`+`) action button for single-variant products, allowing instant cart addition without forcing unnecessary page loads.

---

## 3. Dedicated Product Detail Page Architecture (`/s/[slug]/p/[slug]`)

```
+--------------------------------------------------------------+
| Breadcrumbs: Home > Category > Product Name                  |
+------------------------------+-------------------------------+
|                              |                               |
|   Responsive Media Gallery   |   Product Information         |
|   - High-Res Main Image      |   - Title & Category Eyebrow  |
|   - Interactive Thumbnails   |   - Real-Time Price & Discount|
|   - Touch Swipe Navigation   |   - Stock Availability Badge  |
|                              |                               |
|                              |   Variant Selection (S, M, L) |
|                              |   Quantity Controls (+ / -)   |
|                              |                               |
|                              |   [ Add to Cart ]             |
|                              |   [ Buy Now ]                 |
|                              |   [ WhatsApp Inquiry Button ] |
|                              |                               |
|                              |   Specifications Table        |
|                              |   Shipping & Return Policy    |
+------------------------------+-------------------------------+
| Related Products Recommendation Carousel                     |
+--------------------------------------------------------------+
```

### Key Technical Enhancements
- **Theme Choice Preservation:** Navigating to the product details page automatically inherits the active storefront theme from the parent store or the `?theme=...` query parameter.
- **Accessibility & Touch Standards:** All quantity controls, variant pills, and CTA buttons meet the minimum 44x44px touch bounding box.
- **Bilingual Headings:** Product title rendered with an explicit `#product-title` heading and semantic aria labels.

---

## 4. Shopping Cart & Checkout Funnel

### Step-by-Step Checkout Workflow
1. **Cart Drawer (`.ws-cart`):**
   - Itemized review of products, quantities, variant selections, and individual prices.
   - Dynamic quantity adjustment (`+` / `-`) and item removal.
   - Coupon discount code entry with server-side validation and protection against stale responses when cart contents change.
2. **Customer Details Form:**
   - Full Name, Phone Number, Delivery Address, Optional Order Notes.
   - Form inputs enforced with `16px` minimum font size to prevent mobile browser auto-zoom.
3. **Delivery Zone Selection:**
   - Dropdown selection of merchant-configured Egyptian shipping zones.
   - Grand total (`.ws-totals`) only displays the exact numerical sum after a valid shipping zone is selected, eliminating customer confusion.
4. **Payment Method Choice:**
   - Cash on Delivery (COD), InstaPay, or Mobile Wallet (Vodafone Cash / Orange Cash / Etisalat Cash).
5. **Review & Confirmation:**
   - Complete itemized breakdown: Subtotal + Delivery Fee - Discount Amount = Total Amount (EGP).
   - "تأكيد الطلب" (Confirm Order) executes an idempotent POST request with an escape-key guard and submitting state overlay.

---

## 5. Order Confirmation & Tracking (`/s/[slug]/orders/[token]`)

- **Instant Visual Feedback:** Displays order status badge ("تم استلام طلبك"), order tracking number, customer delivery summary, and itemized receipt.
- **Timeline Progression:** Tracks order status across stages: `New` -> `Confirmed` -> `Preparing` -> `Shipped` -> `Delivered`.
- **Direct WhatsApp Merchant Follow-Up:** Pre-filled WhatsApp message containing the order number and tracking link for fast communication.
- **Private Device History:** Stores past tracking tokens in localStorage, enabling returning customers to view their previous purchases securely via `/s/[slug]/my-orders`.
