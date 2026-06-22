-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "accountReviewNote" TEXT,
ADD COLUMN "accountReviewedAt" TIMESTAMP(3),
ADD COLUMN "accountReviewedById" INTEGER;

-- Backfill partner accounts created before partnership approval existed.
UPDATE "User"
SET "accountStatus" = 'APPROVED'
WHERE "role" IN ('SUPERADMIN', 'ADMIN', 'FINANCE_HEAD', 'CUSTOMER', 'OWNER');

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE INDEX "User_accountReviewedById_idx" ON "User"("accountReviewedById");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accountReviewedById_fkey" FOREIGN KEY ("accountReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
