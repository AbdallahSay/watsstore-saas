# Order notifications: provisioning and release

## Defaults and compatibility

My Orders is private same-browser history, with at most 30 secure tracking references
per storefront. No lookup by phone and no cross-device identity claim. History contains
only token, order number, timestamps, status and read/notification markers. Pending
checkout retry data remains session-only and is removed after confirmed creation.
Private tracking/history routes suppress analytics and use no-referrer/noindex.

The frontend tolerates the currently deployed backend: missing enhanced confirmation
items are loaded through the existing public tracking response. New optional tracking
fields are additive. A missing notifications configuration endpoint leaves background
push disabled, without affecting tracking or foreground alerts.

## Backend release gate

1. Record a current SQL Server backup and a successful restore verification on an
   isolated SQL Server environment. Do not infer backup readiness from SQL connectivity.
2. Rehearse `backend/SQL/migrations/20261101_order_notifications.sqlserver.sql` twice
   against the restored database; compare all existing table counts/totals.
3. Apply that additive migration before deploying the new backend. Existing binary
   remains compatible with the additive tables. No automatic startup DDL is added.
4. Back up existing backend binaries/config using authorized hosting access. Never
   publish database connection strings, VAPID keys or dispatcher keys as CI artifacts.
5. Deploy only after CI/security checks pass. Roll back binaries while retaining the
   additive tables, order data and notification audit records.

## Secure configuration

All values are server environment/secret configuration, never NEXT_PUBLIC variables:

- `WebPush__Enabled=false` until provisioning and test completion.
- `WebPush__DeviceDeliveryVerified=false` until a real supported-device test passes.
- `WebPush__PublicKey`: VAPID P-256 public key, exposed through config only when enabled.
- `WebPush__PrivateKey`: corresponding VAPID private key, secret manager only.
- `WebPush__Subject`: verified operator contact as `mailto:` URI.
- `WebPush__DispatcherKey`: separate random bearer secret of at least 32 characters.

The global gate requires both enable flags, keys, subject and dispatcher key. It does
not prove delivery by itself: retain actual-device test evidence before turning it on.
Merchants must separately enable their store channel; customers explicitly opt in per
order. Permission is requested only from a button click. Subscribe requires the exact
store's 256-bit tracking capability. Unsubscribe requires an independently generated
revocation capability whose SHA-256 hash is stored server-side.

Known provider HTTPS endpoints are allowlisted and redirects disabled to prevent
subscription-driven SSRF. Invalid P-256/auth keys, private/loopback hosts and cross-store
tokens are rejected. Endpoints and encryption/revocation keys are never returned in
merchant delivery reports or written into application logs. No email/SMS/WhatsApp
provider or message campaign is configured by this change.

## Durable dispatch on MonsterASP

There is deliberately no IIS in-memory background loop. Status history and unique
per-subscription deliveries are written in the same order transaction. An external
always-on scheduler must call `POST https://watsstore.runasp.net/api/internal/notifications/dispatch`
over HTTPS with `Authorization: Bearer <dispatcher secret>` from its protected secret
store. Never place that credential in a URL, browser, repository or published log.

A compatible option is an existing Windows Task Scheduler/Linux systemd timer/managed
scheduled job running every minute with a 120-second timeout. Provision and verify the
chosen runner before enabling dispatch. Each call claims at most five due deliveries;
additional calls drain a backlog without parallel claims. SQL leases survive IIS idle
shutdown/restarts. Expired leases recover; five failed attempts stop automatic delivery.
429/5xx retry with exponential backoff; 404/410 deactivate expired subscriptions. Valid
subscriptions expire after 90 days. Merchants can queue at most two eligible manual
retry cycles, never retry an accepted delivery or another tenant's records.

Provider acceptance is recorded as **AcceptedByProvider**, not confirmed device
delivery. Network acceptance and SQL commit cannot be one atomic transaction; a crash
may replay a provider request. The immutable delivery event ID and service worker's
durable IndexedDB claim suppress duplicate displays. This is not a promise of globally
exactly-once transport. Device storage clearing can reset client deduplication.

Push payloads contain only version, opaque event ID, status and a same-origin My Orders
path. No tracking tokens, phone, full address, customer name or internal order ID is
sent. Notification clicks open the device's My Orders page. The worker handles no
fetch events and caches no pages or private API responses.

## Verification before claiming enabled delivery

- Run unit/integration tests with a fake provider; these cannot prove real push delivery.
- Explicitly opt in a dedicated test order on a supported device, leave the website,
  change its state, verify exactly one notification and safe click navigation.
- Verify unsubscribe, denied permission, expired endpoint, retry and IIS restart recovery.
- On iPhone/iPad, Home Screen installation and supported OS/browser are required;
  see [WebKit's platform guidance](https://webkit.org/blog/13878/).
- Record provider response and device receipt separately. Keep related functionality
  disabled if credentials, reliable runner, backup verification or device evidence are missing.
