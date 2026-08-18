# Shakthi Yoga Master Test Plan and Test-Case Catalogue

**Version:** 1.1  
**Prepared:** August 18, 2026  
**Systems:** Next.js frontend, NestJS backend, PostgreSQL/Prisma, same-origin `/api` proxy  
**Payment model:** The website collects no online payment or payment proof. A student submits a class or pass request; an authorized administrator manually approves or rejects it.

## 1. Purpose and quality objectives

This document is the release test baseline for functional and non-functional verification. It covers positive, negative, boundary, validation, authorization, integration, concurrency, accessibility, compatibility, performance, security, recovery, migration, and data-integrity testing.

Release objectives:

- No class enrollment or pass becomes usable before authorized manual approval.
- Prices and entitlements are determined by the backend, never trusted from the browser.
- Authentication tokens remain in secure cookies and mutations require CSRF protection.
- Roles and ownership are enforced by the API even if frontend controls are bypassed.
- Capacity, pass usage, attendance, makeup credits, and review operations remain consistent under concurrency and retries.
- Sensitive data is validated, minimally exposed, safely logged, and preserved correctly.
- Public pages remain usable across supported browsers, devices, keyboard, zoom, and assistive technology.

## 2. Scope

### In scope

- Public pages, registration, sign-in, password reset, classes, pricing, booking/pass requests, student dashboard, admin dashboard, CMS, contact, testimonials, and newsletter.
- All `/api` controllers, cookie authentication, refresh rotation, CSRF, throttling, validation, security headers, logging, and health checks.
- PostgreSQL schema, constraints, migrations, transactions, cascade behavior, backup and restore.
- Native Node/Render deployment. Docker is out of scope.

### Out of scope

- Online card/wallet/bank payment gateways, payment-proof uploads, chargebacks, and webhook processing.
- Legal correctness of policies and waivers; qualified legal approval is a separate release gate.
- Third-party provider internals; only the application's handling of their responses is tested.

## 3. Test approach

| Level/type | Purpose | Suggested tooling |
| --- | --- | --- |
| Unit | Pure rules, transformations, validators, services | Node test runner, Jest |
| Component | Form states, errors, focus, navigation | React Testing Library, axe-core |
| API contract | Status, body, cookies, headers, validation, authorization | Supertest/Postman/Newman |
| Integration | API + PostgreSQL + SMTP/storage substitutes | Jest/Supertest, test database |
| End-to-end | Real browser student/admin journeys | Playwright |
| Database | Constraints, transactions, migration and restoration | Prisma, `psql`, SQL assertions |
| Security | OWASP abuse, session, CSRF, access control, headers | ZAP baseline, manual tests |
| Performance | latency, load, spikes, concurrency | k6/Artillery, Lighthouse |
| Accessibility | WCAG 2.2 AA behavior | axe, keyboard, screen reader |
| Compatibility | Browsers, viewport, zoom, network | Browser/device matrix |
| Resilience | dependency outage, restart, retry, rollback | controlled fault injection |

## 4. Environments and test data

Use isolated databases for automated tests. Never run destructive cases against production.

Required users:

| Persona | Role | State |
| --- | --- | --- |
| Anonymous | none | no cookies |
| Student A | STUDENT | active, adult, no pass |
| Student B | STUDENT | active, valid pass |
| Minor Student | STUDENT | guardian consent recorded |
| Instructor | INSTRUCTOR | assigned/unassigned class variants |
| Admin | ADMIN | active |
| Super Admin | SUPER_ADMIN | active |
| Disabled User | STUDENT | `isActive=false` |

Required records include an open class, full class, cancelled class, completed class, zero-price class if supported, active/inactive pass options, valid/expired/exhausted passes, pending/approved/rejected requests, attendance history, makeup credits, draft/published CMS content, and confirmed/unconfirmed/unsubscribed newsletter contacts.

## 5. Severity, priority, and execution rules

- **P0:** release-blocking security, data loss, unauthorized access, incorrect entitlement, migration or availability failure.
- **P1:** core journey failure or material accessibility/privacy problem.
- **P2:** secondary function, compatibility, presentation, or recoverable error.
- Every failure records environment, build SHA, role, test data IDs, request ID, steps, expected/actual result, evidence, severity, and reproducibility.
- Automated tests must be deterministic, clean their own records, and never depend on execution order.

### 5.1 Test status definitions

| Status | Definition |
| --- | --- |
| Not run | No execution evidence exists for the current release SHA. This is the default for every catalogue case. |
| Pass | Expected result was demonstrated on the current release SHA and evidence is attached. |
| Fail | Actual behavior differs from the expected result; a defect is linked. |
| Blocked | An external dependency or missing prerequisite prevents execution; blocker owner and date are recorded. |
| Not applicable | Product owner approved exclusion with a documented reason. It must not be used to hide an untested risk. |

