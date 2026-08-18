# Shakthi Yoga Website Monitoring and Student Data Backup Runbook

**Prepared:** August 18, 2026  
**Purpose:** Define how Shakthi Yoga monitors the live website and safely backs up, restores, exports, and protects student data.

> This runbook must be updated with the real hosting provider, database engine, region, storage bucket, alert contacts, and commands before launch. Never place production passwords, tokens, private keys, database URLs, or student exports in this repository.

## 1. Ownership and emergency contacts

Complete this table before launch:

| Responsibility | Primary owner | Backup owner | Contact method |
| --- | --- | --- | --- |
| Website availability | `[name]` | `[name]` | `[phone/email]` |
| Backend/API | `[name]` | `[name]` | `[phone/email]` |
| Database and backups | `[name]` | `[name]` | `[phone/email]` |
| Payments | `[name]` | `[name]` | `[phone/email]` |
| Privacy/data incidents | `[name]` | `[name]` | `[phone/email]` |
| Customer communication | `[name]` | `[name]` | `[phone/email]` |

- [ ] At least two people can access the hosting, database, DNS, storage, email, and monitoring accounts.
- [ ] Every administrator uses an individual account—never a shared password.
- [ ] Multi-factor authentication is enabled for all production accounts.
- [ ] Recovery codes are stored in an approved password manager.
- [ ] Former staff access is removed immediately.
- [ ] Emergency contacts are reviewed every three months.

## 2. Define recovery targets

Set and approve these targets before launch:

| Target | Recommended starting value | Approved value |
| --- | --- | --- |
| Website uptime objective | 99.9% monthly | `[value]` |
| Recovery Point Objective (maximum acceptable data loss) | 15 minutes | `[value]` |
| Recovery Time Objective (maximum acceptable outage) | 2 hours | `[value]` |
| Backup retention | 35 daily, 12 monthly, 7 yearly | `[value]` |
| Critical alert acknowledgement | 15 minutes | `[value]` |
| High alert acknowledgement | 1 hour | `[value]` |

The database backup schedule must be frequent enough to satisfy the approved Recovery Point Objective (RPO). The restore process must be fast enough to satisfy the Recovery Time Objective (RTO).

## 3. What must be monitored

### 3.1 Public website availability

Monitor from at least two external regions every 1–5 minutes:

- [ ] Home page returns HTTP 200.
- [ ] Classes page returns HTTP 200.
- [ ] Pricing page returns HTTP 200.
- [ ] Contact page returns HTTP 200.
- [ ] Sign-in page returns HTTP 200.
- [ ] HTTPS certificate is valid and not close to expiry.
- [ ] DNS resolves to the expected service.
- [ ] Response contains a stable page marker, not only a 200 status.
- [ ] Response time is below the approved threshold.

Recommended alert thresholds:

- Critical: two or more consecutive failures from multiple monitoring regions.
- High: p95 page response time above 3 seconds for 10 minutes.
- Warning: TLS certificate expires in fewer than 30 days.
- Critical: TLS certificate expires in fewer than 7 days or is invalid.

### 3.2 Backend and API health

Create a lightweight `/health` endpoint that verifies the application process without exposing private information. Create a protected or internal readiness check that confirms critical dependencies.

Monitor:

- [ ] API process is running.
- [ ] Database connectivity.
- [ ] Database migration/schema status.
- [ ] Email provider connectivity or recent delivery success.
- [ ] File/payment-proof storage connectivity.
- [ ] API response latency: p50, p95, and p99.
- [ ] HTTP 4xx, 429, and 5xx rates.
- [ ] Request volume.
- [ ] Database connection-pool usage.
- [ ] CPU, memory, disk, and restart count.
- [ ] Background jobs and scheduled tasks.

The public health response must not reveal versions, database names, credentials, internal hosts, stack traces, or student data.

### 3.3 Critical business-journey monitoring

Run safe synthetic checks using dedicated test accounts—not real student accounts:

- [ ] Registration page can submit to a safe staging/test environment.
- [ ] Login succeeds for a monitoring account.
- [ ] Classes load from the API.
- [ ] Pass options load from the API.
- [ ] Contact submission works without sending excessive messages.
- [ ] Password-reset email is delivered in staging or a controlled mailbox.
- [ ] Payment requests can be created and reviewed in staging.
- [ ] Receipt generation works in staging.

