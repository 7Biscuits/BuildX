// admin.payment.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  AccountStatus,
  VerificationStatus,
} from "../../generated/prisma/client";
import { logger } from "../lib/logger";
import { idValidator } from "../validators/id.validator";
import {
  approvePaymentValidator,
  rejectPaymentValidator,
} from "../validators/admin.user.validator";
import {
  createSignedPaymentSlipUrl,
  deletePaymentSlipByPublicUrl,
  StorageReadError,
} from "../utils/upload.util";
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

    const paymentsWithSignedUrls = await Promise.all(
      payments.map((payment) => signPaymentSlipUrl(payment)),
    );

    return ok(res, paymentsWithSignedUrls);
  } catch (err) {
    logger.error("FETCH_PENDING_PAYMENTS_FAILED", { error: err });
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

    return ok(res, await signPaymentSlipUrl(payment), "Payment approved");
  } catch (err) {
    logger.error("PAYMENT_APPROVAL_FAILED", {
      paymentId: req.params.id,
      error: err,
    });
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

    const existingPayment = await prisma.paymentVerification.findFirst({
      where: {
        id: paymentId,
        status: VerificationStatus.PENDING,
      },
      select: {
        id: true,
        paymentSlipUrl: true,
        userId: true,
      },
    });

    if (!existingPayment) {
      return fail(res, 404, "Pending payment not found");
    }

    try {
      await deletePaymentSlipByPublicUrl(existingPayment.paymentSlipUrl);
    } catch (error) {
      logger.error("PAYMENT_SLIP_DELETE_ON_REJECTION_FAILED", {
        paymentId,
        userId: existingPayment.userId,
        error,
      });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.paymentVerification.updateMany({
        where: {
          id: paymentId,
          status: VerificationStatus.PENDING,
        },
        data: {
          status: VerificationStatus.REJECTED,
          paymentSlipUrl: null,
          verifiedAt: new Date(),
          verifiedByAdminId: adminId,
          rejectionReason: reason,
        },
      });

      if (updateResult.count === 0) {
        throw new Error("Pending payment not found");
      }

      await tx.user.update({
        where: {
          id: existingPayment.userId,
        },
        data: {
          status: AccountStatus.REJECTED,
        },
      });

      return tx.paymentVerification.findUniqueOrThrow({
        where: {
          id: existingPayment.id,
        },
        include: paymentWithUserInclude,
      });
    });

    return ok(res, payment, "Payment rejected");
  } catch (err) {
    logger.error("PAYMENT_REJECTION_FAILED", {
      paymentId: req.params.id,
      error: err,
    });
    return fail(res, 500, "Rejection failed");
  }
};

const signPaymentSlipUrl = async <
  T extends { paymentSlipUrl: string | null }
>(payment: T) => {
  try {
    return {
      ...payment,
      paymentSlipUrl: await createSignedPaymentSlipUrl(payment.paymentSlipUrl),
    };
  } catch (error) {
    if (error instanceof StorageReadError) {
      logger.error("PAYMENT_SLIP_SIGN_URL_FAILED", {
        paymentId: "id" in payment ? payment.id : undefined,
        error,
      });
    } else {
      logger.error("UNEXPECTED_PAYMENT_SLIP_SIGN_ERROR", {
        paymentId: "id" in payment ? payment.id : undefined,
        error,
      });
    }

    return {
      ...payment,
      paymentSlipUrl: null,
    };
  }
};
