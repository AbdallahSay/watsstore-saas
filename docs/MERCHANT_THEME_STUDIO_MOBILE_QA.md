# Merchant Theme Studio — Responsive Preview & Release QA

Status: **PR only. CI and browser evidence are pending; not production verified.**

This batch was based on master commit `91df29540a708645ddf62bf83d68576eb948e4c5` so it preserves the latest storefront designs, mobile QA and theme-adaptive WhatsApp components.

## Implemented
- Merchant's live storefront preview modal uses fluid width instead of fixed 390px and wraps toolbar controls on small screens.
- Preview CSS container queries apply the mobile storefront layout inside a narrow canvas even when the parent browser is desktop-wide.
- Card/button long-content safeguards are scoped to `.ws-storefront`.
- Obsolete tests expecting only three themes and an obsolete status message have been corrected without changing production behavior.
- Playwright preview suite integrated into GitHub CI: 10 themes × Chromium/Firefox/WebKit × 320px/390px, screenshots at 390px, checks preview controls and product grid layout, and verifies that opening previews does not modify published/draft settings.
- Isolated backend tests execute Save Draft → Publish → inspect public theme → Restore for all ten theme IDs and restore the original draft. The script rejects non-localhost API and site addresses.

## Pending before merging
1. GitHub CI must finish successfully for final PR head.
2. Validate actual browser screenshots and fix any detected regressions.
3. Existing checkout/tenant/inventory E2E tests must pass alongside preview suite.
4. Confirm no test interactions target production.
5. Verify 320px–1920px mobile/tablet/desktop coverage on public storefront separately.
6. Physical iPhone/Android coverage remains unverified until performed.

## Known previous failures
PR #44 initial workflow 41443960191 failed on stale frontend theme assertions and outdated merchant status message expectation; backend tests passed. The new branch updates both tests, but new success cannot be claimed until CI completes.

No production write, merge or deployment performed in this branch.
