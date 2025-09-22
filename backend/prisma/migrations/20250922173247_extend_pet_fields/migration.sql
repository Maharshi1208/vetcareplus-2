-- DropForeignKey
ALTER TABLE "public"."Pet" DROP CONSTRAINT "Pet_ownerId_fkey";

-- DropIndex
DROP INDEX "public"."Pet_ownerId_idx";

-- AlterTable
ALTER TABLE "public"."Pet" ADD COLUMN     "ageMonths" INTEGER,
ADD COLUMN     "ageYears" INTEGER,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "microchipId" TEXT,
ADD COLUMN     "neutered" BOOLEAN DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "vaccinated" BOOLEAN DEFAULT false,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "public"."Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
