# Phase 05 performance, security and recovery

## Measurement protocol

`frontend/tests/phase05-performance.mjs` uses Lighthouse 13.5 user flows against a production Next build and an isolated local API. Five navigation steps cover landing, merchant setup, store, dedicated product and tracking. Cart/checkout opening use performance timespans plus accessibility snapshots. Timespans/snapshots have **no navigation LCP or overall performance score**. TBT is not INP. No real-user field INP is available.

Final runs use three repetitions for both applied (`devtools`) and simulated throttling, fresh Chrome per repetition, cache disabled, authenticated storage retained, sequential funnel navigation. This is a laboratory funnel, not independent cold-storage field measurement. Performance execution follows functional browser suites to avoid concurrent test CPU contention. Exact summaries and any target misses are recorded in the release report; no universal CWV pass is implied.

## Final measured results

Application `2426469137ba8fb50e6d97448e26dee390dbef15`; English saved locale; 390×844 CSS viewport, DPR 1; Lighthouse default mobile throttling with CPU slowdown 4×. Three repeats per method, **54 flow-step records**. Values below are medians; separate applied and simulated values must not be mixed into one score.

| Method | Navigation | LCP ms | CLS | TBT ms | Performance / accessibility |
|---|---|---:|---:|---:|---|
| Applied | Landing | 3789 | 0.0421 | 868 | 67 / 100 |
| Applied | Setup | 3542 | 0 | 79 | 89 / 100 |
| Applied | Store | 2130 | 0 | 84 | 95 / 100 |
| Applied | Product | 1986 | 0 | 82 | 97 / 100 |
| Applied | Tracking | 1976 | 0.0284 | 81 | 97 / 100 |
| Simulated | Landing | 3492 | 0.4211 | 64 | 72 / 100 |
| Simulated | Setup | 3575 | 0 | 47 | 91 / 100 |
| Simulated | Store | 3180 | 0.1018 | 24 | 91 / 100 |
| Simulated | Product | 2818 | 0.1033 | 45 | 93 / 100 |
| Simulated | Tracking | 2666 | 0.1785 | 47 | 89 / 100 |

Cart-opening median TBT: applied/simulated **0/0 ms**. Checkout-opening: **13/11 ms**. Both timespans recorded CLS 0; their accessibility snapshots scored 100. Navigation LCP and overall performance scores are deliberately null for timespans/snapshots in the retained summaries. Lighthouse's timespan category score is not used as a page/navigation score. This normalization does not alter the measured navigation values.

**Performance target is NOT met.** Applied landing/setup LCP exceed 2.5 s. All five simulated median LCP values exceed 2.5 s, and four simulated CLS values exceed 0.1. Applied landing TBT also needs attention. These are concrete engineering follow-ups, not owner-access blockers or a claim of production field failure. Dedicated profiling of initial rendering, JavaScript work, saved-language hydration and layout shifts is needed before changing shared rendering behavior. No unsupported improvement percentage or baseline performance comparison is claimed. Existing image optimization, optional font display and lazy optional dictionaries were preserved; navigation prefetch cancellation was corrected for reliability.

See [raw allowlisted metrics](docs/evidence/phase05/performance.json) and [median summary](docs/evidence/phase05/performance-summary.json). No field INP exists. Zero axe violations in 60 functional accessibility audits still leave 44 color-contrast incomplete cases for manual review.

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

Official hosting documentation checked on 2026-11-02 describes [database backup download](https://help.monsterasp.net/databases/mssql/backup) under Databases → Backups → Create BAK file → Download, and [restore requirements](https://help.monsterasp.net/databases/mssql/restore), including a same/newer SQL Server destination. This is an available provider workflow, not evidence that this account has downloaded or restored the backup. A restore replaces the target database: use a separately verified isolated target only.

[Planned tasks](https://help.monsterasp.net/websites/configuration/scheduled-tasks) are documented as Premium-only HTTP GET jobs with execution limits; [AlwaysRunning](https://help.monsterasp.net/websites/configuration/always-running) is unavailable on Free and requires support on Premium. The account's current plan/scheduler entitlement has not been independently verified. Existing filesystem evidence contains no scheduler entry; that does not prove the control-panel feature is absent. No purchase or activation is performed.