Passing an older build does not count as passing the release candidate. A test affected by a code, schema, dependency, configuration, or infrastructure change returns to **Not run** until retested.

### 5.2 Requirements traceability matrix

| Requirement/risk | Frontend | API/backend | Database | Non-functional | Release evidence required |
| --- | --- | --- | --- | --- | --- |
| Secure registration and versioned consent | FE-019–026 | API-016–019, BE-001–004 | DB-005, DB-018–019 | PRIV-002–003 | Browser video, API response, consent-row query |
| Cookie session lifecycle | FE-012–018, FE-027–029 | API-001–012, BE-005–006 | DB-019 | PRIV-001 | Cookie flags, rotation/replay results, logout/reset evidence |
| Role and ownership enforcement | FE-038, FE-047–048 | API-013–015, API-023, API-032 | DB-018–019 | API-045 | Complete role matrix with status codes |
| Manual class verification | FE-030–032, FE-049–052 | API-019–026, BE-007–013 | DB-006, DB-009, DB-016–017 | PERF-005, REL-001 | Before/after rows, concurrent request output, receipt |
| Manual pass verification | FE-033–034, FE-053 | API-020–024, API-027–028 | DB-009, DB-013–017 | PERF-005 | Entitlement/count/expiry and idempotency evidence |
| Attendance and makeup credits | FE-035–040 | API-027–032, BE-014–017 | DB-007–008, DB-013, DB-015–017 | REL-001 | Attendance, pass count and credit lifecycle evidence |
| Public content and administration | FE-001–009, FE-054–057 | API-013, API-033–034 | DB-018–019 | AX-001–012, SEO-001–003 | Route, authorization, accessibility and publishing evidence |
| Contact/testimonials/newsletter | FE-041–046 | API-035–036 | DB-010–011 | REL-004, PRIV-004 | State transition and controlled-email evidence |
| Availability and observability | FE-005, FE-036 | API-037–042 | DB-020–022 | REL-001–006, OPS-001–003 | Health, logs, alerts, backup/restore and rollback evidence |
| No online payment collection | FE-030, FE-033 | API-019–024, BE-007–013 | DB-009 | PRIV-005 | UI/API/environment/log search evidence |

### 5.3 Endpoint and role coverage rule

Every controller operation must be tested with a success case, malformed-input case where a body/query exists, unauthenticated case where protected, unauthorized-role case where role-restricted, not-found case where an ID exists, and conflict/idempotency case where the operation mutates state.

| API area | Anonymous | Student | Instructor | Admin | Super Admin | Primary cases |
| --- | --- | --- | --- | --- | --- | --- |
| Auth/profile | Public auth actions only | Own profile/session | Own profile/session | Own profile/session | Own profile/session | API-001–012 |
| Users | Denied | Own profile/stats only | Own profile/stats only | Managed access | Managed access | API-013–018 |
| Public classes/instructors/content/testimonials | Read | Read | Read | Read/manage | Read/manage | API-013, API-033–034 |
| Enrollments/requests/receipts | Denied | Own records/actions | Denied unless specified | Review/manage | Review/manage | API-019–028 |
| Attendance | Denied | Own history/credits | Assigned-class read | Manage | Manage | API-027–032 |
| Admin/CMS/contact/moderation/newsletter | Denied | Denied | Denied | Allowed | Allowed | API-013–015, API-033–036 |
| Health | Public, non-sensitive | Same | Same | Same | Same | API-037–038 |
| Client error ingestion | Throttled public input | Same | Same | Same | Same | API-039–042, API-048 |

Any endpoint missing from the execution report is a coverage gap and blocks sign-off until explicitly accepted by the QA lead and product owner.

## 6. Frontend functional test cases

