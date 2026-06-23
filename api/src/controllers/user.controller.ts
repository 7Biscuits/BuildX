import { Request, Response } from "express";
import { UserRole } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { fail, ok } from "../utils/http";

const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  contact: true,
  institution: true,
  role: true,
  status: true,
  createdAt: true,
  paymentVerification: {
    select: {
      id: true,
      paymentSlipUrl: true,
      submittedAmount: true,
      verifiedAmount: true,
      status: true,
      rejectionReason: true,
      submittedAt: true,
      verifiedAt: true,
      verifiedByAdminId: true,
    },
  },
} as const;

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.USER,
      },
      select: userProfileSelect,
    });

    if (!user) {
      return fail(res, 404, "User not found");
    }

    return ok(res, user);
  } catch {
    return fail(res, 500, "Failed to fetch profile");
  }
};
