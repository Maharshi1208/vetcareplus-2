# VetCare+ — Requirement Traceability Matrix (RTM)
**Owner:** Yash Patel  
**Version:** 0.1 (seed)  
**Last updated:** 2025-09-17  

---

## 1. Purpose
The RTM ensures every Functional/Non-Functional Requirement (FR/NFR) from the **SRS** is mapped to at least one Test Case ID, execution evidence, and result. It closes the loop between **Proposal → SRS → Test Strategy → Test Cases → Reports**.

---

## 2. Traceability Table (Seed)

| Req ID       | Module | Priority | Test Case IDs      | Test Type   | Evidence Path (when executed)         | Status  |
|--------------|--------|----------|-------------------|-------------|---------------------------------------|---------|
| AUTH_FR001   | AUTH   | Must     | TC_AUTH_001,002   | API (Postman)| `qa/newman/auth_register.html`         | Pending |
| AUTH_FR002   | AUTH   | Must     | TC_AUTH_003,004   | API (Postman)| `qa/newman/auth_login.html`            | Pending |
| AUTH_FR004   | AUTH   | Must     | TC_AUTH_005       | API/E2E      | `qa/playwright/videos/auth_flow.mp4`   | Pending |
| PET_FR001    | PET    | Must     | TC_PET_001–003    | API (Postman)| `qa/newman/pet_crud.html`              | Pending |
| PET_FR003    | PET    | Should   | TC_PET_004        | E2E (Playwright)| `qa/playwright/screenshots/pet_timeline.png` | Pending |
| VET_FR001    | VET    | Must     | TC_VET_001        | API (Postman)| `qa/newman/vet_profiles.html`          | Pending |
| APPT_FR002   | APPT   | Must     | TC_APPT_001–003   | API+E2E      | `qa/playwright/videos/booking.mp4`     | Pending |
| HEALTH_FR001 | HEALTH | Must     | TC_HEALTH_001     | API (Postman)| `qa/newman/vaccine_add.html`           | Pending |
| PAY_FR001    | PAY    | Should   | TC_PAY_001        | E2E/API      | `qa/playwright/videos/pay_flow.mp4`    | Pending |
| REPORT_FR001 | REPORT | Should   | TC_REPORT_001     | E2E (UI)     | `qa/playwright/screenshots/dashboard.png` | Pending |
| PERF_NFR002  | Perf   | Must     | TC_PERF_001       | JMeter       | `qa/jmeter/results/bookings_summary.jtl` | Pending |
| SEC_NFR002   | Security | Must   | TC_SEC_001        | ZAP Scan     | `qa/zap/zap-baseline-report.html`      | Pending |
| USAB_NFR002  | Accessibility | Must | TC_A11Y_001    | Lighthouse   | `qa/lighthouse/login_accessibility.html` | Pending |

---

## 3. Test Case ID Naming Convention
- **TC_{MODULE}_{###}** (e.g., `TC_AUTH_001`)  
- Sequential numbering within each module.  
- Types: API, E2E, Perf, Security, A11Y.  

---

## 4. Status Legend
- **Pending:** Not yet executed.  
- **Pass:** Executed, all acceptance criteria met.  
- **Fail:** Executed, some criteria unmet (linked to defect).  
- **N/A:** Not applicable.

---

## 5. Next Steps
- Fill in TC descriptions in `qa/playwright/` and `qa/postman/` collections.  
- After execution, attach evidence (screenshots, videos, HTML reports).  
- Update this RTM to reflect actual results for professor sign-off.
