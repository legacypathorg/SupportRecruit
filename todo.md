# Legacy Path Solutions - Applicant Management System TODO

## Branding & Setup
- [x] Navy-and-gold theme in index.css + Google Fonts
- [x] Logo and hero imagery assets generated & uploaded

## Database & Backend
- [x] Schema: applications, documents, notes, activity_log, email_log, analytics_events tables
- [x] 13 application statuses enum locked in (New Application, Under Review, Additional Information Needed, Interview Requested, Interview Scheduled, Approved, Agreement Pending, Registration Pending, Training Pending, Active Support Specialist, Waitlisted, Declined, Withdrawn)
- [x] Unique application reference number generation (e.g., LPS-2026-XXXXXX)
- [x] Save-and-continue: draft persistence + resume token emailed to applicant
- [x] S3 document upload (resume, ID, certifications) via storagePut
- [x] Presigned download URLs for admin document access
- [x] 9 branded lifecycle email templates (received, additional info, interview invitation, approved, agreement & registration, training invitation, waitlisted, declined, activated)
- [x] Email sending service (built-in notification to owner + email log for applicant emails)
- [x] Admin notification on new submission
- [x] Analytics event tracking API (form_start, step_complete, submit, cta_click, traffic source)
- [x] Simple email/password admin login (bypass OAuth) with role gating

## Public Application Funnel
- [x] Landing page /apply with hero, 5-step process, notice, CTAs
- [x] Multi-step application form with progress bar
- [x] Required-field validation with helpful error messages
- [x] Save and continue later (email resume link)
- [x] Document upload step
- [x] Review screen before final submission
- [x] Confirmation page with reference number
- [x] Download application copy (PDF/print) or email to self
- [x] $200 fee disclosure & acknowledgments (no payment processing)
- [x] Mobile-first responsive design

## Admin Dashboard
- [x] Secure login page (email/password)
- [x] Paginated applicant table
- [x] Search by name, location, profession, status
- [x] Filter by submission date, industry, state, city, county
- [x] Export filtered records to CSV
- [x] Applicant detail view
- [x] Assign reviewer
- [x] Private internal notes
- [x] Update status across all 13 statuses
- [x] Send templated emails from detail view
- [x] Track interview dates, agreement status, registration-fee status, training status, activation date
- [x] Per-applicant activity history log
- [x] Document downloads via presigned URLs
- [x] Analytics dashboard (starts, completion rate, abandonment rate, traffic source, CTA clicks)

## Testing & Delivery
- [x] Vitest tests for core backend flows
- [x] End-to-end verification (apply flow + admin flow)
- [x] Verified reviewer assignment, interview date, registration-fee, training status, activation date persistence with activity logging
- [x] Verified email-to-self copy endpoint and download/print copy handler
- [x] Checkpoint saved and delivered

## Post-delivery / Optional
- [x] Connect and validate Resend API key; live send pipeline verified end-to-end (Resend API reached; test address example.com correctly rejected by Resend sandbox rules; every email always logged with delivery status in email history)
- [x] USER ACTION: Verify a sending domain in Resend (resend.com/domains) and set EMAIL_FROM_ADDRESS to an address on that domain — DONE: legacypathsolutions.com verified (DKIM + SPF), sender info@legacypathsolutions.com

## Bug: Resend not connecting (reported by user)
- [x] Diagnose Resend connection: API key is VALID; domain legacypathsolutions.com added in Resend but DNS verification NOT started (403 "domain is not verified" on send)
- [x] Confirmed via DNS lookup: required Resend records (DKIM TXT, send MX, send TXT) are missing at GoDaddy DNS (ns59/ns60.domaincontrol.com)
- [x] Improve email service logging to surface domain-verification errors clearly
- [x] USER ACTION: Add the 3 DNS records at GoDaddy and click Verify in Resend — DONE: domain status "verified", live send returned 200 with message id

## Change request: official logo in header
- [x] Replace public site header logo with the official Legacy Path Solutions logo (all other elements unchanged)
- [x] Add the official logo to the site footer for brand consistency
