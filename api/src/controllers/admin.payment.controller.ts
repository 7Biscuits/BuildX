// admin.payment.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  AccountStatus,
  VerificationStatus,
} from "../../generated/prisma/client";
import { idValidator } from "../validators/id.validator";

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

    return res.json({
      success: true,
      data: payments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};

/*
  APPROVE PAYMENT
*/
export const approvePayment = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.userId;
    const parsed = idValidator.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment id",
        errors: parsed.error.issues,
      });
    }

    const paymentId = parsed.data.id;
    const verifiedAmount = parseVerifiedAmount(req.body.verifiedAmount);

    if (verifiedAmount === null) {
      return res.status(400).json({
        success: false,
        message: "verifiedAmount must be a valid number",
      });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.paymentVerification.update({
        where: {
          id: paymentId,
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

    return res.json({
      success: true,
      message: "Payment approved",
      data: payment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Approval failed",
    });
  }
};

const parseVerifiedAmount = (value: unknown): number | undefined | null => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
};

/*
  REJECT PAYMENT
*/
export const rejectPayment = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.userId;
    const parsed = idValidator.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment id",
        errors: parsed.error.issues,
      });
    }

    const paymentId = parsed.data.id;

    const { reason } = req.body;

    const payment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.paymentVerification.update({
        where: {
          id: paymentId,
        },
        data: {
          status: VerificationStatus.REJECTED,
          verifiedAt: new Date(),
          verifiedByAdminId: adminId,
          rejectionReason: reason || "Not Specified",
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

    return res.json({
      success: true,
      message: "Payment rejected",
      data: payment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Rejection failed",
    });
  }
};
