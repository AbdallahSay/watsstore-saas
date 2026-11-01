# Customer commerce delivery — 2026-11-01

**PARTIALLY DEPLOYED — EXTERNAL CONFIGURATION REQUIRED**

The customer UI is deployed and verified. Background Web Push and its new backend
schema remain disabled and undeployed. No real-device push delivery is claimed.

## Release evidence

| Item | Result |
|---|---|
| Customer release | [PR #31](https://github.com/AbdallahSay/watsstore-saas/pull/31), merged; all original six commits preserved |
| Production frontend SHA | `0cd289e5f266bbdae884576ffaa8f9ff807296d5` |
| Tested PR head | `27d218fee2c9ddd8dcd0882a5d34948e2035e8fc` |
| Final frontend CI | [41286852326](https://github.com/AbdallahSay/watsstore-saas/actions/runs/41286852326): backend, frontend, checkout/customer E2E all successful |
| Vercel production | `dpl_Dtevdypz9KAhmMbKFtSfRirucyPZ`, READY, Git master, production alias assigned |
| Frontend | [Production storefront](https://frontend-bay-ten-58.vercel.app/s/a9) |
| Backend | [Existing MonsterASP application](https://watsstore.runasp.net), unchanged binaries/schema in this release |
| Gated backend | [Draft PR #34](https://github.com/AbdallahSay/watsstore-saas/pull/34) |
| Backend functional SHA | `b7ef8d3c471698e97fa2f9733954d9c15544bd75` (plus delivery documentation) |
| Combined backend/UI CI before dependency patch | [41287052486](https://github.com/AbdallahSay/watsstore-saas/actions/runs/41287052486): all successful |

The live backend does not publish a trustworthy build SHA. Its exact deployed binary
commit cannot be asserted from runtime evidence. No backend deployment was performed.

## Feature status

| Feature | Implementation and verification |
|---|---|
| Native guest checkout | Deployed. Existing multi-product cart, variants, quantities, coupons, shipping, contact/address, payment selection and review preserved. Server pricing, stock, tenant isolation and original-key retry behavior preserved. Native success does not redirect to WhatsApp. |
| Rich confirmation | Deployed: success, order number, server total, confirmed item/variant snapshots, delivery fees, payment state, Track / My Orders / Continue actions. Existing backend lacks new snapshot/payment-method fields; missing item data comes from its existing secure tracking API. Payment-method label and richer response fields await backend release; no cart-derived authoritative data is substituted. |
| Same-device My Orders | Deployed and live verified. Per-store history, maximum 30 references; loading/empty/error states, status, last update, unread persistence, open tracking, local-only removal, explicit device/privacy disclosure. No phone-only order lookup or cross-device account claim. |
| Tracking | Deployed: five-stage progress, Cancelled/Rejected states, immutable history, redacted item/payment/delivery summaries, last update, copy link, manual refresh and visible-page automatic refresh. Final orders stop polling. No invented shipping dates or driver location. |
| Foreground updates | Deployed: persistent unread state, explicit permission, per-event dedup across reloads, Web Locks across supported tabs, mobile service-worker display fallback. Browser permission/display APIs were simulated in automation; real OS notification receipt was not verified. In-page unread updates were verified live. |
| Background Web Push | Implemented in PR #34 and frontend worker/opt-in controls. **Disabled, not device-verified, backend not deployed.** Missing endpoint on existing backend is handled as unavailable. No automatic permission prompt or subscription. |
| Merchant notifications | UI deployed with honest unavailable state against existing backend. Scoped opt-in counts, channel setting, delivery audit and bounded eligible retries implemented/tested in gated backend. Operational management awaits backend migration/configuration. |
| Merchant orders | Deployed pagination plus status/date/payment filters and localized badges. Search/filtering applies to current page of up to 100 orders and says so explicitly. Existing detail, payment verification, state machine, audit and stock-restoring cancellation preserved. |
| Responsive/accessibility | All three themes; 320/375/390/768/1024/1440/1920px. RTL-first with English labels from language context, light/dark theme tokens, semantic lists/status announcements, focus styles, touch targets and existing reduced-motion rules. Screenshots visually inspected. |

## Tests and live verification

- Frontend: **14/14** Node regression tests; TypeScript and production build passed.
- Customer release backend: **11/11** integration tests in CI. Gated notification
  backend: **17/17** integration tests locally and in its initial CI; repeated after
  dependency patch with 17/17 passing. Tests use isolated SQLite, not production SQL.
- Chrome checkout E2E: mobile 390px response loss **after actual database commit**,
  reload and original-key replay; one order and one stock deduction. Mobile 375px and
  desktop 1440px duplicate-submit protection. Merchant visibility and public tracking.
- Customer E2E: all three themes and seven widths; merchant Confirmed → Preparing →
  Shipped → Delivered, persisted unread, explicit opt-in, alert dedup, hidden-page
  polling suspension, terminal polling stop, privacy and local-history removal.
  These browser tests render and exercise the real components/API/database; they do
  not constitute real-device background push verification.
- Notification security/dispatch tests: cross-tenant/token rejection, endpoint SSRF
  and P-256 validation, revocation, event uniqueness, payload privacy, dispatcher
  secret, tenant retry authorization, transient backoff and 410 deactivation.
- Worker tests: durable event claim/dedup and safe same-origin My Orders clicks;
  tracking URLs and third-party destinations rejected.
- **Production order #2054:** one dedicated technical test store/product; Chrome
  mobile 390×844 checkout returned 200 from the live orders URL with correct CORS.
  Item details loaded through the existing backend fallback. Stock **2 → 1**.
  My Orders showed merchant confirmation and unread state survived reload; tracking
  showed Confirmed; private customer contact/address were absent. Merchant dashboard
  visibility verified on Chrome desktop 1440px. No JavaScript page errors recorded.
- Cleanup: merchant cancellation verified publicly; inventory **1 → 2**; dedicated
  store disabled. Direct read-only SQL independently confirmed **one order**, **one
  matching idempotency key**, status **Cancelled**, stock **2**. No records deleted,
  no WhatsApp message, no real-customer order or notification campaign.
- Edge production smoke: My Orders empty state at 390/1440px, no failed API requests,
  no orders submitted. Native Safari/iPhone hardware is unavailable on this Windows
  host; no native Safari or installed-iPhone push test is claimed.

## Screenshots

Only technical fixture data is included. Raw fixtures, bearer tokens, revocation keys,
trace files and tracking capabilities stay in ignored local evidence files.

- [Live mobile confirmation](docs/screenshots/customer-commerce/live-mobile-confirmation.png)
- [Live My Orders with unread update](docs/screenshots/customer-commerce/live-mobile-my-orders.png)
- [Editorial mobile tracking](docs/screenshots/customer-commerce/editorial-tracking-390.png)
- [Streetwear mobile My Orders](docs/screenshots/customer-commerce/streetwear-my-orders-390.png)
- [Lifestyle desktop tracking](docs/screenshots/customer-commerce/lifestyle-tracking-1440.png)

CI publishes checkout/customer screenshots as workflow artifacts. Full-page Chrome
captures produced an RTL compositor offset; viewport captures were used and visually
verified, with independent layout bounds assertions across every tested width.

## Security and privacy findings

- Tracking uses 32 random bytes (256 bits), validates 64 lowercase hex characters,
  scopes to active storefront and returns no phone, street address or merchant notes.
  Private customer routes suppress Meta Pixel, set no-referrer and noindex. No
  unverified-phone lookup was added.
- Guest checkout still recalculates prices/shipping, validates variants, prevents
  overselling and coupon overuse transactionally, and retains the original request/key
  for uncertain outcomes. Existing tests cover concurrency and cross-tenant access.
- Manual wallet/InstaPay transfers require a reference and remain awaiting merchant
  verification. COD paid state is restricted to delivery. Invalid order transitions
  and repeat inventory restoration remain rejected.
- Old privileged key and admin password were checked against production and both
  rejected. Stale frontend credential defaults were removed from the deployed code;
  source scan found none. All 14 production admin JavaScript chunks checked contained
  neither historical credential. The Development-only backend password fallback is
  removed in PR #34. Historical revoked values remain in Git history; no force push
  or destructive history rewrite was performed.
- Frontend production `npm audit`: **zero known vulnerabilities**. Gated backend
  transitive dependency pins patch Caching.Memory, Azure.Identity, Identity.Client,
  Asn1 and System.Text.Json advisories; production backend project NuGet audit reports
  no vulnerable packages at that head. These backend pins are not yet deployed.
- The isolated test project's native SQLite package still has
  [GHSA-2m69-gcr7-jv3q](https://github.com/advisories/GHSA-2m69-gcr7-jv3q), for which the
  advisory lists no patched package version. It is not a production dependency and
  tests use predefined trusted SQL. This warning is disclosed, not suppressed.
- New subscriptions require the correct store/order capability; unsubscribe requires
  a separate random revocation secret stored only as a server hash. Merchant queries
  are tenant-scoped. Dispatcher requires HTTPS and a constant-time secret comparison.
- Push endpoints are allowlisted HTTPS provider hosts, redirects disabled, keys
  validated. Payloads contain only opaque event ID, status and safe My Orders path;
  never tracking tokens, customer names, addresses, phones or internal order IDs.

## Migration and push release gates

No production migration was applied. The additive, idempotent SQL Server migration is
`backend/SQL/migrations/20261101_order_notifications.sqlserver.sql`; static review and
SQLite model integration tests are complete, SQL Server restore rehearsal is not.

Read-only production inspection confirmed push tables absent and backup permission
present. Backup-history access was denied (SQL 229); neither a current restorable
backup nor isolated restore evidence is available. Backup permission is not backup
verification. No production DDL or backup operation was attempted on that assumption.

Before merging/deploying PR #34:

1. Verify a current SQL backup and successful isolated restore; rehearse the migration
   twice and compare existing counts/totals. Apply additive schema before new binaries.
2. Provision VAPID public/private keys and contact subject in secure server config;
   provision a separate random dispatcher secret. Never use public frontend env vars.
3. Provision a reliable external scheduler calling the HTTPS dispatch endpoint. This
   implementation has a durable SQL outbox and leases, **no IIS in-memory worker**.
4. Run controlled supported-device tests, including leaving/closing the website,
   receipt, duplicate suppression, unsubscribe and restart/retry behavior. Record
   provider acceptance separately from actual device receipt. Set enable/verified
   flags only with that evidence and separately opt in the merchant/test customer.
5. Confirm final CI/security checks and back up backend binaries/config before release.

All runtime defaults keep Web Push off. No VAPID private key or verified dispatcher
is configured in the available production configuration. On supported iPhone systems,
installation and explicit interaction requirements must be tested; see
[WebKit guidance](https://webkit.org/blog/13878/).

The outbox retries 429/5xx/network failures with bounded backoff and leases, expires
404/410 subscriptions, and reports **AcceptedByProvider**, never invented device
delivery. Transport acceptance and SQL commit cannot be atomic; worker IndexedDB
dedup suppresses repeated displays while retained. Cleared device storage resets that
dedup state. Operations and configuration details are in
[ORDER_NOTIFICATIONS_OPERATIONS.md](docs/ORDER_NOTIFICATIONS_OPERATIONS.md).

## Rollback

- Frontend: promote previous production deployment
  `dpl_4scRLuzugt1GCoxfE5v2L6VGWJYH` (master `403f31d`) through existing Vercel hosting.
  Preserve browser history and database records. Current release changed no schema.
- Backend: unchanged in production. For future PR #34 deployment, first disable
  dispatch/global push, restore the saved prior binaries/config and retain additive
  tables and audit rows. Do not drop notification or commerce data during rollback.

This release verifies checkout → real API/database → merchant → customer history/
tracking. It does not infer success from `/health`, provider acceptance, mock delivery,
or a green build alone. Remaining backend/device gates are explicit above.
