# VetCare+ — Software Requirements Specification (SRS)
Version: 0.1 (draft)  
Owner: Yash Patel  
Last updated: 2025-09-17

## 1. Purpose
Defines functional and non-functional requirements that drive design, implementation, and testing for VetCare+.

## 2. Scope
Owners: register/login, manage pets, book/reschedule/cancel appointments, track vaccinations/medications.  
Admins: manage vets, schedules, reports.  
Payments: mock (success/fail).  
Notifications: email via MailHog (mock).

## 3. Stakeholders & Roles
Owner, Vet, Admin, Professor/Client.

## 4. References
- Capstone Project Proposal (approved scope, FR/NFR, success metrics).
- Project Implementation Plan (stack, phases, QA tooling).

## 5. Functional Requirements (FR) — by module
### AUTH
- **AUTH_FR001 — Register (Must)**: email+password; default role=OWNER.  
  **Acceptance**: New email returns 200/201 with user id; duplicate returns 409/400; password never returned.
- **AUTH_FR002 — Login (Must)**: JWT access token on success; 401 on invalid creds.
- **AUTH_FR003 — Token Refresh (Should)**: session renewal + logout invalidates refresh.
- **AUTH_FR004 — RBAC (Must)**: OWNER/VET/ADMIN guards enforced on protected routes.

### PET
- **PET_FR001 — Create/Edit Pet (Must)**: name, species, breed, DOB, optional photo.  
  **Acc.**: validation errors for missing/invalid; owner-only access.
- **PET_FR002 — View Pet (Must)**: list + detail for owner’s pets.
- **PET_FR003 — Pet History (Should)**: combined timeline of appts, vaccines, meds.
- **PET_FR004 — Archive/Restore (Could)**: archived excluded from new bookings; history intact.

### VET
- **VET_FR001 — Vet Profiles (Must)**: Admin CRUD profile.
- **VET_FR002 — Availability (Must)**: weekday + start/end; booking respects availability.

### APPT
- **APPT_FR001 — View Availability (Must)**
- **APPT_FR002 — Book Appointment (Must)**
- **APPT_FR003 — Reschedule (Should)**
- **APPT_FR004 — Cancel (Must)**
- **APPT_FR005 — Lifecycle (Must)**: status transitions tracked; double-booking prevented.

### HEALTH
- **HEALTH_FR001 — Vaccination (Must)**: immutable record.
- **HEALTH_FR002 — Medication (Must)**: dosage + duration.
- **HEALTH_FR003 — Health History View (Should)**

### PAY (Mock)
- **PAY_FR001 — Mock Checkout (Should)**
- **PAY_FR002 — Payment Status Update (Should)**
- **PAY_FR003 — Receipt Entry (Could)**

### ADMIN
- **ADMIN_FR001 — Manage Users (Should)**
- **ADMIN_FR002 — Manage Vets (Must)**
- **ADMIN_FR003 — Override Appointments (Should)**

### REPORT
- **REPORT_FR001 — KPI Dashboard (Should)**
- **REPORT_FR002 — Today’s Schedule & Ops Views (Should)**
- **REPORT_FR003 — CSV/PDF Export (Stretch)**

## 6. Non-Functional Requirements (NFR)
**Performance**:  
- PERF_NFR001 — 100+ concurrent bookings (baseline).  
- PERF_NFR002 — Typical API ≤ 2s (target P95 400ms core ops).

**Security**:  
- SEC_NFR001 — Bcrypt hashing for passwords (no plaintext).  
- SEC_NFR002 — RBAC route guards + input validation (OWASP).  
- SEC_NFR003 — Sanitization vs. XSS/SQLi; logging of auth failures.  
- SEC_NFR004 — Token hygiene/rotation (Stretch).

**Usability & Accessibility**:  
- USAB_NFR001 — Responsive UI;  
- USAB_NFR002 — WCAG 2.1 AA (keyboard, focus, contrast).

**Reliability & Observability**:  
- RELY_NFR001 — Uptime ≥ 99% during demo.  
- OBS_NFR001 — Structured logs;  
- OBS_NFR002 — Error tracking.

## 7. Out of Scope
Real payment gateways, SMS, native mobile.

## 8. Traceability Seeds (for RTM)
| ID | Module | Priority | Test Type | Notes |
|---|---|---|---|---|
| AUTH_FR001 | AUTH | Must | API/E2E | Register happy/negative |
| AUTH_FR002 | AUTH | Must | API/E2E | Login happy/negative |
| PET_FR001  | PET  | Must | API/E2E | CRUD + validation |
| APPT_FR002 | APPT | Must | API/E2E | Booking + conflict prevention |
| HEALTH_FR001 | HEALTH | Must | API | Vaccination immutable |
| PERF_NFR002 | Perf | Must | JMeter | P95 ≤ 400ms core |

## 9. Acceptance & Sign-off
Prepared by: Yash Patel  
Reviewed by: Maharshi, Shrirang  
Approval: Professor
