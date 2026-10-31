# Commerce operations and release gates

## Migration and rollback

This project previously used EnsureCreated plus startup DDL, without an EF migration
baseline. Do not run `dotnet ef database update` against that unbaselined database.
Use the checked-in provider-specific additive scripts under `backend/SQL/migrations`.
SQL Server and PostgreSQL scripts are transactional and rerunnable. They preserve
all existing tables and customer data. Rehearse twice on a restored production backup,
compare row counts/totals, then verify both new and legacy endpoints. No production
migration is authorized by a failed rehearsal or missing backup.

The application no longer performs schema changes or demo seeding in production.
Development bootstrap is opt-in (`Database__BootstrapDevelopment=true`).

Roll back application binaries to the previously backed-up release; retain additive
schema and order data. Never roll back to compromised authentication credentials or
drop populated commerce tables. Backup/restore ownership, tested recovery time, and
the exact previous Vercel deployment and backend artifact must be recorded before release.

## Authentication and secrets

`Jwt__SecretKey` must be random and at least 32 bytes. Set issuer/audience consistently.
Configure `Cors__AllowedOrigins__0` etc. with the exact existing frontend origins.
Empty signing keys fail startup. Public recovery is unavailable until a verified
delivery mechanism exists. Admin privilege requires an admin role, not merchant email.
Config admin credentials are bootstrap-only when no persistent admin exists.

Run `scripts/rotate_production_secrets.py --apply` only using existing authorized
FTPS credentials in the ignored deployment configuration. It reads the actual remote
configuration, encrypts local backups with Windows DPAPI, rotates JWT/config admin
credentials, reloads IIS configuration, verifies old-key rejection and new-key acceptance,
and synchronizes ignored local production settings. A failed connection is not proof
of rotation. Database admin passwords and hosting credentials require separate verified
rotation through the host/control plane. Never restore compromised credentials.

## Checkout and stock

Legacy stores default to editorial, WhatsApp, existing delivery fee and available
manual account methods. Draft theme selection does not change the published storefront.
Merchants explicitly enable online checkout or both modes. No gateway credentials or
carrier integrations are fabricated. Cash, InstaPay and wallet are manual methods.

Prices, variants, store ownership, expiry, coupons, shipping and payment methods are
validated on the server. Native checkout requires an idempotency key; updated clients
also send one for WhatsApp. Same key/body replays the stored response; a changed body
conflicts. Legacy clients without keys remain compatible but cannot receive retry guarantees.

Creation deducts stock inside a serializable transaction, with conditional inventory
updates and coupon use increments. All commerce mutations acquire the same store row
write lock. Provider execution strategies retry transient serialization conflicts.
The transaction rolls back on any rejected item or subsequent validation failure.
No inventory row means untracked stock. A base row caps total product stock; variant
rows cap combinations. Once variant rows exist, missing combinations are unavailable.
Cancelled/Rejected orders restore exactly the deducted stock once. Coupon usage is
not restored on cancellation, to prevent repeated redemption abuse. Order snapshots
remain immutable; catalog edits never reprice a historical order.

Pending → Confirmed → Preparing → Shipped → Delivered.
Pending also permits Rejected/Cancelled; Confirmed/Preparing permit Cancelled.
Paid orders cannot be cancelled until an external refund/reconciliation procedure
is completed; automated refunds are not implemented. COD receipt requires Delivered.
Manual transfers remain AwaitingVerification until an authorized merchant records
verification. All status/payment actions are tenant scoped and audited.

## Tracking and measurement

Tracking uses 256-bit random bearer references scoped to a store. Treat links as
private. Tracking responses omit name, phone, address, notes and transfer references;
timeline notes remain private. Responses use no-store and pages use noindex/no-referrer.

Confirmed/Preparing/Shipped/Delivered count toward booked sales. Pending, rejected
and cancelled orders do not. Payment verification and delivery remain separate states.
Historical orders default Pending because fulfillment cannot be safely inferred.
Do not fire Meta Purchase on order creation. Purchase reporting is held until a
verified, persisted and deduplicated server conversion ledger is available. Catalog
ViewContent/AddToCart events continue normally. No synthetic conversion/view metrics.

## Production release gates

- Verified credential rotation, including database admin and hosting account credentials.
- Backend/frontend builds and isolated relational security/concurrency tests passing.
- Representative SQL Server/PostgreSQL migration rehearsal, backup/restore evidence.
- Browser shopping tests and responsive inspection at all requested widths/themes.
- CI required checks passing; measured Lighthouse reports and screenshots retained.
- Existing frontend environment origins explicitly configured before backend release.
- Merge/deploy only after all gates; record exact SHA, URLs, migration result and rollback artifacts.
- Smoke tests must cover auth, tenant separation, catalog, checkout, order lifecycle,
  inventory, tracking, manual payments and legacy WhatsApp.
