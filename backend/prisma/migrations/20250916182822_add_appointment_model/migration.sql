-- CreateEnum
CREATE TYPE "public"."ApptStatus" AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "status" "public"."ApptStatus" NOT NULL DEFAULT 'BOOKED',
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_vetId_start_end_idx" ON "public"."Appointment"("vetId", "start", "end");

-- CreateIndex
CREATE INDEX "Appointment_petId_start_idx" ON "public"."Appointment"("petId", "start");

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "public"."Vet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