| ID | Type | Pri | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| FE-001 | Positive | P1 | Open Home, About, Classes, Pricing, Contact, Testimonials, Terms and Privacy | Each returns 200, has a unique title and one meaningful H1, and renders without console errors. |
| FE-002 | Negative | P1 | Open an unknown route | Branded 404 is returned with HTTP 404 and working recovery links. |
| FE-003 | Positive | P1 | Navigate using header/footer links | Correct route opens; current navigation item is announced. |
| FE-004 | Boundary | P2 | Use back/forward repeatedly between public pages | UI and URL remain synchronized; no duplicated submissions. |
| FE-005 | Negative | P1 | Backend unavailable while loading public CMS content | Safe fallback/error state appears; page does not crash or expose internals. |
| FE-006 | Positive | P1 | Load classes and apply every available filter | Matching classes render and reset restores the complete list. |
| FE-007 | Negative | P1 | Class API returns empty array, malformed item, 404, 429 and 500 | Correct empty/error/retry behavior; malformed data does not execute markup. |
| FE-008 | Positive | P1 | Load pricing with active pass options | Name, class count, price, validity, and request action are accurate. |
| FE-009 | Negative | P1 | Pass option is inactive/deleted while page is open | Submission is rejected safely and UI refreshes availability. |
| FE-010 | Positive | P1 | Anonymous user starts booking/pass request | User is sent to sign-in with a validated internal return destination. |
| FE-011 | Negative | P0 | Sign-in redirect contains external/protocol-relative/encoded admin URL | Redirect is rejected; user lands on an authorized internal page. |
| FE-012 | Positive | P0 | Student signs in successfully | Secure session is established and student reaches intended non-admin page. |
| FE-013 | Negative | P1 | Incorrect email/password, disabled account, blank fields | Generic safe error; no account enumeration or partial login state. |
| FE-014 | Positive | P1 | Refresh browser with valid cookie session | Profile restores without localStorage tokens or visible login flash. |
| FE-015 | Negative | P0 | Access cookie expires while using the site | One refresh rotation occurs and original request retries once. |
| FE-016 | Negative | P0 | Refresh also fails/revoked | Session clears and user is asked to sign in; no retry loop. |
| FE-017 | Positive | P0 | Logout | Backend revocation completes, cookies clear, private UI disappears. |
| FE-018 | Negative | P0 | Use browser Back after logout | Cached private data is not usable and API calls return 401. |
| FE-019 | Positive | P1 | Register an adult with valid required fields and consents | Account created; exact consent versions/timestamps recorded; session established. |
| FE-020 | Positive | P1 | Register with optional media consent unchecked | Registration succeeds and media consent remains false. |
| FE-021 | Positive | P0 | Register a minor with guardian name, email, and consent | Registration succeeds and guardian evidence is recorded. |
| FE-022 | Negative | P0 | Minor omits guardian field or consent | Frontend blocks progress and backend independently returns 400. |
| FE-023 | Negative | P1 | Password misses length, uppercase, or number rule | Field-level error; registration request is not sent. |
| FE-024 | Boundary | P1 | Submit min/max permitted name, phone, password, and health-text lengths | Boundary values pass; one below/above fails with accessible errors. |
| FE-025 | Negative | P0 | Submit script/HTML/SQL-like strings in text fields | Input is treated as text or rejected; no execution, SQL effect, or unsafe reflection. |
| FE-026 | Negative | P1 | Duplicate email registration | Safe conflict response without sensitive account details. |
| FE-027 | Positive | P1 | Request password reset for existing and unknown emails | Same public response for both; existing user receives valid email only. |
| FE-028 | Positive | P0 | Use a valid password reset link | Password changes and all previous sessions are revoked. |
| FE-029 | Negative | P0 | Use invalid, expired, reused, wrong-purpose, or tampered reset token | Reset denied without password change or token details. |
| FE-030 | Positive | P0 | Submit valid class request | Only class ID/type is sent; pending state appears; no payment/proof fields exist. |
| FE-031 | Negative | P0 | Double-click request or resubmit same class | Exactly one pending enrollment/request exists. |
| FE-032 | Negative | P0 | Request full, cancelled, missing, past, or ineligible class | Clear rejection; no seat or entitlement is created. |
| FE-033 | Positive | P0 | Submit valid pass request | Pending request appears; no online payment or proof is collected. |
| FE-034 | Negative | P0 | Submit duplicate pending pass request | Conflict shown; only one pending request exists. |
| FE-035 | Positive | P1 | Dashboard loads classes, attendance, passes, requests, and receipts | Data matches API and belongs only to signed-in user. |
| FE-036 | Negative | P1 | One dashboard request fails while others succeed | Partial data remains usable with scoped retry/error state. |
| FE-037 | Positive | P1 | Cancel eligible enrollment | Confirmation succeeds and state/capacity refreshes. |
| FE-038 | Negative | P0 | Cancel another user's/ineligible enrollment through modified request | API rejects; UI displays safe error; record unchanged. |
| FE-039 | Positive | P1 | Download owned approved receipt | Authenticated download has correct type/content and no other user's data. |
| FE-040 | Negative | P0 | Modify receipt ID to another user's/pending record | 403/404; no disclosure. |
| FE-041 | Positive | P1 | Submit contact form | Success announced; one sanitized message stored. |
| FE-042 | Negative | P1 | Invalid email, missing fields, oversize values, repeated submissions | Validation/throttling works and success is not falsely shown. |
| FE-043 | Positive | P1 | Submit testimonial and view after admin publication | Initially non-public; appears only after approval. |
| FE-044 | Negative | P1 | Submit unsafe/oversized testimonial | Rejected or safely rendered as text. |
| FE-045 | Positive | P1 | Subscribe, confirm, and unsubscribe newsletter | Status transitions correctly and links are single-purpose. |
| FE-046 | Negative | P1 | Reuse/alter/expire newsletter token | Safe rejection; subscription state remains correct. |
| FE-047 | Positive | P0 | Admin signs in and opens dashboard | Admin features load; student navigation is not shown. |
| FE-048 | Negative | P0 | Student/anonymous opens `/admin` or invokes admin action | Redirect/403; backend remains final authorization boundary. |
| FE-049 | Positive | P0 | Admin approves pending class request | Enrollment activates once, approval metadata and receipt are created atomically. |
| FE-050 | Positive | P0 | Admin rejects pending class request | No access granted; reserved capacity released. |
| FE-051 | Negative | P0 | Repeat same approval/rejection | Same outcome is idempotent; no duplicate pass, seat, or receipt. |
| FE-052 | Negative | P0 | Approve then reject, or reject then approve | Conflicting transition rejected and original outcome preserved. |
| FE-053 | Positive | P0 | Admin approves/rejects pass request | Correct pass entitlement is created only on approval. |
| FE-054 | Positive | P1 | Admin CRUD for classes, passes, users, instructors and testimonials | Lists refresh and persisted data matches entered values. |
| FE-055 | Negative | P0 | Admin submits invalid dates, capacity, price, role, IDs or deleted references | Safe validation response; no partial write. |
| FE-056 | Positive | P1 | Admin edits and publishes CMS content | Draft/preview/public content behavior is correct. |
| FE-057 | Negative | P0 | CMS content contains script/event-handler/javascript URL | Unsafe content is rejected/sanitized and CSP prevents execution. |

