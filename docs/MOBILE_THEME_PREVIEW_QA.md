# WatsStore — Mobile Theme Preview and Storefront QA (PR #44)

## Scope and status
**Status:** implementation committed; final browser CI results NOT verified. Do not merge or deploy as tested.

- Branch: `feat/mobile-theme-studio-polish-20261102`
- Pull request: https://github.com/AbdallahSay/watsstore-saas/pull/44
- Initial CI run: https://github.com/AbdallahSay/watsstore-saas/actions/runs/41443960191 (failed before fixes)
- Backend on initial run: success.
- Frontend unit suite on initial run: failed because `pure-beauty-preview.test.cjs` expected a legacy three-theme registry and old component identifiers.
- Native E2E on initial run: failed matching `Order updated.` although current UI correctly returned `Order updated to Confirmed.`.

## Implemented corrections
1. Mobile-friendly merchant theme preview toolbar and modal: wrapping, fluid width and height, no forced 390px fixed width on 320px devices.
2. Named CSS container for the preview canvas: applies phone layout at a phone-sized canvas even when the merchant's browser is desktop-wide.
3. Scoped storefront card, button and product-text wrapping rules.
4. Updated outdated source regressions to use current 10-theme registry and live preview.
5. Updated native journey's confirmed-status assertion to match valid richer success feedback.
6. Added `frontend/tests/theme-preview-mobile.e2e.cjs` and CI job step `npm run test:theme-preview-mobile`.

## Browser test design
- Local isolated backend and fixture merchant; production API URLs rejected by test.
- Browsers: Chromium (Chrome), Firefox and WebKit.
- Outer merchant viewports: 320x844 (dark dashboard), 390x844 (light dashboard).
- All ten design IDs.
- Open marketplace card, show real merchant preview, select mobile mode, verify actual theme data attribute, verify canvas within outer viewport, measure actual product-grid columns, card/control bounds and modal toolbar, close modal.
- Verify merchant published/draft themes are unchanged by the preview.
- Capture individual mobile screenshots for every theme at 390px and failure screenshots when needed.
- Evidence when run: `work/transformation/theme-preview/` in CI artifact.

## Outstanding QA
- **CI for final branch HEAD has not appeared in the available GitHub Actions results.** Source checks have been inspected but browser testing has not been certified.
- Real-device iOS/Android checks not completed.
- All ten published-storefront checkout flows not completed in this PR.
- 320–1920px public storefront, visual regressions, accessibility contrast, long-text stress cases, and production read-only checks remain mandatory gates.
- No production database or merchant settings changed.

## Release rule
Only mark PASS after a completed successful workflow with evidence, repair any browser failures and rerun. Do not infer 100% device coverage from emulation.
