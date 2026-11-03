# WatsStore — Merchant Mobile & Storefront Visual Defects

## Verified user-reported defects (screenshots, 2026-11-02)
- Merchant dashboard light appearance contains dark sidebar/mobile header and dark language controls.
- Desktop merchant sidebar stretches with document height.
- Merchant product table collapses into near one-letter vertical text on narrow phone screens.
- Buttons and card counters may clip or detach across responsive shapes.
- Catalog product image/title opens a modal instead of a dedicated product page.
- Street Pulse ticker can scroll into a blank tail.
- Fresh Market floating WhatsApp CTA is orange, inconsistent with green grocery theme.
- Shipping zones require manual governorate/area entry.

## Changes in this PR
- Desktop sidebar uses independent sticky viewport-height scroll and adopts light/dark palette; mobile header and theme controls honor theme appearance.
- Mobile merchant table CSS uses full-width row cards and prevents break-anywhere for regular words and numbers.
- Catalog image/title links to existing product detail route; unsaved merchant previews render the full product-detail layout inside the preview with a Back control.
- Continuous duplicated-group ticker with optional reduced-motion handling.
- Catalog product count inside heading and consistent in-card index badges for varied corner radii.
- Fresh Market WhatsApp tokens now match the grocery green palette. Base theme-specific WhatsApp contrast fix arrived in merged PR #48.
- Offline Egypt governorate/city suggestions: 27 governorates, 396 cities and districts with custom free-text input allowed for unlisted villages/neighborhoods; existing shipping fee/estimate/pickup flow unchanged.
- New regression tests.

## Shipping data provenance and limits
https://github.com/Tech-Labs/egypt-governorates-and-cities-db (MIT); governorate and city lists adapted for spelling and sorting. **Not exhaustive of every village or street**. Input remains editable; do not claim complete geographic enumeration. Future extension can use a maintained, attributed CC-BY dataset of 5,716 localities, subject to product/coverage review. Shipping costs are merchant-configured, not fabricated by WatsStore.

## Release safety
- PR only until frontend, backend, mobile browser, and tenant/inventory regression tests pass.
- Source-only tests are not sufficient for visual completion; inspect screenshots at 320/360/390/768/1440 widths and both light/dark.
- Maintain draft preview changes without touching published theme settings or production orders.
- No database schema change or production data write in this PR.
