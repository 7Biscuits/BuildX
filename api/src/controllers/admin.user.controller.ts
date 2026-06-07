import { Request, Response } from "express";
import { UserRole } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { idValidator } from "../validators/id.validator";
import {
  contactParamValidator,
  emailParamValidator,
  updateAdminSelfValidator,
  updateUserValidator,
  userQueryValidator,
} from "../validators/admin.user.validator";

const accountSelect = {
  id: true,
  name: true,
  email: true,
  contact: true,
  institution: true,
  role: true,
  status: true,
  deletedUsers: true,
  createdAt: true,
  updatedAt: true,
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

export const getUsers = async (req: Request, res: Response) => {
  try {
    const parsed = userQueryValidator.safeParse(normalizeUserQuery(req.query));

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid filters. status must be PENDING, VERIFIED, or REJECTED.",
        errors: parsed.error.issues,
      });
    }

    const { status, name, institution } = parsed.data;

    const users = await prisma.user.findMany({
      where: {
        role: UserRole.USER,
        ...(status ? { status } : {}),
        ...(name
          ? { name: { contains: name, mode: "insensitive" as const } }
          : {}),
        ...(institution
          ? {
              institution: {
                contains: institution,
                mode: "insensitive" as const,
              },
            }
          : {}),
      },
      select: accountSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
        errors: parsed.error.issues,
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: parsed.data.id,
        role: UserRole.USER,
      },
      select: accountSelect,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

export const getAccountByEmail = async (req: Request, res: Response) => {
  try {
    const parsed = emailParamValidator.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
        errors: parsed.error.issues,
      });
    }

    const account = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: accountSelect,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.json({
      success: true,
      data: account,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account",
    });
  }
};

export const getUserByContact = async (req: Request, res: Response) => {
  try {
    const parsed = contactParamValidator.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact number",
        errors: parsed.error.issues,
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        contact: parsed.data.contact,
        role: UserRole.USER,
      },
      select: accountSelect,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);

    if (!idParsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
        errors: idParsed.error.issues,
      });
    }

    const bodyParsed = updateUserValidator.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid update fields. Admins can update user name, email, contact, institution, or status.",
        errors: bodyParsed.error.issues,
      });
    }

    if (Object.keys(bodyParsed.data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: idParsed.data.id,
        role: UserRole.USER,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: bodyParsed.data,
      select: accountSelect,
    });

    return res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    return handleUniqueConstraintError(err, res, "Failed to update user");
  }
};

export const updateOwnAdminAccount = async (req: Request, res: Response) => {
  try {
    const bodyParsed = updateAdminSelfValidator.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid update fields. Admins can update their own name, email, contact, or institution.",
        errors: bodyParsed.error.issues,
      });
    }

    if (Object.keys(bodyParsed.data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    if (bodyParsed.data.email && !isAllowedAdminEmail(bodyParsed.data.email)) {
      return res.status(403).json({
        success: false,
        message: "Admin email must be allowlisted in the environment",
      });
    }

    const adminId = (req as any).user?.userId;

    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const updatedAdmin = await prisma.user.update({
      where: {
        id: admin.id,
      },
      data: bodyParsed.data,
      select: accountSelect,
    });

    return res.json({
      success: true,
      message: "Admin account updated successfully",
      data: updatedAdmin,
    });
  } catch (err) {
    return handleUniqueConstraintError(
      err,
      res,
      "Failed to update admin account",
    );
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
        errors: parsed.error.issues,
      });
    }

    const adminId = (req as any).user?.userId;

    const user = await prisma.user.findFirst({
      where: {
        id: parsed.data.id,
        role: UserRole.USER,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentVerification.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await tx.user.update({
        where: {
          id: adminId,
        },
        data: {
          deletedUsers: {
            push: user.email,
          },
        },
      });

      await tx.user.delete({
        where: {
          id: user.id,
        },
      });
    });

    return res.json({
      success: true,
      message: "User deleted successfully",
      data: {
        deletedEmail: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

const normalizeUserQuery = (query: Request["query"]) => {
  const normalizedStatus =
    typeof query.status === "string" ? query.status.toUpperCase() : query.status;

  return {
    status: normalizedStatus,
    name: query.name,
    institution: query.institution,
  };
};

const isAllowedAdminEmail = (email: string) => {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((allowedEmail) => allowedEmail.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
};

const handleUniqueConstraintError = (
  err: unknown,
  res: Response,
  fallbackMessage: string,
) => {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "Email already exists",
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};
