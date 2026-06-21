-- CreateEnum
CREATE TYPE "AvailabilityBlockType" AS ENUM ('MAINTENANCE', 'OWNER_USE', 'HOLD', 'OTHER');

-- CreateTable
CREATE TABLE "AvailabilityBlock" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "AvailabilityBlockType" NOT NULL DEFAULT 'OTHER',
    "reason" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityBlock_roomId_idx" ON "AvailabilityBlock"("roomId");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_createdById_idx" ON "AvailabilityBlock"("createdById");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_startDate_idx" ON "AvailabilityBlock"("startDate");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_endDate_idx" ON "AvailabilityBlock"("endDate");

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
