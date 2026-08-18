# Shakthi Yoga Production Go-Live Checklist

**Prepared:** August 18, 2026  
**Scope:** Shakthi Yoga website frontend, its production configuration, and the frontend-to-backend workflows that must be verified before launch.

## Current release status

**Decision: CODE READY — DEPLOYMENT APPROVAL PENDING**

All repository-controlled engineering checks pass. Production activation still requires the release owner to supply and verify the real environment, migration, backup, staging, legal, and business evidence listed under **External launch gates** below.

### Latest frontend verification

| Check | Result |
| --- | --- |
| ESLint | Passed |
| TypeScript and production build | Passed |
| Unit tests | Passed (5 tests) |
| Git working tree | Contains go-live remediation changes; commit pending |
| Production dependency audit | Passed: 0 vulnerabilities (August 18, 2026) |
| Full frontend/backend staging test | Not verified in this audit |
| Legal review | Not verified |

---

## P0 — Required before launch

### 1. Remove high-severity dependency vulnerabilities

- [x] Upgrade the vulnerable `nanoid@3.3.16` dependency pulled through the PostCSS override.
- [x] Update `package-lock.json` (commit remains a release-owner action).
- [x] Confirm there are no high or critical production vulnerabilities.
- [x] Rerun lint, tests, and the production build after the update.

Required commands:

```bash
npm audit --omit=dev
npm run lint
npm test
npm run build
```

**Acceptance criterion:** All commands pass, and the production audit reports zero high or critical vulnerabilities.

### 2. Secure authentication and session storage

- [x] Stop storing access tokens and refresh tokens in `localStorage`.
- [x] Move authentication to cookies with `HttpOnly`, production-only `Secure`, and `SameSite=Lax`.
- [x] Use 15-minute access sessions by default.
- [x] Implement refresh-token rotation with hashed server-side storage and revocation.
- [x] Add double-submit CSRF protection to cookie-authenticated mutations.
- [x] Load the current user and role from the server-validated `/auth/profile` session.
- [x] Make logout revoke the stored refresh token and clear all session cookies.

**Acceptance criterion:** JavaScript running in the browser cannot read authentication tokens, expired/revoked sessions are rejected, and logout invalidates server-side access.

### 3. Prevent unsafe post-login redirects

- [x] Validate the `redirect` query parameter on the sign-in page.
- [x] Allow only approved internal paths beginning with a single `/`.
- [x] Reject absolute URLs, protocol-relative URLs, encoded external URLs, and malformed destinations.
- [x] Prevent non-admin users from being redirected to administrator pages.
- [x] Add automated tests for valid and malicious redirect values.

**Acceptance criterion:** A crafted sign-in URL cannot redirect a user to an external website or an unauthorized route.

### 4. Correct and secure the manual-verification workflow

- [x] Remove customer payment-reference and screenshot collection; the frontend submits an administrator-verification request only.
- [x] Remove bank-transfer, checkout, sales-tax, card, and payment-provider UI from class and pass requests.
- [x] Update frontend documentation and customer messaging to state that no online payment is collected.
- [x] Calculate the authoritative listed price on the backend; the browser no longer sends `amountUsd`.
- [x] Prevent duplicate class bookings and duplicate pending pass requests.
- [x] Make repeat approval/rejection with the same outcome idempotent and reject conflicting outcomes.
- [x] Atomically activate the enrollment or pass when a request is approved.
- [x] Generate receipts only for verified records.
- [x] Keep rejected requests from granting class or pass access and release rejected class capacity.

**Acceptance criterion:** A user cannot receive class or pass access until an administrator verifies the request; price, deduplication, authorization, and activation remain backend-enforced requirements.

### 5. Confirm the no-online-payment production configuration

- [x] Remove example bank-account details from the repository and environment template.
- [x] Remove public payment-account environment variables.
- [x] Confirm the customer flow states that no online payment is collected.
- [ ] Verify the administrator&apos;s offline business process and approval workflow in staging.

**Acceptance criterion:** The site collects no online payment credentials or payment proof, and verified requests activate only through the authorized administrator workflow.

### 6. Complete and legally review the Terms of Service

