# Deployment Readiness Report

Date: 2026-08-02  
Scope: Shakthi Yoga frontend and backend production working trees

## Release decision

Deployment is approved only after every item in the final checklist is green. This report is intended to travel with the release and be updated when the checks are rerun.

## Automated verification

| Check | Result |
| --- | --- |
| Frontend ESLint | Passed |
| Frontend unit tests | Passed (10/10) |
| Frontend production build | Passed |
| Backend unit tests | Passed (14/14) |
| Backend production build | Passed |
| Prisma schema validation | Passed |
| Prisma migration status | Up to date (3 migrations) |
| Backend production dependency audit | Passed (0 vulnerabilities) |
| Frontend production dependency audit | Passed (0 vulnerabilities) |
| Shell script syntax | Passed |
| Production HTTP/API smoke test | Passed except missing Contact route; fixed in this release |
| Desktop/mobile visual smoke test | Passed at 1440×900 and 390×844 |

## Business rules verified

- Class-pass allocations are dynamic and use the pass definition created by an administrator.
- A class is deducted when an eligible booking is consumed and a completed pass cannot be reused.
- Makeup credits expire 30 days after issuance.
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

## Post-remediation runtime verification

- `/contact` returned HTTP 200 and rendered the CMS-backed contact experience.
- Public API requests returned HTTP 200 and protected admin requests returned HTTP 401.
- Frontend and backend security headers were present in production mode.
- The API returned HTTP 429 after the configured per-minute request limit.
- The backend started without the deprecated wildcard-route warning.

## Required production configuration

- `NEXT_PUBLIC_API_URL`: public API URL when the browser calls a separately hosted backend.
- `BACKEND_INTERNAL_URL`: internal backend origin used by the Next.js `/api` rewrite; defaults to `http://127.0.0.1:3001` for a same-host deployment.
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
