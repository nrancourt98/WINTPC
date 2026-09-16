-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('CPU', 'MOTHERBOARD', 'RAM', 'GPU', 'STORAGE', 'PSU', 'CASE', 'COOLING', 'OTHER');

-- CreateTable
CREATE TABLE "Computer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Computer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "computerId" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "specs" JSONB NOT NULL DEFAULT '{}',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Part_computerId_idx" ON "Part"("computerId");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