## 7. API, authentication, authorization and security cases

| ID | Type | Pri | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| API-001 | Positive | P0 | `POST /api/auth/login` with valid credentials | 200; user body only; access/refresh HttpOnly cookies and readable CSRF cookie set. |
| API-002 | Negative | P0 | Inspect login/register response and browser storage | JWT/refresh token absent from JSON, DOM, localStorage and sessionStorage. |
| API-003 | Positive | P0 | `POST /api/auth/refresh` with valid refresh cookie | Tokens rotate; old refresh token no longer works. |
| API-004 | Negative | P0 | Missing/tampered/expired/wrong-type refresh token | 401; no new cookies. |
| API-005 | Negative | P0 | Replay rotated refresh token | 401 and no session recovery. |
| API-006 | Positive | P0 | Authenticated unsafe request with matching CSRF cookie/header | Request reaches controller. |
| API-007 | Negative | P0 | Unsafe cookie-authenticated request missing/mismatched CSRF value | 403 before mutation. |
| API-008 | Positive | P1 | GET/HEAD requests without CSRF header | Safe operations work according to authorization. |
| API-009 | Negative | P0 | Send Bearer token intended as refresh token to protected endpoint | Rejected because token type is not access. |
| API-010 | Negative | P0 | Tamper JWT payload/signature/version/user ID | 401; no details about verification internals. |
| API-011 | Positive | P0 | Logout with current session | 200; refresh hash removed and all cookies expired. |
| API-012 | Negative | P0 | Use access/refresh credentials after password reset or deactivation | Rejected due to auth version/account state. |
| API-013 | Matrix | P0 | Call every endpoint as Anonymous, STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN | Only documented roles and ownership receive success. |
| API-014 | Negative | P0 | Student changes path/body user ID to another user | 403/404; no horizontal privilege escalation. |
| API-015 | Negative | P0 | ADMIN attempts operation reserved for SUPER_ADMIN, if any | 403 and audit event where applicable. |
| API-016 | Negative | P0 | Add unknown JSON properties | 400 from whitelist/forbid-non-whitelisted validation. |
| API-017 | Negative | P1 | Wrong content type, malformed JSON, nulls, arrays, Unicode edge cases | Consistent 400/415 behavior; server remains stable. |
| API-018 | Boundary | P1 | Pagination page/limit/search at valid and invalid boundaries | Stable ordering/metadata; invalid or excessive values constrained. |
| API-019 | Negative | P0 | Supply browser-controlled amount, status, user ID or approval metadata | Ignored/rejected; backend authoritative values prevail. |
| API-020 | Positive | P0 | `POST /api/payments/manual` for valid class/pass request | 201/200 pending record using authoritative DB price. |
| API-021 | Negative | P0 | Request references mismatched purchase type/ID or inactive item | 400/404; no orphan record. |
| API-022 | Positive | P0 | Admin `PATCH /api/payments/manual/:id` approve/reject | Atomic state transition and correct side effects. |
| API-023 | Negative | P0 | Non-admin reviews request | 403 and no change. |
| API-024 | Negative | P0 | Two admins review same pending request concurrently | One logical result; identical outcome idempotent, conflicting outcome rejected. |
| API-025 | Positive | P0 | Two students request different final seats within capacity | Capacity never exceeded. |
| API-026 | Negative | P0 | Multiple requests race for last seat | At most one succeeds/reserves; losers get conflict and no payment/request orphan. |
| API-027 | Positive | P0 | Booking uses valid pass or makeup credit | Entitlement selected and consumed only when business rule requires. |
| API-028 | Negative | P0 | Expired/exhausted/other-user pass or credit supplied | Rejected; usage counters unchanged. |
| API-029 | Positive | P0 | Attendance marked once | Unique attendance record created and pass usage updated correctly. |
| API-030 | Negative | P0 | Duplicate/concurrent attendance for same enrollment/session | Unique constraint/transaction prevents double consumption. |
| API-031 | Boundary | P1 | Attendance at exact configured before/after time boundaries | Inclusive/exclusive behavior matches specification and class timezone. |
| API-032 | Negative | P0 | Instructor requests attendance for unassigned class | 403. |
| API-033 | Positive | P1 | Public class/instructor/testimonial/CMS endpoints | Only public/active/published safe fields returned. |
| API-034 | Negative | P0 | Public endpoint serialization inspected for hashes, tokens, health notes, guardian data | Sensitive/internal fields absent. |
| API-035 | Positive | P1 | Contact admin read/reply/delete flow | Authorized transition and email behavior correct. |
| API-036 | Negative | P1 | SMTP failure during contact reply/welcome/reset/newsletter | Defined failure or retry response; unrelated DB transaction not corrupted. |
| API-037 | Positive | P1 | Health endpoint with reachable database | 200 with non-sensitive readiness response. |
| API-038 | Negative | P0 | Database unavailable during health check | Backend returns 503; frontend `/health` also returns 503. |
| API-039 | Positive | P1 | Requests include/receive request correlation ID | Response and structured completion log share ID. |
| API-040 | Negative | P0 | Send secrets/PII in query, cookies, headers and body then inspect logs | Passwords, tokens, cookies, health data and bodies are not logged. |
| API-041 | Negative | P0 | Exceed global and route-specific rate limits | 429 with stable response; service recovers after window. |
| API-042 | Negative | P1 | Spoof `X-Forwarded-For` and rotate trivial headers | Rate-limit trust matches proxy configuration and is not easily bypassed. |
| API-043 | Security | P0 | Test SQL injection payloads in all searchable/text inputs | No query alteration or data disclosure. |
| API-044 | Security | P0 | Test reflected/stored XSS across CMS, contact, testimonial, profile | No script execution in public/admin views. |
| API-045 | Security | P0 | Test CORS from allowed, disallowed, null and lookalike origins | Credentials only allowed for exact configured origins. |
| API-046 | Security | P0 | Test clickjacking, MIME sniffing and insecure protocol behavior | CSP/frame, nosniff, referrer, permissions and HSTS headers correct in production. |
| API-047 | Security | P0 | Attempt path traversal/oversized/malformed instructor image upload | Rejected; accepted files obey size/type rules and cannot execute. |
| API-048 | Negative | P1 | Client-error endpoint receives oversized/sensitive/arbitrary payload | DTO limits and throttling apply; logs remain sanitized. |

