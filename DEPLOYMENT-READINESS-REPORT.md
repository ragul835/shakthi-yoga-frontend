# Deployment Readiness Report

Date: 2026-08-18
Scope: Shakthi Yoga frontend repository. Backend and live-infrastructure claims require separate evidence.

## Release decision

Deployment is approved only after every item in the final checklist is green. This report is intended to travel with the release and be updated when the checks are rerun.

Current decision: **CODE READY — DEPLOYMENT APPROVAL PENDING**. Frontend and backend engineering remediation passes automated verification. Production activation still depends on applying the database migration, qualified legal approval, production configuration, staging end-to-end tests, backups, monitoring, and business sign-off.

## Automated verification

| Check | Result |
| --- | --- |
| Frontend ESLint | Passed |
| Frontend unit tests | Passed (5/5) |
| Frontend production build | Passed |
| Backend unit tests | Passed (44/44 across 14 suites) |
| Backend production build and Prisma validation | Passed |
| Backend production dependency audit | Passed (0 vulnerabilities) |
| Consent migration | Generated; must be applied and verified in staging/production |
| Frontend production dependency audit | Passed (0 vulnerabilities) |
| Shell script syntax | Passed |
| Local production HTTP smoke test | Passed: branded 404 returned HTTP 404; `/health` returned HTTP 200; robots and sitemap rendered |
| Desktop/mobile visual smoke test | Not rerun; requires target browsers/devices |

## Business rules verified

- Class-pass allocations are dynamic and use the pass definition created by an administrator.
- A class is deducted when an eligible booking is consumed and a completed pass cannot be reused.
- Makeup credits expire at the end of the calendar month of the missed class.
- Makeup-credit booking is atomic: a failed or full-class booking does not reserve a seat or consume the credit.
- Expired and consumed makeup credits remain visible in history.
- Administrative APIs reject unauthenticated requests.
- Admin revenue is calculated from `SUCCEEDED` payment records only; pending, failed, and refunded payments are excluded. The dashboard refreshes this total every 30 seconds and when the browser tab becomes visible.

## Fixes applied from the deployment audit

- Upgraded Next.js to a patched release and reran the production dependency audit.
- Added a dedicated `/contact` page and Contact navigation item for desktop and mobile.
- Added browser security response headers.
- Made the server-side API proxy target configurable through `BACKEND_INTERNAL_URL`.
- Replaced the deprecated unnamed NestJS wildcard route with a named wildcard.
- Added API request throttling and backend security headers.
- Added structured production logging, request correlation IDs, sanitized HTTP timing logs, global frontend error boundaries, and rate-limited browser error ingestion.
- Upgraded `nanoid` to 3.3.18 and verified zero production dependency vulnerabilities.
- Added validated internal post-login redirects and malicious redirect tests.
- Added CSP/HSTS configuration, route metadata, private-route `noindex`, robots, sitemap, manifest, health endpoint, and branded 404 handling.
- Removed hydration-warning suppression and the obsolete online-payment/bank-transfer customer UI.
- Added fixed legal document/waiver versions, optional media consent, guardian fields for minors, and stronger registration validation.
- Added deterministic GitHub Actions CI, `npm ci` deployment installs, and Node version pinning.
- Replaced browser-readable JWT storage with same-origin HttpOnly/Secure cookie sessions, hashed refresh rotation/revocation, automatic session refresh, and CSRF protection.
- Removed the simulated online pass-purchase endpoint and payment-proof upload/reference flow.
- Added backend-enforced versioned consent records, guardian consent for minors, and the associated Prisma migration.
- Made manual request creation server-priced, duplicate-resistant, serializable, and review outcomes idempotent.
- Pinned the audited Prisma CLI/client pair and verified zero backend production dependency vulnerabilities.
- Added a database-aware backend `/api/health` endpoint, a dependency-aware frontend `/health` endpoint, and native Node Render health-check wiring.
- Added skip navigation and keyboard focus containment/restoration for the mobile navigation menu.

## Outstanding release blockers

- Apply and verify migration `20260818160000_add_versioned_consent` before accepting registrations.
- Run deployed integration tests for cookie issuance/rotation, CSRF rejection, logout revocation, request concurrency, idempotent review, and role authorization.
- Obtain qualified legal review of Terms, Privacy, waivers, minor consent, cancellation/refund terms, and the fixed effective versions.
- Verify exact production origin/CORS, secrets, DNS, HTTPS, CSP behavior, headers, email, storage, monitoring, and alert ownership.
- Run production-like frontend/backend/database/storage/email end-to-end, concurrency, accessibility, browser, performance, backup/restore, rollback, and release-day smoke tests.
- Record the exact release commit, frontend/backend versions, reviewers, test operators, staging evidence, and technical/business/legal approvals.

## Post-remediation runtime verification

- A local Next.js production server returned the configured CSP, HSTS, content-type, frame, referrer, permissions, opener, and resource-policy headers.
- The frontend `/health` now returns HTTP 200 only when the backend health endpoint and database are reachable; an unavailable dependency returns HTTP 503.
- `robots.txt` excluded private/transactional routes and `sitemap.xml` contained only public routes using the configured site origin.
- `/contact` returned HTTP 200 and rendered the CMS-backed contact experience.
- Public API requests returned HTTP 200 and protected admin requests returned HTTP 401.
- Frontend and backend security headers were present in production mode.
- The API returned HTTP 429 after the configured per-minute request limit.
- The backend started without the deprecated wildcard-route warning.

## Required production configuration

- `NEXT_PUBLIC_SITE_URL`: canonical public HTTPS origin used for metadata, robots, and sitemap generation.
- `BACKEND_INTERNAL_URL`: backend origin used only by the server-side Next.js `/api` rewrite; it is required in production and defaults to `http://127.0.0.1:3001` in development.
- `FRONTEND_URL`: comma-separated allowed HTTPS frontend origins.
- `JWT_SECRET`: unique secret of at least 32 characters.
- `LOG_LEVEL`: backend logging threshold; use `info` in production and temporarily use `debug` only during controlled troubleshooting.
- Database and SMTP credentials must be supplied by the deployment secret manager and never committed.

## Final deployment checklist

- [ ] Frontend and backend changes are committed on the intended feature branch.
- [ ] Pull request review and CI are green.
- [ ] Production environment variables and secret rotation are complete.
- [ ] Database backup exists and migrations are applied before application traffic is enabled.
- [ ] Admin login, CMS publishing, newsletter send, student booking, attendance and pass consumption are smoke-tested using dedicated staging accounts.
- [ ] Monitoring, structured logs, health checks and rollback version are confirmed.

## Production logging

- Backend production logs are newline-delimited JSON on standard output for PM2 and CloudWatch collection.
- Every API response includes `X-Request-Id`; HTTP completion logs include the same request ID, status, duration and response size.
- Query strings, authorization values, cookies, request bodies, IP addresses and user-agent strings are not logged.
- Unexpected browser errors are sent as sanitized metadata to `/api/observability/client-error`, limited to 20 reports per minute per client.
- Use `pm2 logs` for immediate diagnosis and ship the PM2 log files with the CloudWatch agent for retention and alerts.

## Rollback

Retain the previous frontend and backend artifacts. If post-deployment smoke tests fail, restore both artifacts together and roll back only database migrations explicitly designed as reversible. Do not manually delete attendance, enrollment, pass or newsletter records.
