# WatsStore Hybrid Commerce — implementation foundation

## Confirmed direction
Three independent storefront themes: Editorial Atelier, Bold Streetwear, Warm Lifestyle. One functional shared checkout and order lifecycle. RTL-first, responsive, and accessible.

## What this branch currently contains
- Typed theme catalogue and parser in `frontend/src/lib/store-themes.ts`
- Scoped storefront CSS tokens in `frontend/src/styles/store-themes.css`
- No changes to current merchant dashboard, production APIs, or checkout behavior.

## Integration tasks (next PRs)
1. Identify existing public storefront layout and import scoped theme stylesheet in that route only.
2. Persist `themeId` per tenant/store via additive schema migration; validate against known theme IDs; default legacy stores to editorial without breaking changes.
3. Add a merchant theme selector with live preview and explicit Save/Publish controls.
4. Create shared component primitives: StoreHeader, Hero, CategoryRail, ProductCard, ProductGallery, VariantSelector, CartDrawer.
5. Build responsive desktop/mobile storefront variants with real catalog data; never ship image mockups as website content.
6. Audit existing order endpoint. Separate successful database order creation from optional WhatsApp redirect. Preserve legacy WhatsApp-only mode.
7. Shared guest checkout: cart → contact/address → delivery/payment → review → order confirmation. Price totals and coupons recalculated on server, with idempotent requests and tenant isolation.
8. Order lifecycle and tracking should use unguessable public tracking tokens, with audit logging and strict authorization.
9. Validate Arabic typography, keyboard focus, screen readers, 320px mobile, 768px tablet, 1440px desktop, reduced motion, and checkout errors.
10. Update marketing copy and Meta Purchase tracking only after native checkout actually works and order status is verified.

## Security gate
A tracked phase-4 test in the repository appears to contain a hardcoded privileged secret. Assume compromised until verified; rotate any live matching credential, inspect history, and replace hardcoded secrets with CI secrets/environment variables. Never surface secret values in logs or PR text.

## Release rule
Do not merge or deploy until tests, screenshots, and manual acceptance for each screen are reviewed.