Do not run automated production checks that create real payments, consume class capacity, send messages to students, or alter attendance unless the test data is clearly isolated and automatically cleaned up safely.

### 3.4 Authentication and security monitoring

Alert on:

- [ ] Large increases in failed logins.
- [ ] Repeated login attempts against many accounts.
- [ ] Repeated password-reset requests.
- [ ] Unusual admin login locations or devices, where legally and technically appropriate.
- [ ] Administrator role changes.
- [ ] New administrator creation.
- [ ] Disabled users becoming active unexpectedly.
- [ ] High rates of HTTP 401, 403, or 429 responses.
- [ ] CSP violations after Content Security Policy is enabled.
- [ ] Unauthorized access attempts to admin and payment-proof endpoints.
- [ ] Changes to production secrets, environment variables, DNS, or deployment settings.

### 3.5 Payment and booking monitoring

Track counts and failure rates without placing bank information or evidence in logs:

- [ ] Pending manual payments by age.
- [ ] Payment approval/rejection failures.
- [ ] Duplicate payment attempts.
- [ ] Receipt-generation failures.
- [ ] Enrollment activation failures after payment approval.
- [ ] Pass activation failures after payment approval.
- [ ] Booking conflicts or capacity errors.
- [ ] Attendance update failures.
- [ ] Makeup-credit creation or consumption failures.
- [ ] Bookings with missing student, class, payment, or pass relationships.

Suggested alerts:

- High: a verified payment does not activate its related enrollment/pass immediately.
- High: receipt generation fails after verification.
- Warning: a pending payment remains unreviewed longer than the business target.
- Critical: database constraints or transactions allow duplicate approval or overbooking.

### 3.6 Email monitoring

- [ ] Password-reset delivery failures.
- [ ] Contact-reply delivery failures.
- [ ] Bounce and complaint rates.
- [ ] Email-provider quota usage.
- [ ] Domain SPF, DKIM, and DMARC configuration.
- [ ] Sudden increases in outbound volume.

Never log full reset links or reset tokens.

### 3.7 Frontend performance and browser errors

- [ ] Capture Core Web Vitals: LCP, CLS, and INP.
- [ ] Track JavaScript errors by release version and page.
- [ ] Track failed API requests by endpoint pattern and status.
- [ ] Track page-load performance by device and country/region where lawful.
- [ ] Upload source maps privately to the error-monitoring service when needed.
- [ ] Do not publish production source maps unless intentionally approved.

Error reports must exclude authorization headers, cookies, tokens, query-string secrets, form contents, health information, emergency contacts, payment evidence, and full API response bodies.

## 4. Monitoring dashboards

Create one primary operations dashboard showing:

- Website and API uptime.
- Current release versions.
- Requests per minute.
- p50, p95, and p99 latency.
- 4xx, 429, and 5xx error rates.
- Frontend JavaScript errors.
- CPU, memory, disk, restarts, and database connections.
- Recent deployments.
- Pending payments by age.
- Booking/payment/receipt failures.
- Email delivery failures.
- Latest successful database backup.
- Latest successful restore test.
- Backup age and storage usage.

Use a second security/audit dashboard for administrator actions, authentication anomalies, and production configuration changes. Restrict it to authorized staff.

## 5. Alert routing and severity

| Severity | Example | Notification | Expected response |
| --- | --- | --- | --- |
| Critical | Website down, database unavailable, data breach, payment corruption | Phone/SMS and incident channel | Acknowledge within 15 minutes |
| High | Elevated 5xx, receipt/activation failure, backup failure | Incident channel and email | Acknowledge within 1 hour |
| Warning | Slow pages, old pending payments, certificate under 30 days | Email/task system | Review within one business day |
| Information | Successful deployment or backup | Dashboard/daily digest | No immediate response |

- [ ] Alerts identify the affected service, environment, start time, and dashboard/runbook link.
- [ ] Alerts never contain passwords, tokens, bank details, health information, or student records.
- [ ] Duplicate alerts are grouped.
- [ ] Resolved notifications are sent.
- [ ] Alert delivery is tested quarterly.

## 6. Logging rules

Production logs should contain:

