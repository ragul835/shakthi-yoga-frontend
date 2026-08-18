# Shakthi Yoga Test Execution Report

**Execution date:** August 18–19, 2026  
**Plan:** `MASTER-TEST-PLAN.md` version 1.1  
**Environment:** Local production builds, native Node services, PostgreSQL `zenyoga`, desktop/mobile headless Google Chrome  
**Overall decision:** **PASS — LOCAL AUTOMATED PRODUCTION GATE COMPLETE**

## Final remediation retest

The August 19 remediation run supersedes the initial failures recorded below:

- Full Playwright production matrix: **50/50 passed** across desktop and mobile Chrome.
- Serious/critical axe violations: **0** on all eight public routes in both projects.
- Invalid-login behavior: **passed**; invalid credentials remain on sign-in and show the correct message.
- Critical class/pass manual-verification workflow: **passed** in both browser projects with QA data cleanup.
- Frontend lint, unit tests, TypeScript production build and `git diff --check`: **passed**.
- Production and complete npm dependency audits: **0 vulnerabilities**.

The application code and locally executable automated release gates are production-ready. External operational checks listed later in this report still require the deployment environment and responsible owners; they cannot be certified by a local run.

## Executive result

The complete 189-case catalogue was assessed for executability. All locally executable automated suites and critical end-to-end flows listed below were run. Initial accessibility, authentication UX and development-dependency failures were fixed and passed final regression. Cases requiring deployed production infrastructure, real provider accounts, physical Safari/iOS devices, destructive production recovery, sustained multi-hour load, or human/legal approval remain **Blocked**, not skipped or represented as passed.

| Area | Result | Evidence |
| --- | --- | --- |
| Frontend lint | Pass | ESLint exit 0 after generated-report exclusions |
| Frontend unit rules | Pass | 19/19 assertions across 5 test files |
| Frontend production build | Pass | Next.js 16.2.12; 19 routes generated |
| Frontend production dependency audit | Pass | 0 production vulnerabilities |
| Frontend complete dependency audit | Pass | 0 vulnerabilities after dependency remediation |
| Backend unit/service tests | Pass | 44/44 across 14 suites |
| Backend API E2E baseline | Pass | 1/1 |
| Backend production build | Pass | Nest build exit 0 |
| Backend production dependency audit | Pass | 0 vulnerabilities |
| Prisma schema/migrations | Pass | Schema valid; 13 migrations; database up to date |
| Chrome E2E matrix | Pass | 50/50 passed on final production-build run |
| Critical class/pass API E2E | Pass | 3/3 targeted cases; QA user cleaned up |
| Backup/restore | Pass | Critical counts matched and 33 constraints restored |
| Rate-limit spike | Pass | 150 requests: 120 HTTP 200, 30 HTTP 429, 183 ms |

## Resolved defects

### QA-001 — Serious WCAG violations on every tested public route

**Resolution:** Fixed and verified / formerly High P1  
**Affected:** Home, About, Classes, Pricing, Contact, Testimonials, Terms, Privacy; desktop and mobile Chrome  
**Related cases:** AX-008, AX-012 and the accessibility expectation in FE-001

Observed violations include:

- Insufficient text contrast, including measured ratios of 3.51:1, 4.05:1, 4.28:1 and 4.30:1 where 4.5:1 is required.
- Navbar and footer logo spans use `role="img"` with an empty accessible label.

**Evidence:** 16 Playwright/axe failures (eight routes × two Chrome viewports), with failure screenshots and traces generated during the run.

### QA-002 — Invalid login is handled as an expired session

**Resolution:** Fixed and verified / formerly High P1  
**Affected:** Sign-in on desktop and mobile Chrome  
**Related cases:** FE-013, API-012

Submitting an unknown email/wrong password redirects to `/signin?session_expired=true`. The intended “Invalid email or password” alert is not shown. The API client treats the expected login `401` like an expired authenticated request and starts the session-expiry flow.

**Evidence:** 2 Playwright failures, desktop and mobile.

### QA-003 — High-severity findings in development/test dependency tree

**Resolution:** Fixed and verified; both audit modes report zero vulnerabilities  
**Affected:** Development tooling only

`npm audit` reports vulnerable transitive versions of `brace-expansion` and `js-yaml`. `npm audit --omit=dev` passes with zero vulnerabilities.

## Critical functional E2E evidence

The following real frontend-proxied API workflow passed against PostgreSQL:

