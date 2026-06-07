/*
  Warnings:

  - You are about to drop the `payment_verifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payment_verifications" DROP CONSTRAINT "payment_verifications_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "payment_verifications" DROP CONSTRAINT "payment_verifications_userId_fkey";

-- DropTable
DROP TABLE "payment_verifications";

-- CreateTable
CREATE TABLE "PaymentVerification" (
    "id" TEXT NOT NULL,
    "paymentSlipUrl" TEXT NOT NULL,
    "submittedAmount" DOUBLE PRECISION NOT NULL,
    "verifiedAmount" DOUBLE PRECISION,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "verifiedByAdminId" TEXT,

    CONSTRAINT "PaymentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVerification_userId_key" ON "PaymentVerification"("userId");

-- AddForeignKey
ALTER TABLE "PaymentVerification" ADD CONSTRAINT "PaymentVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVerification" ADD CONSTRAINT "PaymentVerification_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