- Timestamp in UTC.
- Environment and service name.
- Release/commit version.
- Request/correlation ID.
- Sanitized route pattern.
- HTTP method and status.
- Duration and response size.
- Safe error type/code.

Production logs must not contain:

- Passwords or reset tokens.
- Access/refresh tokens or cookies.
- Authorization headers.
- Database URLs or secrets.
- Full request/response bodies.
- Student physical or mental health information.
- Emergency-contact details.
- Payment screenshots or bank-account details.
- Unmasked personal data unless specifically required and legally approved.

- [ ] Restrict log access by role.
- [ ] Encrypt logs in transit and at rest.
- [ ] Define a short, approved retention period.
- [ ] Record access to sensitive audit logs.
- [ ] Test log redaction with representative requests.

## 7. Student data inventory

Document every production data category and its storage location:

| Data category | Examples | Sensitivity | Backup required |
| --- | --- | --- | --- |
| Account | Name, email, phone, role, status | Personal | Yes |
| Health/profile | Physical health, mental health, experience | Highly sensitive | Yes, tightly restricted |
| Emergency contact | Name and phone | Personal data of another person | Yes, tightly restricted |
| Consent | Waiver version, acceptance, timestamp, guardian | Legal record | Yes, immutable history |
| Classes | Schedule, instructor, capacity, meeting link | Operational/confidential | Yes |
| Enrollments | Student/class relationship and status | Personal/operational | Yes |
| Attendance | Session attendance and absence | Personal/operational | Yes |
| Passes/credits | Balance, expiry, usage history | Financial/operational | Yes |
| Payments | Status, amount, reference, receipt | Financial | Yes |
| Payment proof | Screenshots/documents | Highly sensitive | Yes, encrypted separately |
| Contact messages | Name, email, message, replies | Personal | Yes or policy-based retention |
| Testimonials | Submitted text and moderation state | Personal/public | Yes |
| CMS content | Public copy, links, images | Operational | Yes |
| Audit logs | Admin and security actions | Security/legal | Yes, append-only where possible |

## 8. Backup scope

Back up all data required to rebuild the service:

- [ ] Production database.
- [ ] Payment-proof files and protected uploads.
- [ ] CMS images and instructor photos not stored in source control.
- [ ] Immutable receipts, if stored as files.
- [ ] Production configuration definitions without secret values.
- [ ] Database migration files.
- [ ] Frontend and backend release artifacts or container images.
- [ ] Critical audit logs, according to retention policy.
- [ ] DNS and infrastructure configuration exports where supported.

Do not rely on a CSV student export as the only backup. CSV cannot reliably preserve relationships, transactions, constraints, consent history, attendance history, payment state, or complete recovery metadata.

## 9. Recommended backup schedule

Use provider-managed point-in-time recovery where available, plus independent encrypted backups.

| Backup | Frequency | Recommended retention |
| --- | --- | --- |
| Database point-in-time recovery/WAL | Continuous or every 5–15 minutes | 7–35 days |
| Encrypted full database backup | Daily | 35 days |
| Encrypted weekly backup | Weekly | 12 weeks |
| Encrypted monthly archive | Monthly | 12 months |
| Encrypted yearly archive | Yearly, if legally required | 7 years or approved period |
| Protected file-storage versioning | Continuous | According to deletion/retention policy |
| Student operational export | Weekly or on demand | Short retention, not a recovery substitute |
| Pre-release/pre-migration backup | Before every production migration | Until release is verified plus approved period |

Retention must be approved against legal, tax, payment, waiver, privacy, and deletion requirements. Do not retain every category forever.

## 10. Backup security requirements

- [ ] Encrypt every backup in transit and at rest.
- [ ] Use a dedicated backup encryption key managed by a secure key-management service.
- [ ] Store backup credentials in the deployment secret manager, not source control.
- [ ] Store at least one backup copy in a separate account/project from production.
- [ ] Store at least one copy in a separate region when legally permitted.
- [ ] Enable object versioning and immutability/object lock where supported.
- [ ] Restrict delete access to a small break-glass role.
- [ ] Require MFA for backup administration.
- [ ] Log backup reads, downloads, restores, and deletions.
- [ ] Never copy production backups to personal laptops or unapproved cloud drives.
- [ ] Never email database dumps or student spreadsheets.
- [ ] Regularly rotate backup credentials and keys according to policy.

