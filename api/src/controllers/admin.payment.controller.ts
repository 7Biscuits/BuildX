// admin.payment.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  AccountStatus,
  VerificationStatus,
} from "../../generated/prisma/client";
import { idValidator } from "../validators/id.validator";
import {
  approvePaymentValidator,
  rejectPaymentValidator,
} from "../validators/admin.user.validator";
import { fail, ok, validationFail } from "../utils/http";

const paymentWithUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      institution: true,
      contact: true,
      status: true,
      createdAt: true,
    },
  },
} as const;

/*
  GET ALL PENDING PAYMENTS
*/
export const getPendingPayments = async (_: Request, res: Response) => {
  try {
    const payments = await prisma.paymentVerification.findMany({
      where: {
        status: VerificationStatus.PENDING,
        user: {
        role: "USER",
          status: AccountStatus.PENDING,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            institution: true,
            contact: true,
          },
        },
      },
      orderBy: {
        submittedAt: "asc",
      },
    });

    return ok(res, payments);
  } catch (err) {
    return fail(res, 500, "Failed to fetch payments");
  }
};

/*
  APPROVE PAYMENT
*/
export const approvePayment = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const parsed = idValidator.safeParse(req.params);

    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const bodyParsed = approvePaymentValidator.safeParse(req.body);
    if (!bodyParsed.success) {
      return validationFail(res, bodyParsed.error);
    }

    const paymentId = parsed.data.id;
    const verifiedAmount = bodyParsed.data.verifiedAmount;

    const payment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.paymentVerification.update({
        where: {
          id: paymentId,
          status: VerificationStatus.PENDING,
        },
        data: {
          status: VerificationStatus.APPROVED,
          verifiedAt: new Date(),
          verifiedByAdminId: adminId,
          verifiedAmount,
        },
      });

      await tx.user.update({
        where: {
          id: updatedPayment.userId,
        },
        data: {
          status: AccountStatus.VERIFIED,
        },
      });

      return tx.paymentVerification.findUniqueOrThrow({
        where: {
          id: updatedPayment.id,
        },
        include: paymentWithUserInclude,
      });
    });

    return ok(res, payment, "Payment approved");
  } catch (err) {
    return fail(res, 500, "Approval failed");
  }
};

/*
  REJECT PAYMENT
*/
export const rejectPayment = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const parsed = idValidator.safeParse(req.params);

    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const paymentId = parsed.data.id;
    const bodyParsed = rejectPaymentValidator.safeParse(req.body);
    if (!bodyParsed.success) {
      return validationFail(res, bodyParsed.error);
    }
    const reason = bodyParsed.data.reason || "Not Specified";

    const payment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.paymentVerification.update({
        where: {
          id: paymentId,
          status: VerificationStatus.PENDING,
        },
        data: {
          status: VerificationStatus.REJECTED,
          verifiedAt: new Date(),
          verifiedByAdminId: adminId,
          rejectionReason: reason,
        },
      });

      await tx.user.update({
        where: {
          id: updatedPayment.userId,
        },
        data: {
          status: AccountStatus.REJECTED,
        },
      });

      return tx.paymentVerification.findUniqueOrThrow({
        where: {
          id: updatedPayment.id,
        },
        include: paymentWithUserInclude,
      });
    });

    return ok(res, payment, "Payment rejected");
  } catch (err) {
    return fail(res, 500, "Rejection failed");
  }
};
