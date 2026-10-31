# WatsStore SaaS 2.0 — initial audit (2026-10-28)

Baseline: master `22b2524`; implementation continues on PR #19, branch
`feat/hybrid-commerce-design-foundation` (`fcdd29a`). Working tree was clean.

## Verified architecture

- Next.js 14 / React 18 / TypeScript / Tailwind 3; public route `/s/[storeSlug]`.
- .NET 8, EF Core 8; SQL Server and PostgreSQL providers, selected from configuration.
- Merchant JWT store claims and explicit StoreId filters; subscription expiry enforced on orders.
- Existing catalog, product gallery, variant groups, persistent tenant cart, coupons,
  reviews, merchant products/categories/settings, subscription billing, CSV orders, analytics.
- PR #19 contains typed themes and scoped CSS, with no route integration or persistence.
- Orders already recalculate base prices and coupons server-side and save item JSON snapshots.
- Checkout always redirects to WhatsApp. No inventory, idempotency, state machine,
  public tracking, merchant order actions, shipping zones, or payment verification.
- Analytics count every created order as revenue; Purchase fires on creation.
- No GitHub Actions or isolated backend/component test project at baseline. Root JS
  scripts target live environments and include privileged credentials; do not run them wholesale.
- Runtime exists locally; SDK missing at baseline. Frontend dependencies are installed.
- Production settings and ignored deployment scripts exist locally. Their values are never
  included in this report. Provider/connection verification is separate from merely finding config.

## Release-blocking findings

1. Public admin recovery returns a reset credential to an unauthenticated caller.
2. Hardcoded admin key/password and JWT signing defaults exist in code/config/history.
   Removing current literals does not invalidate deployed credentials or historical tokens.
3. Admin authorization accepts a matching merchant email as privilege escalation.
4. Raw forwarded IP headers can bypass IP rate limits. CORS uses unsafe suffix/prefix matching.
5. No transaction protects coupon usage, repeated checkout, or concurrent stock changes.
6. Variants and payment labels are accepted without checking merchant configuration.
7. Startup modifies production schema and seeds demo reviews/content; health claims DB
   connectivity without testing it. Exceptions hide server failures as client errors.

## Required validation before release

Build both applications; isolated relational integration tests for tenant isolation,
checkout/stock/coupon races, retries, payment verification, tracking redaction and lifecycle;
browser tests at requested widths, each theme and RTL/LTR; production-like migration rehearsal;
verified secret rotation, backup/restore, CI checks, measured Lighthouse, deployment/rollback
and production smoke tests. No production merge/deployment until these gates pass.
