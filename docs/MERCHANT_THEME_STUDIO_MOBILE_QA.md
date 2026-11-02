# WatsStore — Merchant Theme Studio mobile QA release gate

**Status:** test suite and responsive fixes committed on latest master; branch CI must pass before merge or production.

Scope:
- 10 storefront theme IDs; no alteration to theme colors, WhatsApp styling or shared checkout.
- Merchant theme preview from 320px and 390px parent viewports in Chromium, Firefox and WebKit.
- In both modes verify preview modal, actual theme choice, mobile product layout, card/button bounds, toolbar buttons, and zero unexpected document-level horizontal overflow.
- Ensure previews never publish a theme or alter merchant settings on their own.
- On isolated test tenant run Save Draft → Publish → Public Storefront Theme → Restore for each of 10 theme IDs; restore initial draft afterwards.
- CSS container queries enable true mobile storefront layout inside 390px frame even in wide browser windows.
- Scoped long-content card and CTA protections.
- Preserve latest master merchant-preview toolbar, storefront customization and WhatsApp implementations.

Proof: `npm run test:theme-preview-mobile` in the isolated checkout CI job; evidence artifacts under `work/transformation/theme-preview` (screenshots and JSON results).

Historical evidence: https://github.com/AbdallahSay/watsstore-saas/actions/runs/41447997392 passed Backend, Frontend and Checkout/browser E2E on the previous base. Because mainline changed afterwards, this branch must run its **own** successful checks.

Do not claim all physical devices tested; real iOS/Android hardware validation remains a separate final task.
No production data writes or deployment in this branch.