## 8. Backend service and business-rule cases

| ID | Type | Pri | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| BE-001 | Unit+ | P0 | Register valid adult/minor inputs | Normalization, hashing and versioned consent persistence are correct. |
| BE-002 | Unit- | P0 | Self-service registration omits liability/policy version | `BadRequestException`; user not created. |
| BE-003 | Unit- | P0 | Admin creates student | Student created without issuing/storing a session token. |
| BE-004 | Unit- | P1 | Welcome-email provider fails | Account creation succeeds and sanitized failure is logged. |
| BE-005 | Unit+ | P0 | Login/refresh/logout/password reset | Hash checks, rotation, revocation and auth version behave correctly. |
| BE-006 | Unit- | P0 | Disabled/missing user or wrong password | Generic unauthorized response. |
| BE-007 | Unit+ | P0 | Authoritative class/pass price calculation | Stored request amount equals current DB price exactly. |
| BE-008 | Unit- | P0 | Client attempts negative/changed amount or tax field | Client value cannot affect persisted price. |
| BE-009 | Unit+ | P0 | Approve class request | Enrollment status, request status, verifier, timestamps and receipt are coherent. |
| BE-010 | Unit- | P0 | Approval side effect throws mid-transaction | Entire transaction rolls back. |
| BE-011 | Unit+ | P0 | Reject class request | No entitlement; capacity released exactly once. |
| BE-012 | Unit+ | P0 | Approve pass request | Correct class count and expiry copied from option. |
| BE-013 | Unit- | P0 | Approve request whose target was deleted/deactivated | Defined rejection; no invalid entitlement. |
| BE-014 | Unit+ | P0 | Consume pass across eligible attendance | Remaining count decrements once per qualified attendance. |
| BE-015 | Unit- | P0 | Consumption would make count negative | Transaction rejected; count never below zero. |
| BE-016 | Unit+ | P0 | Absence creates makeup credit | Credit expiry is correct and duplicate absence does not duplicate credit. |
| BE-017 | Unit- | P0 | Failed/full-class makeup booking | Credit is not consumed or reserved. |
| BE-018 | Unit+ | P1 | Search, pagination, sorting and filtering | Stable, deterministic and scoped results. |
| BE-019 | Unit- | P0 | Delete parent entities with dependent records | Behavior matches cascade/restrict policy without accidental data loss. |
| BE-020 | Unit+ | P1 | Dashboard aggregate with mixed request statuses | Only approved/succeeded records contribute to totals. |

