# VetCare+ Backend Quickstart
1) cd infra && cp .env.example .env && docker compose up -d
2) cd ../backend && cp .env.example .env && npm i
3) npx prisma generate && npx prisma migrate dev
4) npm run prisma:seed
5) npm run dev → http://localhost:4000  (MailHog: http://localhost:8025)