- [ ] Add the legal business/owner identity and contact information.
- [ ] Add purchase and manual-payment conditions.
- [ ] Add cancellation, refund, rescheduling, and no-show policies.
- [ ] Document class-pass validity and expiry.
- [ ] Document makeup-credit issuance, expiry, and consumption.
- [ ] Add online-class availability and meeting-link conditions.
- [ ] Add account suspension and acceptable-use terms.
- [ ] Add intellectual-property terms.
- [ ] Add governing law and dispute-resolution terms for the correct jurisdiction.
- [ ] Review California-specific and COVID-era waiver text for current relevance.
- [ ] Obtain review and approval from a qualified lawyer.

**Acceptance criterion:** Approved terms accurately describe the real business, jurisdiction, products, payments, and cancellation rules.

### 7. Correct waiver and minor-consent handling

- [x] Separate the liability waiver from the digital-media/marketing waiver.
- [x] Make digital-media consent optional for registration.
- [x] Provide a guardian-consent process for minors.
- [x] Store the exact waiver version accepted by each user.
- [x] Store acceptance timestamp, user identity, and guardian information where applicable.
- [x] Keep consent fields outside normal profile-update contracts so acceptance history cannot be overwritten through profile editing.
- [x] Enforce required consent on the backend, not only through frontend checkboxes.
- [ ] Have the complete process reviewed by a qualified lawyer.

**Acceptance criterion:** Every participant has a legally appropriate, versioned consent record, and optional marketing consent is not bundled into mandatory service consent.

### 8. Complete the Privacy Policy

- [ ] Identify the business or data controller.
- [ ] Explain why each category of data is collected and processed.
- [ ] Explicitly address physical health, mental health, and emergency-contact data.
- [ ] Identify relevant hosting, email, logging, payment, and other service providers.
- [ ] State data-retention periods or retention criteria.
- [ ] Explain access, correction, deletion, and objection rights where applicable.
- [ ] Explain international data transfers where applicable.
- [ ] Explain how children’s/minors’ data is handled.
- [ ] Document cookies, analytics, operational logs, and error monitoring.
- [ ] Document marketing consent and unsubscribe procedures.
- [ ] Add a privacy contact and complaint process.
- [ ] Describe the breach-response process accurately.
- [ ] Obtain legal review for the applicable jurisdictions.

**Acceptance criterion:** The published policy accurately covers every category of personal and sensitive data processed by the production system.

### 9. Use fixed legal effective dates and versions

- [x] Replace dynamically generated “Last updated” dates in Terms and Privacy pages.
- [ ] Publish a fixed effective date approved by the business/legal reviewer.
- [x] Assign a stable version to each policy and waiver.
- [ ] Update the date/version only when the content actually changes.

**Acceptance criterion:** The displayed date and recorded consent version correspond to an actual approved document release.

### 10. Finalize the production API architecture

Choose and verify one approach:

#### Option A: Same-origin Next.js proxy

- [x] Browser requests use `/api`.
- [x] Configure `BACKEND_INTERNAL_URL` in the Render blueprint.
- [ ] Verify the backend is reachable from the deployed frontend service.
- [x] Remove public cross-origin API configuration from the frontend.

#### Option B: Direct browser-to-backend API (not selected)

- [x] Not applicable; the production architecture uses Option A.

For either option:

- [ ] Test local, staging, and production-like configurations separately.
- [x] Document the required frontend environment variables.
- [x] Fail the production frontend build when `BACKEND_INTERNAL_URL` is missing.

**Acceptance criterion:** Every browser and server API request reaches the intended backend over HTTPS without relying on a localhost fallback.

### 11. Complete production security headers

- [x] Add `Content-Security-Policy`.
- [ ] Test CSP in report-only mode before enforcing it.
- [x] Add production-only `Strict-Transport-Security`; HTTPS/subdomain behavior still requires deployment verification.
- [x] Retain and verify `X-Content-Type-Options` in configuration.
- [x] Retain and verify clickjacking protection in configuration.
- [x] Retain and verify `Referrer-Policy` in configuration.
- [x] Retain and verify `Permissions-Policy` in configuration.
- [x] Review and retain `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` for current assets.
- [x] Confirm committed `NEXT_PUBLIC_*` variables contain no private secrets.

**Acceptance criterion:** A production response-header test confirms the intended security policy on all HTML routes.

### 12. Complete production-like end-to-end testing