## 9. PostgreSQL and Prisma test cases

| ID | Type | Pri | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| DB-001 | Migration+ | P0 | Apply all migrations to an empty database | Schema reaches current version without manual intervention. |
| DB-002 | Migration+ | P0 | Apply pending migration to realistic previous-version data | Existing rows preserved and new nullable/version fields correct. |
| DB-003 | Migration- | P0 | Migration interrupted/fails | Deployment stops; database is not reported healthy; recovery procedure works. |
| DB-004 | Idempotency | P0 | Run `prisma migrate deploy` twice | Second run makes no changes and succeeds. |
| DB-005 | Constraint | P0 | Insert duplicate user email | Unique constraint rejects duplicate. |
| DB-006 | Constraint | P0 | Insert duplicate enrollment `(userId,classId)` | Unique constraint rejects duplicate. |
| DB-007 | Constraint | P0 | Insert duplicate attendance `(enrollmentId,sessionDate)` | Unique constraint rejects duplicate. |
| DB-008 | Constraint | P0 | Duplicate attendance session `(classId,sessionDate)` | Unique constraint rejects duplicate. |
| DB-009 | Constraint | P0 | Attach more than one payment/request to same enrollment | Unique relationship prevents duplicate attachment. |
| DB-010 | Constraint | P1 | Duplicate pass-option name or newsletter tokens/email | Relevant unique constraints reject duplicates. |
| DB-011 | FK negative | P0 | Insert rows with nonexistent user/class/pass IDs | Foreign-key constraint rejects orphan. |
| DB-012 | Cascade | P0 | Delete test user with dependent enrollment/payment/pass data | Only documented cascade occurs; no unrelated rows affected. |
| DB-013 | Set-null | P0 | Delete pass referenced by attendance/enrollment where configured | Reference becomes null without deleting historical attendance. |
| DB-014 | Decimal | P0 | Store prices with 0, 2 decimals, excess scale, negative and huge values | Accepted values preserve precision; invalid business values rejected by service/DB. |
| DB-015 | Timezone | P0 | Save class/session/DOB/timestamps around DST and UTC midnight | Stored UTC and displayed local dates remain correct. |
| DB-016 | Transaction | P0 | Force failure after request status change but before entitlement creation | No partial commit. |
| DB-017 | Isolation | P0 | Concurrent last-seat and concurrent approval transactions | Serialization/retry yields one valid outcome and consistent counts. |
| DB-018 | Audit | P1 | Perform admin create/update/delete/review operations | Required actor/action/entity/timestamp metadata is present and immutable. |
| DB-019 | Privacy | P0 | Query API-facing selects | Password hash, refresh hash and sensitive fields are never selected accidentally. |
| DB-020 | Backup | P0 | Take encrypted backup and verify checksum | Backup completes, is readable by authorized operator, and retention is recorded. |
| DB-021 | Restore | P0 | Restore backup into isolated database | Counts, constraints, migrations and sampled records match source. |
| DB-022 | Recovery | P0 | Restore then apply current migrations and start services | Health checks pass and core smoke tests succeed. |
| DB-023 | Seed+ | P1 | Run development seed with compliant secret twice | Admin/data are created idempotently without duplicates. |
| DB-024 | Seed- | P0 | Run seed outside development or with weak/missing secret | Seed refuses to execute. |
| DB-025 | Retention | P1 | Exercise approved retention/anonymization process | Only eligible data changes; consent/audit/legal records follow policy. |

## 10. Accessibility, UX and compatibility cases

| ID | Type | Pri | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| AX-001 | Keyboard | P1 | Traverse every public/student/admin control using Tab/Shift+Tab | Logical order, visible focus, no unreachable control. |
| AX-002 | Keyboard | P1 | Open mobile menu, use Tab loop, Escape and close action | Focus is contained while open and returned to trigger on close. |
| AX-003 | Keyboard | P1 | Use skip link | Focus moves to main content. |
| AX-004 | Screen reader | P1 | Navigate titles, landmarks, headings, links, buttons and tables | Correct names/roles/states and meaningful sequence. |
| AX-005 | Forms | P1 | Inspect all form controls | Programmatic label, name, autocomplete, instructions and error association exist. |
| AX-006 | Live regions | P1 | Trigger loading, success and validation/API errors | Important state changes are announced once. |
| AX-007 | Modal | P1 | Open/close every admin dialog | Focus enters, remains trapped, Escape works, and focus returns. |
| AX-008 | Visual | P1 | Check text/control/focus contrast | WCAG 2.2 AA contrast met. |
| AX-009 | Reflow | P1 | 320px viewport and 200%/400% zoom | No lost content/function or two-dimensional scrolling except data tables. |
| AX-010 | Motion | P1 | Enable reduced motion | Animations/transitions become effectively instantaneous without lost state. |
| AX-011 | Touch | P2 | Use coarse pointer/mobile | Important targets are at least 44px and not gesture-only. |
| AX-012 | Automation | P1 | Run axe on every route/state | No critical or serious violations; exceptions documented. |
| COMP-001 | Browser | P1 | Latest Chrome, Firefox, Safari and Edge desktop | Core journeys and layout pass. |
| COMP-002 | Mobile | P1 | iPhone Safari and Android Chrome | Registration, sign-in, request and dashboard journeys pass. |
| COMP-003 | Device | P2 | Tablet portrait/landscape and rotation | Responsive navigation/forms/tables remain usable. |
| COMP-004 | Network | P1 | Slow 3G, offline mid-submit and reconnect | Loading/timeout/retry behavior prevents duplicate mutation. |

