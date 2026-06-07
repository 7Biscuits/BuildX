/*
  Warnings:

  - Made the column `rejectionReason` on table `PaymentVerification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PaymentVerification" ALTER COLUMN "paymentSlipUrl" DROP NOT NULL,
ALTER COLUMN "submittedAmount" DROP NOT NULL,
ALTER COLUMN "rejectionReason" SET NOT NULL,
ALTER COLUMN "rejectionReason" SET DEFAULT 'Not Specified';