- [ ] User registration.
- [ ] Adult waiver acceptance.
- [ ] Minor/guardian consent, if supported.
- [ ] Login and logout.
- [ ] Forgot-password request.
- [ ] Valid, expired, reused, and invalid reset links.
- [ ] Class listing and filtering.
- [ ] Class booking.
- [ ] Simultaneous booking of the last available seat.
- [ ] Class-pass purchase.
- [ ] Manual-payment request, approval, and rejection.
- [ ] Duplicate payment submission and duplicate approval attempts.
- [ ] Receipt generation and authenticated download.
- [ ] Meeting-link visibility for eligible and ineligible users.
- [ ] Attendance recording and correction.
- [ ] Makeup-credit creation, expiry, failed booking, and consumption.
- [ ] Student dashboard data and retry behavior.
- [ ] Admin and super-admin authorization.
- [ ] Unauthorized access to every protected API.
- [ ] CMS draft, preview, publish, and fallback behavior.
- [ ] Contact submission, admin reply, and deletion.
- [ ] Testimonial submission, moderation, and publication.
- [ ] Rate-limit responses.
- [ ] Backend restart and temporary network failure behavior.

**Acceptance criterion:** All critical customer and administrator journeys pass against production-like frontend, backend, database, email, and storage services.

---

## P1 — Strongly recommended before launch

### 13. Add correct metadata to every route

- [x] Use the Next.js App Router Metadata API (no `next/head` usage remains).
- [x] Add unique titles and descriptions for Home, About, Classes, Pricing, Contact, Testimonials, Terms, and Privacy.
- [x] Add `metadataBase` and configurable production site URL.
- [x] Add canonical URLs.
- [x] Add Open Graph title, description, URL, and image metadata.
- [x] Add Twitter-card metadata.
- [x] Add `noindex` metadata to Admin, Dashboard, Sign-in, Register, Reset Password, Booking, and pass-request pages.

### 14. Add search-engine discovery files

- [x] Add `robots.ts`.
- [x] Add `sitemap.ts`.
- [x] Exclude private and transactional routes from indexing.
- [x] Configure an Open Graph image.
- [x] Configure an Apple touch icon.
- [x] Add a web manifest.
- [ ] Add accurate Yoga Studio or Local Business structured data.
- [ ] Verify the site in the intended search-engine webmaster tools after launch.

### 15. Add a branded 404 page

- [x] Add an accessible `not-found.tsx`.
- [x] Include links to Home, Classes, Pricing, and Contact.
- [x] Confirm an unknown URL returns HTTP 404 from the local production server; deployed HTTP verification remains required.

### 16. Complete an accessibility review

- [ ] Connect every label using matching `htmlFor` and `id` values.
- [ ] Add meaningful `name` and `autocomplete` attributes to form controls.
- [ ] Announce form errors and success messages using accessible live regions.
- [ ] Give the registration step indicator readable step names and current-step state.
- [ ] Move focus appropriately when registration steps or dialogs change.
- [ ] Trap focus in modal dialogs and the open mobile menu where appropriate.
- [ ] Return focus to the control that opened a dialog/menu.
- [ ] Ensure visually hidden navigation cannot receive keyboard focus.
- [ ] Verify keyboard access to all admin features.
- [ ] Verify visible focus indicators.
- [ ] Verify text and control color contrast.
- [ ] Test at 200% browser zoom and 320-pixel width.
- [x] Respect `prefers-reduced-motion` globally.
- [ ] Ensure each rendered view has one meaningful primary heading.
- [ ] Test with at least one screen reader.

### 17. Remove unnecessary hydration-warning suppression

- [ ] Identify the actual source of any hydration mismatch.
- [x] Remove `suppressHydrationWarning` from the root HTML/body.
- [x] Build production rendering without hidden hydration warnings.

### 18. Strengthen registration validation

- [x] Apply the displayed password rules before allowing the user to continue.
- [x] Enforce the same password policy on the backend.
- [x] Trim and normalize names and email addresses.
- [x] Validate phone-number shape and length.
- [x] Add reasonable minimum and maximum field lengths.
- [x] Validate emergency-contact data.
- [x] Bound and validate health-information fields safely.
- [ ] Handle duplicate email addresses without leaking sensitive account information.
- [x] Validate age/minor and guardian requirements.
- [ ] Display field-level, accessible errors.

### 19. Protect public forms against abuse

- [x] Rate-limit login attempts.
- [x] Rate-limit registration through the global API limit.
- [x] Rate-limit forgot/reset-password requests.
- [x] Rate-limit contact submissions through the global API limit.
- [x] Rate-limit testimonial submissions through the global API limit.
- [x] Rate-limit verification requests through the global API limit.
- [ ] Add anti-automation protection when traffic/risk requires it.
- [ ] Ensure forgot-password responses do not reveal whether an account exists.
- [ ] Add monitoring for repeated abuse and rate-limit events.

