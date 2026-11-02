# Phase 05 customer journey QA

The existing commerce engine already supported search/filter/sort, dedicated product pages, variants, persistent bag, native guest checkout, delivery/payment selection, server-calculated totals, idempotency and public tracking. Phase 05 retains this engine and all ten distinct themes.

## Executed scenarios

`frontend/tests/native-journey.cjs` now exercises all ten **actually published** themes in Chromium, Firefox and WebKit. It checks empty search and reset, stock filter, price sorting, dedicated product navigation, variant L, quantity, bag reload, decrease quantity, checkout at 18 widths and two heights, order acceptance, stock decrement, My Orders, merchant confirmation and public tracking. It restores the prior theme/settings after each case. All mutations target the isolated localhost fixture API.

One journey commits an order but deliberately loses its response. The customer input remains, the merchant has exactly one additional order, and reload/recovery replays the **identical payload and idempotency key**. Confirmation waits for a successful response. Existing checkout, customer-commerce and mobile-commerce suites additionally test invalid variants, inventory, coupons, tenant ownership, review/notification permissions and recovery.

The five sector pilots independently repeat the order-to-merchant-to-tracking chain with newly registered isolated tenants and original test product illustrations. No production order was created for Phase 05.

## Changes

- Preview bags are ephemeral and start empty; previews do not read real pending checkout attempts, send orders/reviews, persist customer history or emit advertising events.
- Preview confirmation clearly states that no order was submitted; it does not invent an order number or show an actionable order/WhatsApp history.
- Nested modal focus/scroll locks restore correctly. Parent Escape does not close the product dialog and preview together.
- Theme text, action colors and hover states were corrected using measured contrast while preserving theme palettes and the upstream WhatsApp outline regression checks.
- Allowlisted checkout/request/image error signals exclude customer details, tokens and request bodies.

## Evidence and limits

See [release report](PHASE05_FINAL_RELEASE_REPORT.md) for final suite results. `docs/evidence/phase05/` contains sanitized isolated summaries and selected screenshots; no fixture credentials or raw authenticated network archives are committed.

Production storefront `/s/a9` historically uses merchant-selected WhatsApp checkout. Its mode must not be changed to fabricate a live native-order test. Phase 05 production verification permits HTTP GET/HEAD/OPTIONS only; public-store GET can increment the existing visit counter, so this is not a zero-database-side-effect claim. No production order, stock or configuration change is submitted. Local SQLite does not establish SQL Server production restore safety. Physical touch/keyboard behavior and real customer comprehension remain manual checks.