Follow a **3-2-1** strategy where practical: at least three copies, on two storage systems, with one isolated from the production account.

## 11. Automated database-backup procedure

The exact command depends on the production database. Prefer the hosting/database provider’s managed backup and point-in-time recovery features.

### Required automated workflow

1. A scheduled job authenticates using a dedicated least-privilege backup identity.
2. The job creates a transaction-consistent database backup.
3. The backup is compressed where appropriate.
4. The backup is encrypted before or during upload.
5. The encrypted artifact is uploaded to the approved backup store.
6. The workflow records size, timestamp, database version, schema/migration version, and checksum.
7. The workflow verifies that the stored checksum matches.
8. The job applies the approved retention policy.
9. A success metric is emitted.
10. Any failed, missing, zero-byte, unusually small, or stale backup raises an alert.

### Database-specific implementation notes

For PostgreSQL, use provider-managed snapshots/PITR or a compatible version of `pg_dump` for independent logical backups. For MySQL, use provider snapshots/PITR or a compatible `mysqldump`/physical backup process. Do not invent production commands until the actual database engine, version, provider, and recovery design are confirmed.

### Backup validation

- [ ] Backup artifact exists.
- [ ] Size is within an expected range.
- [ ] Checksum is valid.
- [ ] Encryption is enabled.
- [ ] Metadata contains the correct environment and timestamp.
- [ ] Backup age is below the RPO.
- [ ] A restore test has proved the artifact is usable.

## 12. Protected file backup procedure

For payment screenshots, instructor/CMS images, and generated documents:

- [ ] Store files in private object storage, not the application filesystem.
- [ ] Enable server-side encryption.
- [ ] Enable versioning.
- [ ] Replicate to a separate account or approved region where appropriate.
- [ ] Back up the database metadata that maps files to records.
- [ ] Preserve content type, size, checksum, object key, and creation date.
- [ ] Prevent public bucket/object access.
- [ ] Test that restored database records can locate restored files.
- [ ] Apply deletion and retention policy to both database rows and file versions.

## 13. Student export procedure

An operational student export is useful for authorized business continuity, but it is not a complete database backup.

### Minimum export fields

Include only fields approved for the specific purpose:

- Internal student ID.
- Name.
- Email.
- Phone.
- Account status and role.
- Emergency-contact name and phone, only when necessary.
- Experience/practice information, only when necessary.
- Active enrollments and class schedule references.
- Attendance summary or history, when required.
- Active passes, remaining classes, and expiry.
- Makeup-credit balance, expiry, and status.
- Payment ID, status, amount, and date—never full banking credentials.
- Waiver/policy version and acceptance timestamp.

Do not include passwords, password hashes, tokens, reset links, payment screenshots, encryption keys, or unnecessary health details in routine exports.

### Secure export workflow

1. An authorized admin requests an export and states its business purpose.
2. The backend re-authenticates the admin and verifies export permission.
3. The server generates the export; the browser must not assemble it from unrestricted API results.
4. The export is encrypted or delivered through a short-lived authenticated download.
5. The filename contains the environment and date but no student name.
6. The system records who requested and downloaded it, when, and why.
7. The file is stored only in an approved encrypted location.
8. The export is deleted automatically after the approved short retention period.
9. The recipient confirms deletion of temporary copies.

### CSV safety

- [ ] Prevent spreadsheet-formula injection by escaping cells beginning with `=`, `+`, `-`, or `@`.
- [ ] Use UTF-8 and a documented date/time format.
- [ ] Include the time zone for dates.
- [ ] Quote fields correctly.
- [ ] Do not embed HTML or executable content.
- [ ] Test exports containing commas, quotes, line breaks, and non-English names.

## 14. Restore procedure

Never test restoration directly over the live database.

### Restore steps

