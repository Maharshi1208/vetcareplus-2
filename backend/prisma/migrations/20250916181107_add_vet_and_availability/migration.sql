-- CreateTable
CREATE TABLE "public"."Vet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "specialty" TEXT,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VetAvailability" (
    "id" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VetAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vet_email_key" ON "public"."Vet"("email");

-- CreateIndex
CREATE INDEX "VetAvailability_vetId_weekday_idx" ON "public"."VetAvailability"("vetId", "weekday");

-- AddForeignKey
ALTER TABLE "public"."VetAvailability" ADD CONSTRAINT "VetAvailability_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "public"."Vet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
