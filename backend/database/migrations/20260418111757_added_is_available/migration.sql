-- AlterTable
ALTER TABLE "Seats" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unavailableReason" TEXT;
