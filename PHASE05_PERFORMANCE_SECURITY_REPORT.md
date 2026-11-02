# Phase 05 performance, security and recovery

## Measurement protocol

`frontend/tests/phase05-performance.mjs` uses Lighthouse 13.5 user flows against a production Next build and an isolated local API. Five navigation steps cover landing, merchant setup, store, dedicated product and tracking. Cart/checkout opening use performance timespans plus accessibility snapshots. Timespans/snapshots have **no navigation LCP or overall performance score**. TBT is not INP. No real-user field INP is available.

Final runs use three repetitions for both applied (`devtools`) and simulated throttling, fresh Chrome per repetition, cache disabled, authenticated storage retained, sequential funnel navigation. This is a laboratory funnel, not independent cold-storage field measurement. Performance execution follows functional browser suites to avoid concurrent test CPU contention. Exact summaries and any target misses are recorded in the release report; no universal CWV pass is implied.

## Security and privacy

Existing tenant filters, merchant ownership, authentication, stock checks, price calculation and idempotency remain. Backend tests and native journeys check foreign-order denial and absence of customer identity/address/phone in public tracking responses. Snapshot validation rejects unknown fields, markup, oversized JSON and invalid colors/presets. Uploads reuse existing server validation; browser restrictions are supplementary.

Registration distinguishes uncertain network outcomes and provides account recovery rather than automatically creating a second tenant. Preview actions do not mutate real checkout state. Tests refuse non-localhost write targets. Committed screenshots use isolated tenants/test images; no production customer data, auth tokens, connection strings or raw network archives belong in evidence.

Dependency audits observed: npm **0 known vulnerabilities**, NuGet direct/transitive **0 known vulnerabilities**. See sanitized audit files. Dependency scanning is not a penetration test.

## Monitoring and recovery

The browser emits an allowlisted area/status/time signal for crashes, API failures, checkout/publish errors and image failures. It uses `console.warn` and a local CustomEvent. It deliberately omits messages, URLs, bodies, tokens and customer data. There is **no newly verified central browser telemetry collector**. Backend unhandled exceptions log exception type, DB error code and trace ID rather than raw exception text containing private paths/data. Existing platform logs remain the operational source.

For uncertain checkout, keep the original request/key and use the same-order recovery action; reconcile merchant records before any independent new purchase. For uncertain registration use login/password recovery. For appearance problems use previous-version restore only on a verified capable backend. Frontend rollback uses the prior verified Vercel deployment. Backend rollback requires a validated SQL backup/restore and schema-compatible prior binary; no production backend deployment is authorized by these local tests.

## Database and notification gate

Existing authorized evidence records a copy-only checksum SQL backup created on 2026-11-02 at 07:00 UTC. `RESTORE VERIFYONLY` did not pass (SQL error **262**); isolated restore did not pass and no isolated SQL Server is verified. Backup-file creation alone is insufficient. Do not apply production migrations, automatic startup schema changes or deploy the new backend until a successful isolated restore and rollback drill are recorded.

No confirmed reliable MonsterASP scheduler/always-on dispatcher or physical push receipt exists. PR #34/Web Push remain disabled. A Windows desktop is not a production dispatcher. No paid service, SaaS notification provider or production VAPID activation was introduced.
