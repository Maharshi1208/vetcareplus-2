# VetCare+ (Capstone)

![CI](https://github.com/Maharshi1208/vetcareplus-2/actions/workflows/ci.yml/badge.svg?branch=main)

Monorepo – single branch (`main`) only.

- **Backend:** Node.js 20 + Express 5 + TypeScript + Prisma + PostgreSQL
- **Infra:** Docker (Postgres @ 5433), MailHog (optional)
- **Frontend:** React (Vite + TS + Tailwind) — owned by Shrirang
- **QA / Docs:** Yash (SRS, Test Strategy, RTM, Postman, Playwright, JMeter, ZAP)

## Repo layout

```
vetcareplus-2/
├─ backend/           # API server (+ tests)
├─ infra/             # helper scripts / docker cmds
├─ .github/workflows/ # CI
└─ README.md
```

---

## Prerequisites

- Node.js **v20**
- Docker Desktop (or Docker Engine)  
- `psql` client (for creating the test DB)

---

## Environment

We use two env files inside **`backend/`**:

- **`.env`** (development)
- **`.env.test`** (used by Jest integration tests & CI)

**Key points**  
- DB runs on host port **5433**.  
- JWT/SMTP are local/dev-safe values.  
- Don’t commit secrets to git.

Example (already in repo, shown here for reference):

**`backend/.env`**
```
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://vc_user:vc_pass@127.0.0.1:5433/vetcare_db?schema=public

JWT_SECRET=dev_super_secret_change_me_but_long_enough_please
JWT_EXPIRES=1d
BCRYPT_ROUNDS=10

SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_FROM=no-reply@vetcare.local

FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:4000
```

**`backend/.env.test`**
```
NODE_ENV=test
PORT=4000
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://vc_user:vc_pass@127.0.0.1:5433/vetcare_test?schema=public

JWT_SECRET=tests-are-fun-please-change-me-123456
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=no-reply@vetcare.local
```

---

## Database (Docker) – 5433

Start a fresh Postgres and create the **test** DB:

```bash
# from repo root (WSL/Linux/Mac)
docker rm -f vetcare-pg 2>/dev/null || true

docker run --rm -d --name vetcare-pg   -e POSTGRES_USER=vc_user   -e POSTGRES_PASSWORD=vc_pass   -e POSTGRES_DB=vetcare_db   -p 5433:5432 postgres:16-alpine

# create test DB
docker exec -it vetcare-pg   psql -U vc_user -d postgres -c "CREATE DATABASE vetcare_test OWNER vc_user;"
```

---

## Install & run (Backend)

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate   # or: npx prisma migrate dev
npm run dev             # starts API on :4000
```

Seed admin is automatically created by tests/migrations when needed.

**Seeded admin (dev/test):**
```
email: admin@vetcare.local
pass : admin123
```

---

## API Docs & Health

- Swagger UI: `GET http://localhost:4000/docs`
- OpenAPI JSON: `GET http://localhost:4000/docs/openapi.json`
- Health:
  - `GET /` → “VetCare+ API is running”
  - `GET /ping` → `{ ok: true, pong: <ISO> }`
  - `GET /health` → uptime & timestamp
  - `GET /health/db` → Prisma DB check (200 or 500)

---

## Scripts

From **`backend/`**:

```bash
# Dev
npm run dev

# Build & start (prod-style)
npm run build && npm start

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:reset     # destructive reset for local testing
npm run prisma:seed

# Tests
npm run test:unit
npm run test:int
npm run coverage
```

---

## Tests (what we cover)

### Unit
- `hash.unit.test.ts` — bcrypt helpers
- `jwt.unit.test.ts` — tokens/claims
- `time.unit.test.ts` — time utilities
- `dto.unit.test.ts` — DTO validation basics
- `appointments.unit.test.ts` — conflict logic

### Integration
- **Auth** — register, login, me, bad creds
- **Owners** — admin-only listing, RBAC 403
- **Pets** — create/list by owner
- **Vets Availability** — CRUD + 409 on overlaps
- **Appointments** — must be inside availability + reject overlaps
- **Metrics** — summary/appointments/schedule/activity (auth-protected)
- **RBAC** — admin-only routes gated
- **Rate limiting** — 429 on hammering a public endpoint
- **Health & Docs** — `/`, `/ping`, `/health`, `/health/db`, OpenAPI served
- **Security headers** — helmet basics on `/`
- **OpenAPI snapshot** — spec shape check
- **Availability edges** — adjacent slots allowed; invalid wrap rejected
- **Appointment race** — two simultaneous bookings ⇒ at most one success (other 409)

> Integration tests automatically **reset and migrate** a dedicated test DB (`vetcare_test`) before suites.

**Run a subset** (examples):
```bash
npm run test:int -- --testPathPattern="auth\.int\.test\.ts$"
npm run test:int -- --testPathPattern="(availability\.edges|appt\.race)\.int\.test\.ts$"
```

**Coverage thresholds** are set in `jest.config.ts` (adjust if needed).  
Run `npm run coverage` to generate report.

---

## CI (GitHub Actions)

- Workflow: `.github/workflows/ci.yml`
- Spawns Postgres **:5433**, creates `vetcare_test`, runs **unit** then **integration** using `backend/.env.test`.
- Badge at the top of this README reflects `main` status.

---

## RBAC & Security

- JWT auth (`Authorization: Bearer <token>`)
- Admin-only routes (e.g., `GET /owners`, `GET /admin/ping`)
- Helmet headers on all responses
- Global rate limiter (configurable via env)

---

## Common Issues / Fixes

**P1001: Can’t reach database 127.0.0.1:5433**  
- Ensure Docker container is running: `docker ps`
- Ensure port 5433 isn’t blocked; restart container; re-create test DB.

**Migrations out of sync**  
```bash
cd backend
npm run prisma:migrate:reset
npm run prisma:generate
```

**Port already in use (:4000 / :5433)**  
- Kill the running process or stop the old container: `docker rm -f vetcare-pg`

---

## Contributing

- Commit directly to `main` (small, focused commits).
- Clear commit messages.
- Keep the two Excel trackers updated (Requirements & Test Log) using our IDs:
  - e.g., `VC-SRV-VET-AVL-001`, `VC-SRV-APPT-BOOK-002`, `VC-OPS-DOCS-001`, etc.

---

## Admin credentials (again)

```
admin@vetcare.local / admin123
```

Happy hacking 🐾
