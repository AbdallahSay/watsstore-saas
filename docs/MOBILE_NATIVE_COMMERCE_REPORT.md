# Mobile native commerce follow-up — 2026-11-02

Implemented independently of notification infrastructure on
`codex/mobile-native-commerce`, based on production master `0cd289e`. The working
checkout is isolated at `E:/WatsStore/work/mobile-native-commerce` so concurrent work
in the original checkout cannot overwrite these edits. The preserved mobile WIP stash
was applied without deleting it. No production backend or notification code is changed.

## Changes

- Fix product-dialog state leaking between products when customers shop quickly.
  Each opened product gets fresh quantity, image, validation and selection state.
  Default variants are available on first render instead of waiting for an effect.
  Invalid variant JSON does not crash the dialog.
- Increase quantity/gallery controls to 44px, use 16px/48px mobile inputs, dynamic
  viewport height, safe-area padding and a properly shrinking internal scroll area.
  Long product/SKU text wraps within product, cart and dialog layouts.
- Show a review beside order submission: quantity, payment method, selected delivery
  zone, subtotal, discount, shipping and estimated total. Do not display a numeric
  grand total before a required shipping zone has been selected.
- Ignore stale coupon validation responses after the cart/code changes. Prevent
  submission while the current coupon validation is pending.
- Keep focus inside the dialog, skip disabled fields, prevent Escape/backdrop dismissal
  while submitting, and remove the product modal's duplicate body-scroll lock.
- Confirmation displays the server's actual status, including replayed orders that
  have progressed beyond Pending. Manual transfers remain awaiting merchant review.
  Final prices/items continue to come from the server. Existing safe retry keys and
  authoritative backend stock/variant/coupon validation are preserved.
- Patch build-only `postcss-selector-parser` 6.1.4 → 6.1.5 within its existing version
  range; fresh frontend dependency audit reports zero known vulnerabilities.

## Verification

- **17 frontend tests:** existing 14 plus three confirmation component tests covering
  actual server status, manual-payment verification and English/private tracking links.
- TypeScript and Next production build passed.
- **11 backend integration tests** passed against the unchanged commerce API. Existing
  backend dependency advisories are unchanged on master; their production-package
  remediation remains in the separate gated PR #34. No backend release is part of this PR.
- Existing Chrome checkout E2E passes lost response after database commit, reload/
  original-key replay, duplicate submissions, single stock deduction, merchant visibility
  and tracking on 375/390/1440px viewports.
- Existing customer E2E passes across all themes and 320/375/390/768/1024/1440/1920px:
  My Orders, merchant lifecycle, persisted unread, foreground mock notification dedup,
  hidden/terminal polling, tracking privacy and local history removal.
- New mobile commerce E2E passes all three themes and the same seven widths: a real
  isolated API order with two products, first product quantity 2 and variant L, second
  product quantity 1 and no inherited variants; 10% coupon; authoritative subtotal
  305, discount 30.50, shipping 45, final total **319.50**, one new merchant-visible
  order and the expected stock reduction of 2. It also checks long SKUs, stale coupon
  responses, touch target size, font size, short viewport, keyboard trap, busy Escape
  guard, Arabic RTL and English checkout LTR.
- All transactions use the disposable local fixture database. The new suite rejects
  non-localhost API/site URLs. No production orders or push subscriptions are created.
- The short-viewport check simulates reduced available height; it does not prove real
  iPhone keyboard behavior. Native Safari/iPhone and actual background push receipt
  remain unverified. Screenshots below use isolated technical fixture data.

## Screenshots

- [Mobile order review](screenshots/mobile-native-commerce/editorial-mobile-review.png)
- [Mobile success](screenshots/mobile-native-commerce/editorial-mobile-success.png)
- [English checkout](screenshots/mobile-native-commerce/streetwear-english-checkout.png)

CI now runs the mobile-commerce suite after the existing checkout/customer suites and
uploads its screenshots/summary as artifacts. Final CI results and exact commit are
recorded on the associated pull request.

## Release scope

This branch is ready for independent frontend review after green CI. It does not merge
PR #34, apply a database migration, provision VAPID, enable push, purchase hosting or
configure a desktop dispatcher. No new production deployment is claimed in this report.

PR #34's report records the fresh server-side COPY_ONLY/CHECKSUM backup, SQL 262
verification denial, SQL 229 history denial, missing isolated restore and the GET-only
MonsterASP scheduler limitation. Those operational gates remain independent blockers
for background push. The last verified frontend production commit remains `0cd289e`.
