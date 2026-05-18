/*
  Warnings:

  - You are about to drop the column `hallId` on the `Tickets` table. All the data in the column will be lost.
  - You are about to drop the column `reservedUntil` on the `Tickets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ticketNumber]` on the table `Tickets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionId,seatId]` on the table `Tickets` will be added. If there are existing duplicate values, this will fail.
  - Made the column `status` on table `Tickets` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Tickets" DROP CONSTRAINT "Tickets_hallId_fkey";

-- AlterTable
ALTER TABLE "Tickets" DROP COLUMN "hallId",
DROP COLUMN "reservedUntil",
ADD COLUMN     "lockedUntil" TIMESTAMP(6),
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "ticketNumber" VARCHAR(50),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'LOCKED';

-- CreateIndex
CREATE UNIQUE INDEX "Tickets_ticketNumber_key" ON "Tickets"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Tickets_sessionId_seatId_key" ON "Tickets"("sessionId", "seatId");
