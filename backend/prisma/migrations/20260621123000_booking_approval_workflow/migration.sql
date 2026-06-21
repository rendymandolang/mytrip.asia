-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "BookingChangeRequest" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "requestedById" INTEGER,
    "reviewedById" INTEGER,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewNote" TEXT,
    "oldData" JSONB,
    "newData" JSONB NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingChangeRequest_bookingId_idx" ON "BookingChangeRequest"("bookingId");

-- CreateIndex
CREATE INDEX "BookingChangeRequest_requestedById_idx" ON "BookingChangeRequest"("requestedById");

-- CreateIndex
CREATE INDEX "BookingChangeRequest_reviewedById_idx" ON "BookingChangeRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "BookingChangeRequest_status_idx" ON "BookingChangeRequest"("status");

-- CreateIndex
CREATE INDEX "BookingChangeRequest_createdAt_idx" ON "BookingChangeRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "BookingChangeRequest" ADD CONSTRAINT "BookingChangeRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingChangeRequest" ADD CONSTRAINT "BookingChangeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingChangeRequest" ADD CONSTRAINT "BookingChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
