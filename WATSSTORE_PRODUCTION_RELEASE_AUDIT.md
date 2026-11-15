# Production consolidation — 2026-11-03

Status: IN PROGRESS. No new release or successful checkout transaction is claimed.

## Verified repository and hosting state

Fetched master: `e39f0ca48a2ad88ee163bc5c8b197c791feab366`.
Vercel project `prj_OelTAj1B3dbMWsi25y2uaKiuz6qr`, repository AbdallahSay/watsstore-saas.
Production deployment `dpl_2SQTDrGPHs2owAcjkgs8qQjaJrU5` is READY at that SHA.
Canonical URL: https://watsstore.vercel.app . This is deployment metadata; live acceptance remains pending.
Rollback candidate: `dpl_4gswfsNXnveZm6wLQhDUxfsVNXsc` / `fc34a71dbe1da41d2d6d0bce99b855ee1cd8a0cc`.

## Inventory findings

| Work | Observed state | Release action |
|---|---|---|
| #49 dedicated product pages/mobile fixes | merged in master | preserve |
| #53 hero/count/quick-add | merged in master | preserve |
| #54 Brevo provider/admin endpoint | merged in master | source availability does not prove backend deployment or inbox delivery |
| #50 merchant onboarding and theme snapshots | open draft, head 32f7615 | validate integration against current master; backend snapshot capability remains a dependency |
| #51 / #52 | both open, same AsSplitQuery improvement | select one after review; no duplicate backend rollout |
| #34 push | release gated | remain disabled until backup/restore and scheduling verified |
| #42 | still open despite later Pure Beauty fixes | verify actual diff/ancestry before closing |
| #35/#36/#33/#32/#25/#24/#23/#22/#21/#20/#18/#17/#16/#15/#14 | open performance proposals discovered | inspect duplication before closing; preserve branches |
| feat/watsstore-2.0 / feat/phase11-production-audit | unmerged branch changes include 20 themes and setup overlap | compare against #50 and current master; reports alone cannot satisfy acceptance |
| feat/merchant-account-security-phase12 and local codex/merchant-account-security | competing security implementations | do not combine blindly; review revocation, OTP leakage and migrations |

Search responses return 20 results at a time; this inventory is preliminary, not an exhaustive all-history claim.

## Checkout repair and evidence

Current master uses inline labels inside checkout fieldsets without an explicit field layout.
Repair makes each field label a single-column grid, gives adjacent fields vertical separation,
resets fieldset intrinsic minimum width and constrains controls to the drawer width.
No order, price, tenant, authentication or inventory logic changes.

`frontend/tests/checkout-layout.e2e.cjs`: PASS 140 geometry cases (10 themes × Arabic/English × widths 320/360/390/430/768/1024/1440).
Checks text-label bounds above controls, adjacent-field separation, control containment and root overflow.
Actual isolated UI/API fixture; POST orders blocked; zero order submissions.
Screenshots and structured results: local ignored `work/release-evidence/`.
Frontend unit tests: 37/37 PASS. npm ci audit: zero vulnerabilities.
Local production build: FAILED on Google Cairo font download timeouts; do not mark green.
Existing lint command `next lint` fails on Next 16; lint tooling repair and full execution are pending.
CI and production verification of this repair are pending.

Follow-up evidence: TypeScript PASS. CI run 41638259364 completed frontend build/audit/tests
and backend build/audit/tests successfully; browser job was still running at inspection.
Chrome production HTTP-read-only smoke PASS in Arabic/English, with zero order POST requests;
this checks the existing production release and does not prove this repair is deployed.
Public-store GETs can increment the existing visit counter.
Actual ESLint audit using Next's recommended configuration found 38 errors and 29 warnings
in 88 source files, including existing effect-state updates and render-time ref access.
Historical finding above: the 38 ESLint errors have now been repaired with all
recommended rules still enabled and no added suppressions. Browser storage uses
React external-store hydration, derived selections no longer cascade through
effects, and async loader completion handlers own response updates. Ref callbacks
are committed through effects. `next lint` is replaced by the supported ESLint CLI.

Run 41638676102 failed at ESLint; backend checks passed. Later runs proved lint
green but exposed GHSA-g3hv-75wg-m249 in the newly added lint dependency tree.
The compatibility adapter delegates old and new matcher interfaces to patched
upstream minimatch 11.0.4. Its reviewed source and tarball are checked in; the
dependency URL is pinned to immutable commit 9c9545d with lockfile integrity.
The upstream package remains a registry alias and is audited, rather than ignored.
Advisory: https://github.com/advisories/GHSA-g3hv-75wg-m249 .

Browser follow-up caught and repaired two hydration regressions: cart quantity
could be overwritten by a stale saved cart, and persisting an in-flight attempt
could prematurely display the uncertain-outcome state. Restoration is now scoped
to initialization/store identity; live edits and request outcomes remain authoritative.
The customer-history test explicitly waits for hydrated order rows after reload
before asserting the same persistent-unread behavior.
Final CI and deployment acceptance are still pending; do not infer release from
these local repairs. Backend and SQL migration diffs against master are empty.
Review PR: https://github.com/AbdallahSay/watsstore-saas/pull/55 .

## Release holds and rollback

SQL backup creation is not a verified isolated restore; prior VERIFYONLY failed SQL 262.
No backend deployment or migration is authorized by passing a health check alone.
Keep affected backend changes gated; compatible frontend fixes can proceed after mandatory checks.
No production stores were deleted. No production order write is part of this audit.
Do not activate real OTP delivery or Web Push based on provider acceptance or preview builds.

Before a release: record exact final SHA, green mandatory checks and inspect the actual production domain.
Rollback frontend through Vercel to the recorded READY candidate only after assessing API compatibility;
preserve release references. Backend rollback/restore must be rehearsed on an isolated restored SQL database first.
