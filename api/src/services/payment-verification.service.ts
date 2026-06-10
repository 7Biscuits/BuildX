import {
  AccountStatus,
  VerificationStatus,
} from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export type SubmitPendingPaymentVerificationInput = {
  userId: string;
  paymentSlipUrl: string;
  submittedAmount?: number;
};

export const submitPendingPaymentVerification = async ({
  userId,
  paymentSlipUrl,
  submittedAmount,
}: SubmitPendingPaymentVerificationInput) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "USER") {
      throw new Error("Only user accounts can submit payment verification");
    }

    const paymentVerification = await tx.paymentVerification.upsert({
      where: { userId },
      create: {
        userId,
        paymentSlipUrl,
        submittedAmount,
        status: VerificationStatus.PENDING,
      },
      update: {
        paymentSlipUrl,
        submittedAmount,
        status: VerificationStatus.PENDING,
        rejectionReason: "Not Specified",
        verifiedAmount: null,
        verifiedAt: null,
        verifiedByAdminId: null,
        submittedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { status: AccountStatus.PENDING },
    });

    return paymentVerification;
  });
};