1. Register unique adult student with versioned required consent.
2. Verify student cannot access the admin dashboard API (`403`).
3. Read active public class/pass records.
4. Submit class manual-verification request (`PENDING`).
5. Resubmit identical class request and receive conflict (`409`).
6. Submit pass manual-verification request (`PENDING`).
7. Authenticate administrator using secure cookies.
8. Approve both requests.
9. Repeat the same approval successfully without duplicate side effects.
10. Attempt conflicting rejection and receive `400`.
11. Download both authenticated PDF receipts.
12. Verify student pass entitlement exists.
13. Delete the isolated QA student and cascade-created data.

This provides direct evidence for FE-030–034, FE-048–053, API-013–015, API-019–024, BE-007–013, and the applicable database transaction/relationship cases.

## Authentication and security evidence

Passed assertions:

- Valid admin login returns a user without access/refresh tokens in JSON.
- Access and refresh cookies are HttpOnly; CSRF cookie exists.
- Authenticated profile succeeds.
- Mutation without CSRF is rejected (`403`).
- Logout with matching CSRF succeeds and profile becomes unauthorized (`401`).
- Anonymous admin access returns `401`; student admin access returns `403`.
- Unknown body fields and malformed registration are rejected (`400`).
- External post-login redirect is rejected; admin remains on the local admin route.
- Private frontend routes redirect anonymous users to sign-in.
- CSP, `nosniff`, frame protection, health dependency chain, robots and sitemap assertions pass.
- Customer class/pricing pages contain no card, payment, reference, screenshot or file-upload controls.

## Database evidence

| Check | Result |
| --- | --- |
| Prisma schema validation | Pass |
| Migration status | Pass: 13 migrations, up to date |
| Backup format | PostgreSQL custom archive |
| Backup size | 825,082 bytes |
| Original critical counts | users 10; classes 9; enrollments 12; requests 11 |
| Restored critical counts | users 10; classes 9; enrollments 12; requests 11 |
| Restored PK/FK/unique constraints | 33 |
| Temporary restore database cleanup | Pass |

## Browser execution summary

| Project | Passed | Failed | Main failure |
| --- | ---: | ---: | --- |
| Desktop Chrome | 25 | 0 | Pass |
| Mobile Chrome emulation | 25 | 0 | Pass |
| Total | 50 | 0 | Local automated release gate passes |

Public HTTP/rendering, primary-heading, branded 404, health/header/SEO, no-payment, safe redirect, admin login and private-route assertions passed independently from accessibility assertions.

## Master-plan coverage disposition

| Catalogue area | Disposition |
| --- | --- |
| FE-001–057 | Critical public/auth/request/admin paths pass. Accessibility and invalid-login regressions pass; remaining detailed form/admin state variants require expanded browser fixtures. |
| API-001–048 | Core cookie, CSRF, validation, role, ownership, manual-review, receipt, health and throttling paths run. Full endpoint-by-endpoint malformed/not-found matrix remains blocked on additional integration automation. |
| BE-001–020 | Existing 44 backend tests pass; critical request-review workflow also passed E2E. Fault-injection variants not represented by existing suites remain blocked. |
| DB-001–025 | Schema, migration, transaction-backed critical workflow, backup and restore pass. DST, retention and every destructive FK/cascade permutation require an isolated dedicated test dataset. |
| AX-001–012 | Automated axe passes with no serious/critical violations. Physical screen-reader and complete manual keyboard review are blocked pending human/device execution. |
| COMP-001–004 | Desktop/mobile Chrome run. Firefox, Safari, iPhone and real Android are blocked because those browser/device environments are not available locally. |
| PERF-001–006 | Short API spike/rate-limit test passed. Lighthouse, SLA load, soak and large concurrency runs are blocked pending agreed budgets and a production-like environment. |
| REL-001–006 / OPS-001–003 | Health and local backup/restore pass. Provider outage, alert delivery, multi-service rollback and production restart drills require staging/operations access. |
| SEO-001–003 / PRIV-001–005 | Headers, robots, sitemap, cookies and no-payment checks pass. Webmaster-tool verification and legal/privacy approval require external owners. |

## External and environment blockers

These were not silently skipped:

- Real SMTP delivery/reputation and newsletter campaign delivery.
- Production DNS, HTTPS certificate, Render scaling/cold-start and alert routing.
- Real Safari, Firefox, iPhone, Android and screen-reader sessions.
- Lighthouse/field Core Web Vitals and agreed performance SLA.
- Multi-hour soak, provider outages and production-like rollback drill.
- Production backup retention and restore by the responsible operator.
- Legal correctness and formal business/legal sign-off.

## Release gate

The local automated release gate is **GO**. Final public deployment sign-off still requires:

1. Run the documented production DNS/HTTPS, monitoring, SMTP and rollback checks in the real hosting environment.
2. Complete physical Safari/iOS, Firefox, Android and screen-reader checks where required for launch scope.
3. Complete legal/privacy and business-owner approval.
4. Record all required P0 evidence against the exact deployed release SHA.