1. Declare the restore reason and obtain approval from the incident owner.
2. Identify the desired recovery timestamp and corresponding backup.
3. Record the current production release, schema version, and database version.
4. Create an isolated recovery environment with no outbound email or student notifications.
5. Restore the database and protected file storage into the isolated environment.
6. Apply only the migrations required for the restored application version.
7. Run integrity checks.
8. Start the matching frontend/backend release against the restored data.
9. Perform the validation checklist below.
10. Record restore duration and the latest recovered transaction timestamp.
11. If production replacement is required, schedule/declare maintenance and stop writes.
12. Take one final backup of the damaged/current production state for investigation.
13. Promote the validated restored environment using the approved provider procedure.
14. Re-enable traffic and run production smoke tests.
15. Monitor closely and document the incident.

### Restore validation checklist

- [ ] Database starts without corruption.
- [ ] Migration/schema version is correct.
- [ ] User count is plausible.
- [ ] Admin and student accounts exist.
- [ ] Recent known records exist up to the expected recovery time.
- [ ] Classes and instructors exist.
- [ ] Enrollments reference valid users and classes.
- [ ] Attendance references valid enrollments/sessions.
- [ ] Pass balances and credit histories reconcile.
- [ ] Payments, statuses, and receipts reconcile.
- [ ] Waiver and consent history exists.
- [ ] Payment proof and private files are accessible only when authorized.
- [ ] CMS content and images load.
- [ ] Authentication works using the correct restored application version.
- [ ] No real email or notification was sent during the test.
- [ ] RPO and RTO were measured and recorded.

## 15. Restore-test schedule

- [ ] Automatically validate backup existence and checksum every day.
- [ ] Restore the latest backup to an isolated environment every month if practical.
- [ ] Perform a documented human-reviewed restore drill at least quarterly.
- [ ] Test point-in-time recovery at least twice per year.
- [ ] Test file-storage restoration with database relationships at least twice per year.
- [ ] Test a full disaster-recovery scenario annually.
- [ ] Correct every failed drill and repeat it until it passes.

A backup is not considered reliable until it has been restored successfully.

## 16. Data integrity checks

Automate safe read-only checks after backups, restores, migrations, and deployments:

- [ ] No orphaned enrollments.
- [ ] No attendance rows without valid class/session/student relationships.
- [ ] No pass balance below zero.
- [ ] No consumed makeup credit reused for another booking.
- [ ] No verified payment without the intended enrollment/pass activation.
- [ ] No rejected or pending payment granting access.
- [ ] No duplicate immutable receipt for one payment.
- [ ] No class enrollment above capacity unless explicitly allowed.
- [ ] No active record referencing deleted required data.
- [ ] No missing waiver version for users required to accept one.

Integrity checks must alert without automatically deleting or rewriting production data.

## 17. Student data retention and deletion

Create and legally approve a retention schedule for each category:

- Account/profile information.
- Sensitive health information.
- Emergency contacts.
- Attendance and enrollment history.
- Passes and makeup credits.
- Payments and receipts.
- Payment proof.
- Waivers and guardian consent.
- Contact messages.
- Testimonials.
- Audit and security logs.
- Backups.

When honoring an approved deletion request:

- [ ] Verify the requester’s identity.
- [ ] Determine which records must be retained for legal, tax, dispute, or fraud purposes.
- [ ] Delete or anonymize eligible production data.
- [ ] Delete related private files and object versions where allowed.
- [ ] Prevent deleted data from being reintroduced during a future restore.
- [ ] Allow encrypted backups to expire through the approved retention schedule when immediate selective deletion is impractical and legally permitted.
- [ ] Record the request and completion without retaining unnecessary deleted content.

## 18. Incident response

### Availability incident

1. Acknowledge the alert.
2. Confirm whether the issue affects frontend, API, database, DNS, email, or storage.
3. Check recent deployments and provider status.
4. Pause deployments and risky admin changes.
5. Roll back the application when a recent release is the likely cause.
6. Fail over or restore only through the approved recovery procedure.
7. Publish a customer-facing status update when appropriate.
8. Record the timeline and complete a post-incident review.

### Suspected data breach

1. Notify the privacy/security incident owner immediately.
2. Preserve relevant logs and evidence.
3. Revoke compromised sessions, tokens, keys, and accounts.
4. Isolate affected systems without destroying evidence.
5. Determine the affected data categories, users, and time range.
6. Engage qualified legal/privacy advisers.
7. Follow applicable notification deadlines and requirements.
8. Communicate only confirmed facts through approved channels.
9. Remediate, monitor, and document the incident.

Do not download or circulate the full student database merely to investigate an incident.

