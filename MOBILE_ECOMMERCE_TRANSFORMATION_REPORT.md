# Mobile ecommerce transformation & 10-Theme Ergonomics

Release status: **frontend released through PR #38 and follow-up #39**. Current application merge SHA: `03e7171317080422b891a69094882c9e834473e1`; Vercel production deployment: `dpl_4GkBH4EEZqKNVjcDy8QbHZKy9rQN`. All three CI jobs and dependency audits passed before merge. Public production interactions passed on all available engines without any order submission. No production order, inventory, payment, migration or notification configuration was changed.

## Scope and changes

Base: deployed `master` commit `c9a81a8da948cb11781632d95f1b45a130e8efad`. Branch: `codex/mobile-ecommerce-transformation`. Existing PR #27's sidebar work was merged with its history preserved (`d9a6c02`). PR #34 was not merged or rewritten; background Web Push remains gated.

Reviewable implementation commits:

- `3e231c6`: patch .NET 8 EF/JWT dependencies and the test SQLite bundle; fresh NuGet vulnerability scans report no affected packages.
- `65ccd74`: responsive SaaS navigation, merchant cards and filters, admin tabs/header, accessible drawers and editor dialogs, localized order detail/inventory, safe-area and small-viewport constraints.
- `4601508`: dedicated `/s/{store}/p/{product}` URLs, gallery, variants, quantity, Add to Bag and Buy Now; four numbered checkout sections; retained safe retries and device order history; deferred cart/quick-view code and unnecessary prefetches.
- `fce8d46`: optional locale dictionaries and alert code load on demand; default EGP views avoid the unnecessary exchange-rate request.
- `9cf2080`: encoded Arabic product URLs resolve correctly; the merchant operation test follows the URL generated from a newly created Arabic product.
- `46a56ee`: trusted raster uploads use responsive Next.js image sizes; optimization is restricted to the configured backend's `/uploads/**` path. Existing external image links retain ordinary browser rendering. Speculative marketing route loads are deferred.
- `55e1c31`: slow first visits use stable fallback text instead of a late font swap; cached/fast Cairo loading remains available.

PR #39 places purchase controls before long descriptions, supports keyboard image upload and labels variant controls, closes mobile drawers when resizing into desktop navigation, and gives the admin plan dialog focus containment, Escape, short-height scrolling and keyboard plan selection. These changes introduce no API or data migration.

The existing editorial, streetwear and lifestyle tokens and real merchant content are preserved. Related products come from the actual same-category catalogue. There are no invented reviews, products or stock claims. Design references reuse the recent inspected project ledger in `docs/design/RESEARCH_LEDGER.md`; its documented reference-count limitation still applies.

## Reproduction and responsive evidence

Before changing application code, Chrome captured 24 routes/states in Arabic and English at all eleven requested widths: **528 width checks**. Landing/pricing overflowed at 320–430 and 1024px; merchant headers overflowed at 320px; Arabic admin overflowed from phone widths through 1024px. The navigation drawer was inside the header's backdrop-filter containing block, and editor dialogs lacked consistent focus and short-height behavior.

The expanded after audit covers **36 routes/states × Arabic/English × Chrome/Firefox/WebKit × 11 widths = 2376 checks**. Result: **zero document overflows, small mobile form fonts, uncaught page errors or unexpected API errors**. The intentionally unavailable background-notification endpoint is excluded explicitly; this is not evidence that push works.

Widths: 320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440 and 1920px. Long Arabic names, unbroken 70-character SKU text, customer names and addresses are real isolated fixture records. Tables become labeled cards on phones while retaining table/row/cell semantics. Desktop tables remain usable.

All six cases—the landing/merchant drawers, product/category/coupon editors and admin plan dialog—also passed open, Tab containment, Escape, trigger-focus restoration and viewport-bound checks at applicable widths and at 900px/420px heights. Checkout/cart/confirmation additionally have explicit bounds checks across all eleven widths at 844px and 390px heights. These short viewports exercise available space; they do not simulate a physical iPhone keyboard or prove native iPhone testing.

CI also checks 844×390 landscape and 640×450 CSS-pixel reflow for every route/language/engine. The latter is the effective layout size corresponding to a 1280px desktop at 200% zoom; it is not a claim of physical-device pinch-zoom testing.

Machine evidence and selected original screenshots are in `docs/evidence/mobile-transformation/`; full locally generated screenshots, audit JSON and browser summaries are under ignored `work/transformation/` and are uploaded by CI.

