-- CreateEnum
CREATE TYPE "HousekeepingStatus" AS ENUM ('CLEAN', 'DIRTY', 'INSPECTING', 'OUT_OF_SERVICE');

-- AlterTable
ALTER TABLE "Property"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'IDR';

-- CreateTable
CREATE TABLE "RoomType" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "totalRooms" INTEGER NOT NULL DEFAULT 0,
    "basePrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Room"
ADD COLUMN "roomTypeId" INTEGER,
ADD COLUMN "housekeepingStatus" "HousekeepingStatus" NOT NULL DEFAULT 'CLEAN';

-- CreateTable
CREATE TABLE "Allotment" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "roomTypeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "rate" DECIMAL(12,2),
    "minStay" INTEGER,
    "maxStay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allotment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAllocation" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAvailability" (
    "id" SERIAL NOT NULL,
    "roomTypeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "bookedRooms" INTEGER NOT NULL DEFAULT 0,
    "blockedRooms" INTEGER NOT NULL DEFAULT 0,
    "availableRooms" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomType_propertyId_idx" ON "RoomType"("propertyId");

-- CreateIndex
CREATE INDEX "Room_propertyId_idx" ON "Room"("propertyId");

-- CreateIndex
CREATE INDEX "Room_roomTypeId_idx" ON "Room"("roomTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Allotment_date_roomTypeId_key" ON "Allotment"("date", "roomTypeId");

-- CreateIndex
CREATE INDEX "Allotment_propertyId_idx" ON "Allotment"("propertyId");

-- CreateIndex
CREATE INDEX "Allotment_roomTypeId_idx" ON "Allotment"("roomTypeId");

-- CreateIndex
CREATE INDEX "Allotment_date_idx" ON "Allotment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAllocation_bookingId_date_key" ON "RoomAllocation"("bookingId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAllocation_roomId_date_key" ON "RoomAllocation"("roomId", "date");

-- CreateIndex
CREATE INDEX "RoomAllocation_bookingId_idx" ON "RoomAllocation"("bookingId");

-- CreateIndex
CREATE INDEX "RoomAllocation_roomId_idx" ON "RoomAllocation"("roomId");

-- CreateIndex
CREATE INDEX "RoomAllocation_date_idx" ON "RoomAllocation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAvailability_date_roomTypeId_key" ON "DailyAvailability"("date", "roomTypeId");

-- CreateIndex
CREATE INDEX "DailyAvailability_roomTypeId_idx" ON "DailyAvailability"("roomTypeId");

-- CreateIndex
CREATE INDEX "DailyAvailability_date_idx" ON "DailyAvailability"("date");

-- CreateIndex
CREATE INDEX "Booking_roomId_idx" ON "Booking"("roomId");

-- CreateIndex
CREATE INDEX "Booking_checkIn_idx" ON "Booking"("checkIn");

-- CreateIndex
CREATE INDEX "Booking_checkOut_idx" ON "Booking"("checkOut");

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allotment" ADD CONSTRAINT "Allotment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allotment" ADD CONSTRAINT "Allotment_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAvailability" ADD CONSTRAINT "DailyAvailability_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
