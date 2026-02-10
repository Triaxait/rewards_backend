/*
  Warnings:

  - You are about to drop the column `siteId` on the `StaffProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `StaffProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstNameEnc` to the `StaffProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastNameEnc` to the `StaffProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StaffProfile" DROP CONSTRAINT "StaffProfile_siteId_fkey";

-- DropIndex
DROP INDEX "StaffProfile_userId_siteId_key";

-- AlterTable
ALTER TABLE "StaffProfile" DROP COLUMN "siteId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "firstNameEnc" TEXT NOT NULL,
ADD COLUMN     "lastNameEnc" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "StaffSite" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffSite_staffId_siteId_key" ON "StaffSite"("staffId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- AddForeignKey
ALTER TABLE "StaffSite" ADD CONSTRAINT "StaffSite_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSite" ADD CONSTRAINT "StaffSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
