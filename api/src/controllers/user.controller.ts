import { Request, Response } from "express";
import { AccountStatus, UserRole } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  contact: true,
  institution: true,
  status: true,
} as const;

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.USER,
      },
      select: userProfileSelect,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== AccountStatus.VERIFIED) {
      return res.status(403).json({
        success: false,
        message: "Account not verified by admin yet",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};
