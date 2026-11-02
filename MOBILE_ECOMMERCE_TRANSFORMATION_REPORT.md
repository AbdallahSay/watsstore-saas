# Mobile ecommerce transformation

Release status: **in progress; not deployed**. CI, final performance measurements and production verification are pending. No production order, inventory, payment, migration or notification configuration was changed during these tests.

## Scope and changes

Base: deployed `master` commit `c9a81a8da948cb11781632d95f1b45a130e8efad`. Branch: `codex/mobile-ecommerce-transformation`. Existing PR #27's sidebar work was merged with its history preserved (`d9a6c02`). PR #34 was not merged or rewritten; background Web Push remains gated.

Reviewable implementation commits:

- `3e231c6`: patch .NET 8 EF/JWT dependencies and the test SQLite bundle; fresh NuGet vulnerability scans report no affected packages.
- `65ccd74`: responsive SaaS navigation, merchant cards and filters, admin tabs/header, accessible drawers and editor dialogs, localized order detail/inventory, safe-area and small-viewport constraints.
- `4601508`: dedicated `/s/{store}/p/{product}` URLs, gallery, variants, quantity, Add to Bag and Buy Now; four numbered checkout sections; retained safe retries and device order history; deferred cart/quick-view code and unnecessary prefetches.
- `fce8d46`: optional locale dictionaries and alert code load on demand; default EGP views avoid the unnecessary exchange-rate request.

The existing editorial, streetwear and lifestyle tokens and real merchant content are preserved. Related products come from the actual same-category catalogue. There are no invented reviews, products or stock claims. Design references reuse the recent inspected project ledger in `docs/design/RESEARCH_LEDGER.md`; its documented reference-count limitation still applies.

## Reproduction and responsive evidence

Before changing application code, Chrome captured 24 routes/states in Arabic and English at all eleven requested widths: **528 width checks**. Landing/pricing overflowed at 320–430 and 1024px; merchant headers overflowed at 320px; Arabic admin overflowed from phone widths through 1024px. The navigation drawer was inside the header's backdrop-filter containing block, and editor dialogs lacked consistent focus and short-height behavior.

The expanded after audit covers **36 routes/states × Arabic/English × Chrome/Firefox/WebKit × 11 widths = 2376 checks**. Result: **zero document overflows, small mobile form fonts, uncaught page errors or unexpected API errors**. The intentionally unavailable background-notification endpoint is excluded explicitly; this is not evidence that push works.

Widths: 320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440 and 1920px. Long Arabic names, unbroken 70-character SKU text, customer names and addresses are real isolated fixture records. Tables become labeled cards on phones while retaining table/row/cell semantics. Desktop tables remain usable.

The landing/merchant drawers and product/category/coupon editors also passed open, Tab containment, Escape, trigger-focus restoration and viewport-bound checks at applicable widths and at 900px/420px heights. Checkout/cart/confirmation additionally have explicit bounds checks across all eleven widths at 844px and 390px heights. These short viewports exercise available space; they do not simulate a physical iPhone keyboard or prove native iPhone testing.

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

## Validation and limitations

- TypeScript and production frontend build: passed locally.
- Frontend regression tests: 17/17 passed.
- Backend tests: 11/11 passed; updated Release fixture host builds with zero warnings/errors.
- npm audit, including development dependencies: zero known vulnerabilities after pinning Lighthouse 13.5.0.
- NuGet direct/transitive audit: zero known vulnerabilities after dependency patches; before/after evidence retained.
- Final Lighthouse measurements: pending. Earlier simulated mobile measurements missed the 2.5s LCP target; do not count that target as passed. Accessibility reached 100 on the landing, storefront and product page in the measured iteration; final results must identify the actual build and throttling method. No field INP data is available and TBT must not be described as INP.
- Browser evidence is Windows Chrome, Firefox and Playwright WebKit. **No physical iPhone/Safari verification is claimed.**
- SQLite order-number generation in fixtures differs from SQL Server (the fixture number is zero). Unique order IDs, tracking capabilities, stored snapshots and stock changes are verified. The opt-in UI fixture aggregate translator enables merchant/admin summaries; it does not replace SQL Server restore/migration or financial validation.
- A successful isolated SQL Server restore has not been verified. No production migrations or transaction tests are authorized under that unresolved backup gate. PR #34, VAPID setup and dispatcher release remain outside this mobile release and disabled.

## CI, deployment and rollback

PR: pending. Final CI run: pending. Deployed frontend SHA/deployment ID: **none yet**. Backend hosting has not been updated; source dependency fixes do not prove the live backend runtime has been patched.

CI now runs dependency audits, existing regressions, Playwright's cross-engine journey, the full responsive matrix, dialogs and mobile merchant operations. Review the actual run before merge. No test fixture token, production configuration or connection string is committed or uploaded.

Frontend rollback: restore/promote the last verified Vercel deployment for `c9a81a8` (`dpl_7HfoGtE9fgsKVwA2WhqtNzfjm1ZY`), then revert the frontend feature commits on the release branch and run CI. This feature introduces no schema migration or production data cleanup requirement. Keep the production backend and PR #34 configuration unchanged until their separate restore/rollback gates are satisfied.

## Page matrix

The generated matrix below summarizes the actual audit; detailed per-width evidence accompanies it.

| Route/state | Languages | Engines | Width checks | Result |
|---|---|---|---:|---|
| landing | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| directory | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| directory-filtered | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| pricing | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| login | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| register | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| admin-login | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-overview | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-products | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-categories | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-inventory | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-orders | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-settings | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-billing | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-analytics | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-reviews | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-coupons | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-themes | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-notifications | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| merchant-order | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| admin | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| admin-pricing | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| admin-subscriptions | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| admin-gateways | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| admin-settings | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| store-editorial | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| product-editorial | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| theme-preview-editorial | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| store-streetwear | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| product-streetwear | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| theme-preview-streetwear | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| store-lifestyle | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| product-lifestyle | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| theme-preview-lifestyle | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| my-orders | ar / en | Chrome / Firefox / WebKit | 66 | PASS |
| tracking | ar / en | Chrome / Firefox / WebKit | 66 | PASS |

Selected before/after screenshots:

| Area | Before | After |
|---|---|---|
| landing | [390px](docs/evidence/mobile-transformation/before-landing-390.png) | [390px](docs/evidence/mobile-transformation/after-landing-390.png) |
| admin | [390px](docs/evidence/mobile-transformation/before-admin-390.png) | [390px](docs/evidence/mobile-transformation/after-admin-390.png) |
| merchant-orders | [390px](docs/evidence/mobile-transformation/before-merchant-orders-390.png) | [390px](docs/evidence/mobile-transformation/after-merchant-orders-390.png) |
