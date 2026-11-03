# Phase 05 evidence

All write-based test evidence uses disposable localhost tenants and an isolated SQLite fixture host. It does not verify SQL Server production restore safety. `production-readonly.json` and `production-preflight.json` are HTTP-read-only production observations on 2026-11-02; neither submits an order. The public-store GET handler increments `ViewCount` in existing source, so HTTP-read-only does not mean zero database side effects. No direct order/stock/product/configuration edits are performed.

The complete serial local functional run used application/test commit `72dfa4fb5e3bd67a62d555041ba0b8a5d1d7d7ab`. Commit `2426469137ba8fb50e6d97448e26dee390dbef15` subsequently tightens registration response validation; its 34 frontend units, production build and all five registration-to-order pilots were rerun successfully. `registration-pilots-final.json` records that repeat. CI at the final PR head reruns the complete mandatory suite.

- `checkout.json`, `customer-commerce.json`, `mobile-commerce.json`: retained existing regressions.
- `native-journey.json`: 30 actual published-theme order journeys and one lost-response replay.
- `theme-preview.json`: 60 real iframe preview cases plus 10 publish/restore lifecycles.
- `storefront-matrix.json`: 20 theme/language shopping contexts, 18 widths each, and measured normal/hover WhatsApp contrast; contact URLs omitted from this copy.
- `responsive-summary.json`: compact aggregation of 216 route contexts and 3,888 width measurements. Full per-route browser artifacts are retained by CI.
- `onboarding-pilots.json`: 12 setup contexts plus five automated sector pilots. These are not a human usability study.
- `accessibility.json`: 60 axe audits, zero violations; **44 color-contrast incomplete cases still require manual review**.
- `stress.json`: 18 computed text-size/delayed-API/narrow-height cases. This is not native OS text sizing.
- `performance.json`: allowlisted repeated Lighthouse lab metrics; no raw authenticated network archive or field INP.
- `npm-audit.json`, `nuget-audit.json`: known-vulnerability audit output, not penetration-test certification.

Before screenshots came from detached baseline `8017238f3fdb7f38cbdbd144d2fcd732ccf70655`; after screenshots show isolated fixture data. The original five test illustrations live in `frontend/tests/assets/`. No production customer details, fixture tokens, administrator files, connection strings or backup contents are included here.
