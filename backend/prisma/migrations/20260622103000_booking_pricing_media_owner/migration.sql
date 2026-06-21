-- AlterTable
ALTER TABLE "Property"
ADD COLUMN "ownerId" INTEGER;

-- AlterTable
ALTER TABLE "Booking"
ALTER COLUMN "userId" DROP NOT NULL,
ADD COLUMN "guestId" INTEGER,
ADD COLUMN "rentalTerm" "RentalTerm" NOT NULL DEFAULT 'DAILY',
ADD COLUMN "pricingSnapshot" JSONB,
ADD COLUMN "source" TEXT;

-- CreateTable
CREATE TABLE "Guest" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "roomTypeId" INTEGER,
    "rentalTerm" "RentalTerm" NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "serviceFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cleaningFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deposit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minStay" INTEGER,
    "maxStay" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER,
    "roomTypeId" INTEGER,
    "roomId" INTEGER,
    "uploadedById" INTEGER,
    "url" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "category" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_guestId_idx" ON "Booking"("guestId");

-- CreateIndex
CREATE INDEX "Guest_email_idx" ON "Guest"("email");

-- CreateIndex
CREATE INDEX "Guest_phone_idx" ON "Guest"("phone");

-- CreateIndex
CREATE INDEX "PricingRule_propertyId_idx" ON "PricingRule"("propertyId");

-- CreateIndex
CREATE INDEX "PricingRule_roomTypeId_idx" ON "PricingRule"("roomTypeId");

-- CreateIndex
CREATE INDEX "PricingRule_rentalTerm_idx" ON "PricingRule"("rentalTerm");

-- CreateIndex
CREATE INDEX "PricingRule_active_idx" ON "PricingRule"("active");

-- CreateIndex
CREATE INDEX "MediaAsset_propertyId_idx" ON "MediaAsset"("propertyId");

-- CreateIndex
CREATE INDEX "MediaAsset_roomTypeId_idx" ON "MediaAsset"("roomTypeId");

-- CreateIndex
CREATE INDEX "MediaAsset_roomId_idx" ON "MediaAsset"("roomId");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedById_idx" ON "MediaAsset"("uploadedById");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
