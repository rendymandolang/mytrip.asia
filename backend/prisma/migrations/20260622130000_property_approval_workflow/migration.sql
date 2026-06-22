-- CreateEnum
CREATE TYPE "PropertyApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Property"
ADD COLUMN "approvalStatus" "PropertyApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "approvalNote" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" INTEGER;

-- Backfill existing catalog data as approved so current live records keep working.
UPDATE "Property"
SET "approvalStatus" = 'APPROVED',
    "submittedAt" = COALESCE("submittedAt", "createdAt"),
    "reviewedAt" = COALESCE("reviewedAt", "createdAt")
WHERE "isPublished" = true;

UPDATE "Property"
SET "approvalStatus" = 'DRAFT'
WHERE "isPublished" = false;

-- CreateIndex
CREATE INDEX "Property_approvalStatus_idx" ON "Property"("approvalStatus");

-- CreateIndex
CREATE INDEX "Property_reviewedById_idx" ON "Property"("reviewedById");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
