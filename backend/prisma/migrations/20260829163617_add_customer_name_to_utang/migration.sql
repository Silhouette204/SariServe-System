/*
  Warnings:

  - Made the column `customerName` on table `UtangPayment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customerName` on table `UtangTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UtangPayment" ALTER COLUMN "customerName" SET NOT NULL;

-- AlterTable
ALTER TABLE "UtangTransaction" ALTER COLUMN "customerName" SET NOT NULL;
