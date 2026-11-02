# Phase 05 soft-launch checklist

Release decision: **HOLD full production soft launch** pending the gates below. Independently reviewable frontend work must retain its backend capability gate. The Phase 05 request ends with a tested PR and safe release instructions; this report does not authorize bypassing dependencies.

| Gate | Required evidence | Current state |
|---|---|---|
| Frontend/backend builds and mandatory tests | Exact revision, complete CI results | Final release report |
| Dependency/security regression | npm/NuGet audit; tenant/idempotency/privacy tests | Local audits clear; final CI required |
| SQL backup and rollback | Fresh backup, successful isolated SQL restore, migration twice, prior binary recovery | **BLOCKED: restore not verified, SQL262** |
| Backend capability | Deployed revision and real SQL draft/publish/restore round-trip | **NOT DEPLOYED** |
| Five merchants / five customers | Actual observations and times | **NOT RUN** |
| Physical iPhone, Android, tablet, Edge | Native input, safe areas, text sizing and shopping results | **NOT RUN** |
| Performance | Repeated lab values; disclose misses; field INP if available | **Target NOT MET**: applied landing/setup LCP and simulated LCP/CLS misses; no field INP |
| Push notifications | Reliable host, secure VAPID, closed-page receipt, dedup/unsubscribe/recovery | **DISABLED / UNVERIFIED**, independent PR34 |

## Safe release sequence

1. Review the Phase 05 diff and all mandatory CI checks at the exact PR head; do not merge while any fail.
2. Resolve SQL262 using the existing hosting account: obtain a downloadable backup/export and an authorized isolated SQL Server restore target. Verify backup integrity and perform restore; execute any required migration twice there, inspect tenant/order/stock consistency, and prove rollback. Never point test scripts at production.
3. With the database gate satisfied, deploy the reviewed backend through the established hosting process, accounting for existing startup schema/seeding behavior. Verify version capability, authorization, draft isolation and exception handling on isolated SQL first. Record revision and rollback artifact.
4. Release frontend using the existing GitHub/Vercel flow. Match the deployed Git SHA and READY deployment ID to the approved commit. Retain `themeStateVersion` gating until backend capability is present.
5. Read-only production smoke: canonical domain, registration page, authenticated setup with approved test account if available, public store/product, capability and CORS headers. No uncontrolled production orders. A transaction check requires a separately approved controlled tenant/data plan and verified backup.
6. Complete the manual pilot checklist, remediate actual issues and record participant evidence. Monitor existing platform logs without collecting customer secrets.
7. If regression occurs, restore the prior verified frontend deployment. Keep the backend unchanged unless its verified rollback procedure applies. Keep background push disabled until every independent push gate passes.

Only actual access/resource gaps require owner action: SQL restore permissions/isolated server and access to physical pilot participants/devices. Never paste credentials into reports or chat.
