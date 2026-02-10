-- AlterTable
ALTER TABLE "CustomerProfile" ALTER COLUMN "qrToken" DROP NOT NULL,
ALTER COLUMN "qrExpiresAt" DROP NOT NULL;
