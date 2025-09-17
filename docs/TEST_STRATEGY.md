# VetCare+ — Test Strategy (Skeleton)
**Owner:** Yash Patel  
**Version:** 0.1 (draft)  
**Last updated:** 2025-09-17  

---

## 1. Purpose & Alignment
This Test Strategy defines the *what/when/how* of testing for VetCare+.  
It aligns with the approved **Project Proposal** and **Implementation Plan**.  
References: Proposal v1.2 (2025-09-08), Implementation Plan (2025-09-12).

---

## 2. Scope of Testing
**In-scope:** Functional (API/UI), Automation (E2E), API Regression, Performance (baseline & spike), Security (baseline), Accessibility (WCAG AA), Usability checks, RTM traceability.  
**Out-of-scope:** Deep pen-testing, real payment gateway, SMS.

---

## 3. Test Levels & Types
### 3.1 Unit & Component
- Owner: Backend (Maharshi) with Jest/Supertest.
- Exit: ≥70% coverage on critical paths (auth, booking).

### 3.2 Integration (API + DB)
- Verify Prisma queries, constraints, and transaction boundaries.

### 3.3 End-to-End (E2E UI)
- Tool: Playwright (headed & headless).  
- Core flows: Auth, Pet CRUD, Appointment lifecycle, Health timeline.

### 3.4 API Regression
- Tools: Postman + Newman HTML.  
- Collections: `qa/postman/*.postman_collection.json`.

### 3.5 Performance
- Tool: JMeter.  
- Scenario: 100–200 concurrent booking attempts.  
- KPI: P95 ≤ 400ms, error rate <1%.

### 3.6 Security
- Tool: OWASP ZAP baseline scan.  
- Focus: OWASP Top 10 (XSS, injection, auth/session).

### 3.7 Accessibility
- Tools: Lighthouse, axe-core.  
- Criteria: WCAG 2.1 AA.

---

## 4. Test Environments
| Env         | Base URL                       | DB           | Notes |
|-------------|--------------------------------|--------------|-------|
| Local Dev   | http://localhost:4000 (API) / http://localhost:5173 (UI) | Docker Postgres | Dev runs |
| CI (future) | (to be added)                  | Ephemeral    | GitHub Actions |

Dependencies: Docker Compose (Postgres, pgAdmin, MailHog).

---

## 5. Test Data Strategy
- Seed users: Admin, Vet, Owner (`admin@local`, `vet@local`, `owner@local`).  
- Extended via `backend/prisma/seed.ts`.  
- Dedicated test DB/schema reset between runs.

---

## 6. Tooling & Folders
docs/ # SRS, Test Strategy, RTM
qa/
postman/ # *.postman_collection.json
newman/ # HTML reports
playwright/ # tests, videos, screenshots
jmeter/ # .jmx and results
zap/ # ZAP reports
lighthouse/ # Lighthouse reports
reports/ # aggregated QA outputs
---

## 7. Entry / Exit Criteria
**Entry:** FRs defined, API contract agreed, test data ready, env up.  
**Exit:** All acceptance criteria pass, no P1/P2 defects, perf/security/accessibility gates met.

---

## 8. Evidence & Reporting
- Postman/Newman → `qa/newman/*.html`  
- Playwright → videos/screenshots/reports  
- JMeter → `.jtl`, summary graphs  
- ZAP → HTML reports  
- Lighthouse → HTML reports  
- RTM → Requirement → Test Case → Evidence path

---

## 9. Risks & Mitigation
- Time constraint → focus on core flows, nightly regression.  
- Tool unfamiliarity → start with baseline templates.  
- Data flakiness → deterministic seeds & reset strategy.

---

## 10. Traceability (Hook)
RTM will map: Requirement ID → Test Case ID(s) → Evidence path → Status.  
Seed mapping to be added in `docs/RTM.md` (next step).

---

## 11. Approvals
Prepared by: Yash Patel  
Reviewed by: Maharshi, Shrirang  
Approval: Professor

