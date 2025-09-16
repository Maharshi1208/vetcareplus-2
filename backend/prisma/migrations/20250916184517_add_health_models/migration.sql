-- CreateTable
CREATE TABLE "public"."Vaccination" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Medication" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vaccination_petId_givenAt_idx" ON "public"."Vaccination"("petId", "givenAt");

-- CreateIndex
CREATE INDEX "Medication_petId_startAt_idx" ON "public"."Medication"("petId", "startAt");

-- AddForeignKey
ALTER TABLE "public"."Vaccination" ADD CONSTRAINT "Vaccination_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medication" ADD CONSTRAINT "Medication_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
