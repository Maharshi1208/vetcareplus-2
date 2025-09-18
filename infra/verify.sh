#!/usr/bin/env bash
set -euo pipefail

# deps check
command -v jq >/dev/null || { echo "Please install jq"; exit 1; }
command -v curl >/dev/null || { echo "Please install curl"; exit 1; }

API="${API:-http://localhost:4000}"
DATE="${DATE:-2025-09-22}"
FROM="${FROM:-2025-09-01}"
TO="${TO:-2025-10-01}"

echo "▶ Health checks"
curl -s "$API/health" | jq .
curl -s "$API/health/db" | jq .

echo "▶ Login (admin & owner)"
ADMIN_TOKEN=$(
  curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@vetcare.local","password":"admin123"}' | jq -r '.tokens.access'
)
OWNER_TOKEN=$(
  curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"owner1@test.com","password":"secret123"}' | jq -r '.tokens.access'
)
curl -s "$API/auth/me" -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "▶ Ensure vet (active) and Monday availability"
VET_ID=$(
  curl -s "$API/vets" -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq -r '.vets[] | select(.active==true) | .id' | head -n1
)
if [ -z "${VET_ID:-}" ] || [ "$VET_ID" = "null" ]; then
  VET_ID=$(curl -s -X POST "$API/vets" \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Dr. Aria Patel","email":"aria+'$(date +%s)'@clinic.local","specialty":"Dermatology"}' \
    | jq -r '.vet.id')
fi
# Add two Monday blocks; server returns 409 if already there (that’s fine)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/vets/$VET_ID/availability" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"weekday":1,"start":"09:00","end":"12:00"}' || true
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/vets/$VET_ID/availability" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"weekday":1,"start":"13:00","end":"15:00"}' || true

echo "▶ Ensure pet"
PET_ID=$(
  curl -s "$API/pets" -H "Authorization: Bearer $OWNER_TOKEN" \
  | jq -r '.pets[0].id'
)
if [ -z "${PET_ID:-}" ] || [ "$PET_ID" = "null" ]; then
  PET_ID=$(curl -s -X POST "$API/pets" \
    -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Bruno","species":"Dog"}' | jq -r '.pet.id')
fi

echo "▶ Book -> Pay -> Complete"
BOOK=$(curl -s -X POST "$API/appointments" \
  -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
  -d '{"petId":"'"$PET_ID"'","vetId":"'"$VET_ID"'","start":"'"$DATE"'T10:30:00","end":"'"$DATE"'T11:00:00","reason":"Checkup"}')
echo "$BOOK" | jq '.ok, .appointment.id, .appointment.status'
APPT_ID=$(echo "$BOOK" | jq -r '.appointment.id')

PAY=$(curl -s -X POST "$API/pay/checkout" \
  -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
  -d '{"appointmentId":"'"$APPT_ID"'","amountCents":5000,"currency":"CAD","method":"CARD","simulate":"SUCCESS"}')
echo "$PAY" | jq '.ok, .payment.status, .receipt.receiptNo'

curl -s -X PATCH "$API/appointments/$APPT_ID/complete" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.ok, .appointment.status'

echo "▶ Reports (JSON + CSV)"
curl -s "$API/reports/schedule?date=$DATE" | jq .
curl -s "$API/reports/schedule.csv?date=$DATE" > "schedule-$DATE.csv"
curl -s "$API/reports/kpis?from=$FROM&to=$TO" | jq .
curl -s "$API/reports/kpis.csv?from=$FROM&to=$TO" > "kpis-$FROM-to-$TO.csv"
ls -lh "schedule-$DATE.csv" "kpis-$FROM-to-$TO.csv"

echo "✅ Done. Swagger: $API/docs | MailHog: http://localhost:8025"
