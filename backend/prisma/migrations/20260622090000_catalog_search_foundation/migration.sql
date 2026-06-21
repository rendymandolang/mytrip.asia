-- ExtendEnum
ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'CO_LIVING';

-- CreateEnum
CREATE TYPE "RentalTerm" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "BedroomType" AS ENUM ('STUDIO', 'ONE_BR', 'TWO_BR', 'THREE_BR_PLUS');

-- CreateTable
CREATE TABLE "Destination" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Property"
ADD COLUMN "slug" TEXT,
ADD COLUMN "supportedRentalTerms" "RentalTerm"[] NOT NULL DEFAULT ARRAY['DAILY']::"RentalTerm"[],
ADD COLUMN "destinationId" INTEGER,
ADD COLUMN "fullAddress" TEXT,
ADD COLUMN "area" TEXT,
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7),
ADD COLUMN "buildingName" TEXT,
ADD COLUMN "gallery" JSONB,
ADD COLUMN "propertyFacilities" JSONB,
ADD COLUMN "buildingFacilities" JSONB,
ADD COLUMN "additionalInfo" TEXT,
ADD COLUMN "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RoomType"
ADD COLUMN "bedroomType" "BedroomType",
ADD COLUMN "gallery" JSONB,
ADD COLUMN "unitFacilities" JSONB;

-- AlterTable
ALTER TABLE "Room"
ADD COLUMN "tower" TEXT,
ADD COLUMN "floor" TEXT,
ADD COLUMN "electricityWatt" INTEGER,
ADD COLUMN "gallery" JSONB,
ADD COLUMN "unitFacilities" JSONB,
ADD COLUMN "additionalInfo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_country_idx" ON "Destination"("country");

-- CreateIndex
CREATE INDEX "Destination_city_idx" ON "Destination"("city");

-- CreateIndex
CREATE INDEX "Destination_active_idx" ON "Destination"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_destinationId_idx" ON "Property"("destinationId");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_country_idx" ON "Property"("country");

-- CreateIndex
CREATE INDEX "Property_isPublished_idx" ON "Property"("isPublished");

-- CreateIndex
CREATE INDEX "RoomType_bedroomType_idx" ON "RoomType"("bedroomType");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedDestination
INSERT INTO "Destination" ("country", "city", "slug", "displayName", "latitude", "longitude")
VALUES
  ('Indonesia', 'Bali', 'indonesia-bali', 'Bali, Indonesia', -8.4095180, 115.1889190),
  ('Indonesia', 'Lombok', 'indonesia-lombok', 'Lombok, Indonesia', -8.6500000, 116.3249000),
  ('Indonesia', 'Sumba', 'indonesia-sumba', 'Sumba, Indonesia', -9.6380000, 119.4700000),
  ('Indonesia', 'Manado', 'indonesia-manado', 'Manado, Indonesia', 1.4748000, 124.8421000),
  ('Indonesia', 'Komodo Island', 'indonesia-komodo-island', 'Komodo Island, Indonesia', -8.5890000, 119.4910000),
  ('Indonesia', 'Jakarta', 'indonesia-jakarta', 'Jakarta, Indonesia', -6.2088000, 106.8456000),
  ('Indonesia', 'Jogja', 'indonesia-jogja', 'Jogja, Indonesia', -7.7956000, 110.3695000),
  ('Thailand', 'Phuket', 'thailand-phuket', 'Phuket, Thailand', 7.8804000, 98.3923000),
  ('Singapore', 'Singapore', 'singapore', 'Singapore', 1.3521000, 103.8198000),
  ('Malaysia', 'Malaysia', 'malaysia', 'Malaysia', 4.2105000, 101.9758000)
ON CONFLICT ("slug") DO NOTHING;