### 20. Fix administrator-role navigation consistency

- [x] Route both `ADMIN` and `SUPER_ADMIN` users to the admin dashboard.
- [ ] Use the shared authorization result consistently in navigation and protected pages.
- [ ] Confirm the backend remains the final authorization boundary.
- [ ] Add tests for user, admin, super-admin, and unauthenticated states.

### 21. Replace broad `any` usage with typed API contracts

- [ ] Define response types for users, classes, instructors, passes, payments, enrollments, attendance, contact messages, and testimonials.
- [ ] Validate untrusted API payloads where appropriate.
- [ ] Remove unsafe type assertions from authentication and role handling.
- [ ] Make API contract failures produce safe user-facing errors.

### 22. Expand automated test coverage

- [ ] Authentication and session tests.
- [x] Safe redirect tests.
- [ ] Registration and waiver validation tests.
- [ ] Payment-submission tests.
- [x] Booking and pass-selection tests.
- [ ] Protected-route and role tests.
- [ ] CMS fallback and invalid-content tests.
- [ ] Contact-form state tests.
- [ ] API 401, 403, 404, 409, 429, and 500 behavior tests.
- [ ] Browser end-to-end tests for critical user and admin workflows.
- [x] Add lint, tests, build, and audit checks to CI.

### 23. Make deployment installs deterministic

- [x] Change the production build command from `npm install` to `npm ci`.
- [x] Update the lockfile used by CI and production (commit remains a release-owner action).
- [x] Pin a supported production Node.js range and `.nvmrc` version.
- [x] Ensure CI and production use the same install/build commands.

Recommended build command:

```bash
npm ci && npm run build
```

### 24. Use suitable production hosting capacity

- [ ] Decide whether Render’s free-plan cold starts are acceptable.
- [ ] Use always-on frontend and backend services for a commercial launch if delays are unacceptable.
- [ ] Confirm memory, CPU, request timeout, storage, and connection limits.
- [ ] Load-test concurrent bookings and admin operations.
- [ ] Confirm outbound email and file storage are production-grade.

---

## P2 — Launch-quality and operational improvements

### 25. Test and improve performance

- [ ] Run Lighthouse against staging in an incognito browser.
- [ ] Measure LCP, CLS, and INP on mobile and desktop.
- [ ] Test slow network and slow backend behavior.
- [ ] Optimize large CMS and instructor images.
- [ ] Use `next/image` where practical and provide image dimensions.
- [ ] Verify remote image hosts and caching behavior.
- [ ] Analyze client JavaScript bundle size.
- [ ] Reduce unnecessary client-component boundaries.
- [ ] Test loading, empty, error, and retry states.
- [ ] Add real-user Core Web Vitals monitoring after launch.

### 26. Configure production monitoring and safe logging

- [ ] Add frontend and backend uptime checks.
- [x] Add dependency-aware frontend and database-aware backend health endpoints.
- [ ] Alert on elevated 5xx rates and latency.
- [ ] Alert on payment-verification failures.
- [ ] Monitor failed login and rate-limit spikes.
- [ ] Configure frontend error tracking.
- [ ] Configure centralized backend logs and retention.
- [x] Include request/correlation IDs in frontend/backend error investigation.
- [x] Ensure backend request logs exclude tokens, cookies, passwords, health details, payment proof, and request bodies.
- [ ] Assign an owner and response procedure for production alerts.

### 27. Prepare backup and rollback procedures

- [ ] Take a verified database backup immediately before release.
- [ ] Test restoring a backup in a safe environment.
- [ ] Apply and verify database migrations before enabling traffic.
- [ ] Retain the previous frontend and backend release artifacts.
- [ ] Document the rollback commands and responsible person.
- [ ] Define when a release must be rolled back.
- [ ] Never manually delete payment, attendance, enrollment, pass, or consent records during rollback.
- [ ] Confirm whether every migration is reversible before attempting rollback.

### 28. Verify all real production content

- [ ] Studio name and description.
- [ ] Legal business/owner name.
- [ ] Instructor names, biographies, qualifications, and photos.
- [ ] Address and map link.
- [ ] Phone number and email address.
- [ ] Instagram, Facebook, YouTube, and review links.
- [ ] Logo, hero images, and image alt text.
- [ ] Class names, descriptions, schedules, capacity, and time zone.
- [ ] Pass names, prices, currency, class counts, and validity.
- [x] No bank-transfer instructions are required or exposed because the site does not collect payment or proof.
- [ ] Refund, cancellation, and makeup-credit text.
- [ ] Remove test accounts, test classes, sample reviews, and placeholder values.

