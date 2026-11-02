# Customer commerce audit — 2026-11-01

- Clean starting checkout branch `640b3f7`; preserved all local branches/commits.
- Fetched master `403f31d` and PR #31 head `bfe7fd6`. PR #31 is open/draft,
  six commits, four files; all changes reviewed before implementation.
- PR #31 CI [41246078864](https://github.com/AbdallahSay/watsstore-saas/actions/runs/41246078864)
  completed successfully; Vercel preview status success. Master already includes
  PR #30's live tracking page. Current work branches from the full PR #31 head.
- Verified Next 16.4.3 / React 18 / TypeScript / Tailwind 3, ASP.NET/EF Core 8,
  SQL Server production configuration; existing Vercel Git deployment and MonsterASP
  FTPS mechanism. Existing CI covers backend, frontend and Chrome checkout E2E.
- Checkout already has server pricing, variant checks, serializable inventory/coupon
  handling, idempotent retries and manual payment verification. Native checkout does
  not redirect to WhatsApp. Preserve these paths.
- Gaps: minimal confirmation snapshot; My Orders checked only ten saved references,
  lost unread/dedup state on reload, hid refresh errors, polled final orders; tracking
  had no request overlap guard or visibility-triggered resume; no durable push channel.
- Tracking currently returns redacted customer data but exposes internal snapshot
  stock/product IDs unnecessarily. New DTO projection removes these extra fields.
- Historical privileged key and password were both checked against production and
  rejected (401/403). No credential values logged. Two stale development/admin-form
  literals remained in current source; removed them as part of this audit.
- VAPID configuration is absent/disabled. Actual supported-device background delivery
  and a durable external runner are unverified. Do not enable or claim push delivery.
- A verified production SQL Server backup/restore rehearsal is required before the
  new additive notification migration and backend release. Connectivity is not proof.

UI direction reuses this project's inspected commerce reference ledger and theme tokens;
no third-party images, fake deliveries, shipping dates or review claims are introduced.