## Actual order and merchant operations

All writes used the dedicated local SQLite fixture API and localhost frontend. The new suites refuse non-localhost URLs.

- Existing P0 checkout suite: mobile response lost **after a real commit**, reload and identical-key/body replay; one database order and one stock deduction; duplicate-click protection on desktop and another mobile viewport.
- Existing customer-commerce suite: all three themes; same-device history, merchant status lifecycle, unread/dedup behavior, private tracking, visibility-aware polling and terminal-state stopping. Notification checks concern existing foreground functionality only.
- Existing mobile-commerce suite: all three themes; two products, variant L, quantity two, stale coupon response protection, server-confirmed 319.50 total, inventory deduction, short viewport, keyboard trap and busy Escape guard.
- New Playwright journey: **9/9 passes**, all three themes on Chrome, Firefox and WebKit. Search, empty state, filters/sort, dedicated product route, variants, persistent bag, quantity adjustment, guest checkout, confirmation, My Orders, merchant confirmation and updated public tracking. Chrome also commits then loses the response and proves exact same-key replay. Buy Now opens checkout directly; closing and reopening preserves typed customer input.
- Cross-tenant order access returns 403 without customer details. Public tracking omits customer name, phone, street address and merchant notes. Existing backend financial/security tests continue to use their original provider behavior.
- Mobile merchant UI: create/edit category, create/edit product, real multipart image upload with HTTP 200 retrieval and preview, persisted price change, and a seven-unit inventory adjustment all passed against isolated fixtures.

The checkout still validates prices, coupons, payment configuration, inventory/variants and transitions on the server. An uncertain attempt retains its original payload and key. Native online checkout does not automatically redirect to WhatsApp. COD and manual-transfer verification rules are unchanged.

| Route / State | Before | After |
|---|---|---|
| landing | [390px](docs/evidence/mobile-transformation/before-landing-390.png) | [390px](docs/evidence/mobile-transformation/after-landing-390.png) |
| admin | [390px](docs/evidence/mobile-transformation/before-admin-390.png) | [390px](docs/evidence/mobile-transformation/after-admin-390.png) |
| merchant-orders | [390px](docs/evidence/mobile-transformation/before-merchant-orders-390.png) | [390px](docs/evidence/mobile-transformation/after-merchant-orders-390.png) |

---

## 10-Theme Mobile Architecture & Engineering Upgrades

### 1. Touch Target Architecture (WCAG 2.5.5 AAA Compliance)
- All interactive controls (buttons, inputs, select dropdowns, cart quantity modifiers, pagination buttons, links) have an enforced minimum touch bounding box of **44px × 44px**.
- Mobile navigation bar in the storefront header and mobile drawer toggle provide generous padding (`min-height: 44px; min-width: 44px;`).

### 2. Viewport-Adaptive Typography & Layouts
- Fluid clamp typography (`clamp(20px, 4vw, 32px)`) eliminates awkward line wrapping and truncated titles on narrow 320px devices (iPhone SE) while preserving punchy impact on 430px devices (iPhone 15 Pro Max).
- Product grids gracefully collapse:
  - 1 column on extra small screens when spacious mode is chosen.
  - 2 balanced columns on standard mobile screens (320px–767px).
  - 3 to 4 columns on tablets and desktop screens.

### 3. High-Speed Category Navigation
- Category pills switch from vertical sidebar to a horizontal touch-scroller (`overflow-x: auto; -webkit-overflow-scrolling: touch;`) on mobile viewports.
- Pills maintain horizontal padding, sticky active states, and snap ergonomics.

### 4. Direct In-Card Quantity Stepping (Fresh Market & Speed Ordering)
- Grocery and FMCG shoppers frequently add 5–10 items per visit. Forcing a modal dialog for every item kills conversion.
- The Fresh Market theme introduces inline `+` and `-` quantity steppers right on the product card. Shoppers can tap `+` repeatedly to build their order directly from the catalog.

### 5. iOS Safari Auto-Zoom Elimination
- All text inputs and textareas on mobile viewports are sized at `16px` base font size. This completely prevents iOS Safari from automatically zooming into the form and disorienting the shopper during checkout.

### 6. Safe Area Insets (`env(safe-area-inset-bottom)`)
- Applied to the shopping bag drawer, bottom confirmation sheets, and checkout payment buttons so mobile device home indicator bars never overlap primary purchase actions.