## 19. Deployment monitoring

For every production release:

### Before deployment

- [ ] CI, tests, builds, and dependency audits pass.
- [ ] Database backup succeeds.
- [ ] Backup age and checksum are verified.
- [ ] Migration and rollback plans are reviewed.
- [ ] Monitoring is healthy before changes begin.

### During deployment

- [ ] Record the frontend and backend commit/version.
- [ ] Record the migration version.
- [ ] Watch deployment logs, health, error rates, and latency.
- [ ] Do not run unrelated production changes simultaneously.

### After deployment

- [ ] Home, classes, pricing, contact, and sign-in pages load.
- [ ] Public API calls succeed.
- [ ] Protected APIs reject unauthorized requests.
- [ ] Student login and dashboard work.
- [ ] Admin login and dashboard work.
- [ ] Booking and payment smoke tests pass.
- [ ] Error rate and latency remain normal for at least 30 minutes.
- [ ] Record the release as successful or roll it back.

## 20. Daily, weekly, monthly, and quarterly tasks

### Daily

- [ ] Review unresolved critical/high alerts.
- [ ] Confirm the latest database backup succeeded.
- [ ] Confirm backup age is within the RPO.
- [ ] Review website/API uptime and 5xx errors.
- [ ] Review failed payment/booking/receipt operations.
- [ ] Review email failures and old pending payments.

### Weekly

- [ ] Review latency, Core Web Vitals, and browser errors.
- [ ] Review admin/security events and rate-limit trends.
- [ ] Confirm protected file backup/versioning health.
- [ ] Review storage, database, email, and hosting quotas.
- [ ] Patch urgent security issues through the release process.
- [ ] Test a small sample of critical student/admin workflows.

### Monthly

- [ ] Review dependencies and production vulnerability reports.
- [ ] Restore a recent backup into an isolated environment.
- [ ] Validate student, payment, attendance, consent, and file relationships.
- [ ] Review access permissions and remove unnecessary access.
- [ ] Review costs, capacity, backup sizes, and retention jobs.
- [ ] Confirm TLS, domains, DNS, SPF, DKIM, and DMARC health.

### Quarterly

- [ ] Perform and document a full restore drill.
- [ ] Test alert routing and emergency contacts.
- [ ] Rotate applicable credentials and review recovery codes.
- [ ] Review privacy, retention, deletion, and export procedures.
- [ ] Review all administrator accounts and roles.
- [ ] Review monitoring thresholds using recent traffic.

### Annually

- [ ] Conduct a disaster-recovery exercise.
- [ ] Review RPO, RTO, and uptime objectives.
- [ ] Review legal retention requirements and policies.
- [ ] Review vendors and data-processing agreements.
- [ ] Review the incident-response plan with all owners.

## 21. Required evidence and records

Keep these records in an access-controlled operations system, not in the public repository:

- Backup job history.
- Backup checksum and size history.
- Restore drill reports.
- Measured RPO and RTO results.
- Deployment and migration history.
- Alert acknowledgement and incident history.
- Administrator access reviews.
- Student export requests and download audit trail.
- Approved deletion requests.
- Policy and waiver versions.
- Vendor/security reviews.

## 22. Monitoring and backup readiness checklist

The monitoring and backup system is ready only when:

- [ ] Named primary and backup owners exist.
- [ ] Uptime, API, database, email, storage, security, and business-flow monitoring are active.
- [ ] Critical alerts reach a person and have been tested.
- [ ] Logs are centralized, access-controlled, retained appropriately, and free of sensitive content.
- [ ] Database point-in-time recovery or an equivalent RPO-compliant process is enabled.
- [ ] Independent encrypted backups run automatically.
- [ ] Private uploaded files are versioned and backed up.
- [ ] Backup copies exist outside the production account/project.
- [ ] Backup failures and stale backups trigger alerts.
- [ ] A recent backup has been successfully restored and validated.
- [ ] Student exports are server-generated, authorized, audited, encrypted, and short-lived.
- [ ] Retention and deletion policies are approved and implemented.
- [ ] Incident response, rollback, and disaster recovery have named owners.
- [ ] No production secret or student export is stored in source control.

If any item above is incomplete, production monitoring and backup readiness remains **NO-GO**.
