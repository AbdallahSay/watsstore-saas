# Theme Marketplace — PR #41 release gate

## Implemented in this draft
- Industry categories and search over the three backend-supported themes.
- Pure Beauty storefront visual tokens and a merchant-data preview.
- Preview-only rendering guarded behind `preview && previewTheme === 'pure-beauty'`.
- Source-level regression tests for preview safety and scoped CSS.

## Not completed
Pure Beauty is NOT a production-ready fourth theme. No server-side theme allowlist, persistence, saved draft, publish/restore behavior, QA evidence or real-device tests have been completed for it.

## Steps before enabling publishing
1. Audit and explicitly validate the allowable theme ID list on every backend save/publish/restore path.
2. Align public API serialization and storefront rendering with the new theme ID. Unknown IDs must fail safely rather than silently publishing a fallback.
3. Produce dedicated end-to-end product, variant, cart, checkout, inventory, My Orders and tracking tests under Pure Beauty.
4. Verify RTL/LTR and 320–1920px layout, Light/Dark merchant dashboard separation, accessibility and performance.
5. Validate restore/rollback and frontend/backend production version compatibility.
6. Only then expose Save Draft and Publish buttons for Pure Beauty.

## Safety note
The added `pure-beauty.css` is scoped to `.ws-storefront.ws-theme--pure-beauty` and must not be used to set the merchant dashboard's Light/Dark appearance.

This PR remains Draft. The existing published Editorial, Streetwear and Lifestyle choices are preserved.