## 11. Performance, reliability and operational cases

| ID | Type | Pri | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| PERF-001 | Lighthouse | P1 | Public routes on mobile/desktop production build | Agreed LCP, CLS, INP, accessibility, SEO and best-practice budgets met. |
| PERF-002 | API load | P0 | Expected and 2x peak read/write traffic | Error rate and p95/p99 latency within SLA; DB pool stable. |
| PERF-003 | Spike | P0 | Sudden login/class-list/request burst | Throttling protects service; recovery is automatic. |
| PERF-004 | Soak | P1 | Sustained traffic for several hours | No memory/connection growth, stalled jobs or log-volume failure. |
| PERF-005 | Concurrency | P0 | 25+ clients race for last seat/review | Capacity and idempotency invariants hold. |
| PERF-006 | Assets | P2 | Inspect JS bundles, fonts and images | No unintended large bundle; fonts local; images sized/cached appropriately. |
| REL-001 | Restart | P0 | Restart backend during reads and mutations | In-flight failure is safe; committed state consistent; clients recover. |
| REL-002 | Cold start | P1 | Frontend/backend cold start | Health remains unavailable until dependencies ready, then becomes healthy within SLA. |
| REL-003 | DB outage | P0 | Stop database then restore | 503/safe errors, no corruption, pool reconnects, alerts fire. |
| REL-004 | SMTP outage | P1 | Provider unavailable/slow | Requests time out safely; account/business transaction follows defined policy. |
| REL-005 | Disk/log pressure | P1 | Logging destination unavailable/full | Application behavior and alerting follow runbook without leaking data. |
| REL-006 | Rollback | P0 | Deploy bad release then restore previous artifacts | Service and compatible schema recover within RTO; smoke suite passes. |
| OPS-001 | Health | P0 | Probe frontend `/health` and backend `/api/health` | Render removes unhealthy instance and never reports DB outage as healthy. |
| OPS-002 | Alerting | P0 | Simulate 5xx, latency, login abuse and verification failure | Correct alert reaches named owner without sensitive payload. |
| OPS-003 | Observability | P1 | Trace frontend error through API/logs | Correlation ID enables investigation across services. |

## 12. SEO, privacy and content cases

| ID | Type | Pri | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| SEO-001 | Positive | P1 | Inspect canonical metadata, OG/Twitter, icon and manifest | Correct HTTPS production URLs and assets. |
| SEO-002 | Negative | P0 | Inspect robots/sitemap | Admin, dashboard, auth, booking/pass and reset routes are excluded. |
| SEO-003 | Positive | P2 | Validate sitemap/robots in webmaster tools | Syntax valid and only public canonical routes included. |
| PRIV-001 | Privacy | P0 | Inspect browser network/storage/logging | No JWT, refresh token, password, health data or unnecessary PII exposed. |
| PRIV-002 | Consent | P0 | Compare displayed policy/waiver versions with DB record | Exact approved version and timestamp match. |
| PRIV-003 | Consent | P0 | Change policy version | New registrations record new version; historical acceptance remains unchanged. |
| PRIV-004 | Content | P1 | Verify real studio/contact/instructor/schedule/pass data | No placeholders, sample accounts, test reviews or incorrect prices remain. |
| PRIV-005 | No-payment | P0 | Search UI, API payloads, environment and logs | No card, gateway, bank proof, screenshot or online-payment collection remains. |

## 13. Minimum release regression suite

The release cannot proceed unless all P0 cases and the following smoke path pass on the exact release commit:

1. Apply migrations to a production-like restored database.
2. Verify backend `/api/health`, frontend `/health`, headers, robots, sitemap and custom 404.
3. Register adult and minor accounts; test login, refresh, logout and password reset.
4. Submit class and pass requests; verify no payment/proof fields or client price authority.
5. Approve and reject requests; verify access, receipts, capacity, duplicates and idempotency.
6. Record attendance, consume a pass, create/use a makeup credit, and verify history.
7. Exercise admin role matrix, CRUD, CMS publish, contact reply, testimonial moderation and newsletter.
8. Run concurrency tests for final seat, duplicate attendance and request review.
9. Complete keyboard, 320px, 200% zoom, screen-reader and supported-browser smoke tests.
10. Trigger alerts, restore backup, and execute rollback rehearsal.