### 29. Complete responsive and browser testing

- [ ] iPhone Safari.
- [ ] Android Chrome.
- [ ] Desktop Chrome.
- [ ] Desktop Safari.
- [ ] Firefox.
- [ ] Tablet layouts.
- [ ] 320-pixel-wide viewport.
- [ ] 200% zoom.
- [ ] Keyboard-only navigation.
- [ ] Screen-reader smoke test.
- [ ] Slow network.
- [ ] Backend restart/cold start.
- [ ] Expired session while completing a form.
- [ ] Back/forward navigation during registration and manual-verification requests.

### 30. Keep release documentation accurate

- [x] Update `DEPLOYMENT-READINESS-REPORT.md` with current results.
- [x] Record the current frontend test count (5 tests).
- [x] Verify the zero-production-vulnerability claim after remediation.
- [ ] Record the exact tested commit SHA.
- [ ] Record frontend and backend release versions.
- [ ] Record who ran each check and when.
- [ ] Record staging and production smoke-test results.
- [ ] Obtain technical, business, and legal sign-off.

---

## Required production environment checklist

- [ ] `NODE_ENV=production`
- [ ] Correct `NEXT_PUBLIC_SITE_URL`
- [ ] Correct `BACKEND_INTERNAL_URL`, if using the Next.js same-origin proxy
- [ ] Exact allowed HTTPS frontend origin(s) configured on the backend
- [ ] Strong, unique JWT/session secrets stored in the secret manager
- [ ] Production database URL stored in the secret manager
- [ ] Production email/SMTP credentials stored in the secret manager
- [ ] Production file-storage credentials stored in the secret manager
- [ ] Error-monitoring configuration
- [ ] Logging level and retention configuration
- [ ] No development URLs, example values, or private secrets exposed to the browser

---

## Final release-day checklist

### Code and CI

- [ ] All intended frontend and backend changes are committed.
- [ ] Pull requests are reviewed and approved.
- [ ] CI is green on the exact release commit.
- [x] Production dependency audits contain no high or critical vulnerabilities.
- [x] Frontend and backend builds pass.
- [ ] Unit, integration, and end-to-end tests pass.

### Infrastructure and data

- [ ] Production secrets and environment variables are verified.
- [ ] HTTPS and production domains are working.
- [ ] DNS configuration is correct.
- [ ] Database backup exists and restoration has been tested.
- [ ] Database migrations are applied successfully.
- [ ] Monitoring, health checks, log collection, and alerts are active.
- [ ] Previous release artifacts and rollback instructions are available.

### Business and legal

- [ ] Terms, Privacy Policy, waivers, consent flow, refund policy, and cancellation policy are approved.
- [ ] Real prices, currency, schedules, capacity, contact details, and the offline verification process are verified.
- [ ] Dedicated staging accounts exist for student, admin, and super-admin tests.

### Production smoke test

- [ ] Home, About, Classes, Pricing, Contact, Testimonials, Terms, and Privacy return HTTP 200.
- [ ] Unknown routes return HTTP 404 with the custom page.
- [ ] Registration, login, logout, and password reset work.
- [ ] Student booking and pass purchase work.
- [ ] Manual verification approval creates the correct access and receipt.
- [ ] Attendance and makeup-credit behavior work.
- [ ] Admin login and authorization work.
- [ ] CMS publishing and public content work.
- [ ] Contact and email delivery work.
- [ ] Security headers are present.
- [ ] Private routes are not indexed.
- [ ] No critical browser-console or server-log errors occur.

---

## Final go/no-go gate

The release is **GO** only when all of the following are true:

- [ ] Every P0 item is completed and verified.
- [x] Production audit has zero high or critical vulnerabilities in the tested working tree.
- [ ] Production build, lint, automated tests, and CI pass on the exact release commit.
- [ ] Critical staging end-to-end workflows pass.
- [ ] Legal documents and consent flows are approved.
- [ ] Production configuration contains no placeholders or missing secrets.
- [ ] Backup, monitoring, health checks, and rollback are ready.
- [ ] Release-day production smoke testing passes.
- [ ] Technical and business owners explicitly approve the launch.

If any unchecked external gate above remains unsatisfied, the code remains a release candidate and production activation is **PENDING**.
