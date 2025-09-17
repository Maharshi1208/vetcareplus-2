#!/usr/bin/env bash
set -euo pipefail

API=http://localhost:4000
j() { jq -r "$1"; }

echo "→ Health"; curl -s $API/health | jq .

OWNER_TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"owner1@test.com","password":"secret123"}' | j '.tokens.access')
ADMIN_TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@vetcare.local","password":"admin123"}' | j '.tokens.access')

PET_ID=$(curl -s $API/pets -H "Authorization: Bearer $OWNER_TOKEN" | j '.pets[0].id')
if [ -z "${PET_ID:-}" ] || [ "$PET_ID" = "null" ]; then
  PET_ID=$(curl -s -X POST $API/pets -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Bruno","species":"Dog"}' | j '.pet.id')
fi

VET_ID=$(curl -s $API/vets -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.vets[] | select(.active==true) | .id' | head -n1)
if [ -z "${VET_ID:-}" ] || [ "$VET_ID" = "null" ]; then
  VET_ID=$(curl -s -X POST $API/vets -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d "{\"name\":\"Dr. Aria Patel\",\"email\":\"aria+$(date +%s)@clinic.local\",\"specialty\":\"Dermatology\"}" | j '.vet.id')
fi
curl -s -X POST $API/vets/$VET_ID/availability -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"weekday":1,"start":"09:00","end":"12:00"}' >/dev/null || true
curl -s -X POST $API/vets/$VET_ID/availability -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"weekday":1,"start":"13:00","end":"15:00"}' >/dev/null || true

BOOK=$(curl -s -X POST $API/appointments -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
  -d "{\"petId\":\"$PET_ID\",\"vetId\":\"$VET_ID\",\"start\":\"2025-09-22T10:30:00\",\"end\":\"2025-09-22T11:00:00\",\"reason\":\"Checkup\"}")
APPT_ID=$(echo "$BOOK" | j '.appointment.id')
echo "→ Booked $APPT_ID"

PAY=$(curl -s -X POST $API/pay/checkout -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
  -d "{\"appointmentId\":\"$APPT_ID\",\"amountCents\":5000,\"currency\":\"CAD\",\"method\":\"CARD\",\"simulate\":\"SUCCESS\"}")
echo "$PAY" | jq '.payment.status, .receipt.receiptNo'

DONE=$(curl -s -X PATCH $API/appointments/$APPT_ID/complete -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$DONE" | jq '.appointment.status'
echo "✅ Smoke passed"