## 14. Entry and exit criteria

### Entry

- Exact frontend/backend release SHAs recorded and deployed to staging.
- Production-like environment, migrations, sanitized dataset and all roles available.
- SMTP/storage substitutes or controlled production-like providers configured.
- Test tools, monitoring and cleanup scripts operational.

### Exit

- 100% P0 and agreed P1 cases executed; all P0 pass.
- No open critical/high security findings or entitlement/data-integrity defects.
- Builds, lint, unit/integration/E2E suites and production dependency audits pass.
- Performance, accessibility, browser, backup/restore, monitoring and rollback evidence attached.
- Legal, technical and business owners approve the exact release.

## 15. Test execution record template

| Field | Value |
| --- | --- |
| Test case ID | |
| Build/commit | |
| Environment | |
| Tester/date | |
| Persona/data IDs | |
| Result | Pass / Fail / Blocked / Not run |
| Actual result | |
| Request/correlation ID | |
| Evidence link | |
| Defect ID/severity | |
| Retest result | |

## 16. Automation and execution coverage plan

The catalogue is sufficient for release planning only when the following automation and manual evidence are present. Documentation alone is not a passed test.

| Suite | Required implementation | Mandatory trigger | Pass requirement |
| --- | --- | --- | --- |
| Frontend unit | Existing rule tests plus validation/CMS/API-error tests | Every pull request | 100% pass |
| Backend unit | Services, guards, middleware, DTO and transaction rules | Every pull request | 100% pass |
| API integration | Supertest against disposable PostgreSQL | Every pull request and release | All P0 API cases pass |
| Browser E2E | Playwright student/admin workflows | Every release candidate | All minimum regression journeys pass |
| Database | Migration, constraints, concurrency, backup/restore | Every release candidate; restore quarterly | All DB P0 cases pass |
| Security | Dependency audit, ZAP baseline, manual auth/CSRF/IDOR | Every release candidate | No unresolved critical/high finding |
| Accessibility | axe automation plus keyboard/screen-reader manual run | Every release candidate | No critical/serious issue; P1 manual cases pass |
| Performance | Lighthouse and k6 baseline/load/concurrency | Before launch and material capacity change | Agreed budgets/SLA pass |
| Compatibility | Supported desktop/mobile matrix | Every release candidate | Core P0/P1 journeys pass |
| Operations | Health, alert, backup/restore and rollback rehearsal | Before launch; scheduled thereafter | Evidence reviewed by owner |

### 16.1 Current automation inventory

At document creation the repository contains five frontend rule test files and fourteen backend Jest suites. These are useful foundations but do **not** by themselves execute all catalogue cases. The release report must state exact counts from CI rather than copying these baseline numbers.

Automation implementation priority:

1. P0 cookie/session, CSRF, authorization and ownership API integration tests.
2. P0 manual class/pass request, approval, rejection, idempotency and concurrency tests.
3. P0 attendance, pass consumption and makeup-credit transaction tests.
4. Playwright adult/minor registration, session lifecycle, student request and admin review journeys.
5. Migration/restore, accessibility, security, performance and operational suites.

## 17. Release test summary and sign-off dashboard

Complete this table for the exact candidate commit. Blank or **Not run** P0 fields mean the release is not approved.

| Metric | Required | Actual |
| --- | --- | --- |
| Frontend commit SHA | Recorded | |
| Backend commit SHA | Recorded | |
| Test environment/version | Production-like and recorded | |
| Total catalogue cases | 189 | 189 |
| P0 executed | 100% | |
| P0 passed | 100% | |
| P1 executed | 100% unless risk accepted | |
| Open critical/high defects | 0 | |
| Open entitlement/data-integrity defects | 0 | |
| Automated suite result | All pass | |
| Supported-browser result | All core journeys pass | |
| Accessibility result | No critical/serious issue | |
| Security result | No unresolved critical/high finding | |
| Load/concurrency result | Meets agreed SLA/invariants | |
| Migration and restore result | Pass | |
| Monitoring and rollback rehearsal | Pass | |
| Legal/business prerequisites | Approved separately | |

### Sign-off

| Responsibility | Name | Decision | Date | Evidence/reference |
| --- | --- | --- | --- | --- |
| QA lead | | Approve / Reject | | |
| Engineering lead | | Approve / Reject | | |
| Security reviewer | | Approve / Reject | | |
| Operations owner | | Approve / Reject | | |
| Product/business owner | | Approve / Reject | | |
| Legal reviewer | | Approve / Reject | | |

The final release decision is **GO** only when all mandatory fields meet their required value and every approver signs the exact tested release. Otherwise the decision is **NO-GO**.
