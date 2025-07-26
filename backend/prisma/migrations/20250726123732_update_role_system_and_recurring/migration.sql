/*
  Warnings:

  - You are about to drop the column `nextInvoiceDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `recurringFrequency` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `recurringInterval` on the `Invoice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_parentInvoiceId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "nextInvoiceDate",
DROP COLUMN "recurringFrequency",
DROP COLUMN "recurringInterval",
ADD COLUMN     "nextDueDate" TIMESTAMP(3),
ADD COLUMN     "recurringDay" INTEGER,
ADD COLUMN     "recurringType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clientId" INTEGER,
ALTER COLUMN "role" SET DEFAULT 'client';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
