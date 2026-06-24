import { Request, Response } from "express";
import { UserRole } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { idValidator } from "../validators/id.validator";
import {
  contactParamValidator,
  emailParamValidator,
  updateAdminSelfValidator,
  updateUserValidator,
  userQueryValidator,
} from "../validators/admin.user.validator";
import { env } from "../config/env";
import {
  createSignedPaymentSlipUrl,
  deletePaymentSlipByPublicUrl,
} from "../utils/upload.util";
import { fail, ok, validationFail } from "../utils/http";

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
      return validationFail(res, parsed.error);
    }

    const { status, query, name, institution } = parsed.data;
    const normalizedQuery = query?.trim();

    const users = await prisma.user.findMany({
      where: {
        role: UserRole.USER,
        ...(status ? { status } : {}),
        ...(normalizedQuery
          ? {
              OR: [
                { id: normalizedQuery },
                { email: { contains: normalizedQuery, mode: "insensitive" as const } },
                { contact: { contains: normalizedQuery, mode: "insensitive" as const } },
                { name: { contains: normalizedQuery, mode: "insensitive" as const } },
                {
                  institution: {
                    contains: normalizedQuery,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
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

    return ok(res, await Promise.all(users.map((user) => signUserPaymentSlip(user))));
  } catch (err) {
    return fail(res, 500, "Failed to fetch users");
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);

    if (!parsed.success) {
      return fail(res, 400, "Invalid user id", {
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
      return fail(res, 404, "User not found");
    }

    return ok(res, await signUserPaymentSlip(user));
  } catch {
    return fail(res, 500, "Failed to fetch user");
  }
};

export const getAccountByEmail = async (req: Request, res: Response) => {
  try {
    const parsed = emailParamValidator.safeParse(req.params);

    if (!parsed.success) {
      return fail(res, 400, "Invalid email", { errors: parsed.error.issues });
    }

    const account = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: accountSelect,
    });

    if (!account) {
      return fail(res, 404, "Account not found");
    }

    return ok(res, await signUserPaymentSlip(account));
  } catch {
    return fail(res, 500, "Failed to fetch account");
  }
};

export const getUserByContact = async (req: Request, res: Response) => {
  try {
    const parsed = contactParamValidator.safeParse(req.params);

    if (!parsed.success) {
      return fail(res, 400, "Invalid contact number", {
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
      return fail(res, 404, "User not found");
    }

    return ok(res, await signUserPaymentSlip(user));
  } catch {
    return fail(res, 500, "Failed to fetch user");
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);

    if (!idParsed.success) {
      return fail(res, 400, "Invalid user id", {
        errors: idParsed.error.issues,
      });
    }

    const bodyParsed = updateUserValidator.safeParse(req.body);

    if (!bodyParsed.success) {
      return fail(
        res,
        400,
        "Invalid update fields. Admins can update user name, email, contact, institution, or status.",
        { errors: bodyParsed.error.issues },
      );
    }

    if (Object.keys(bodyParsed.data).length === 0) {
      return fail(res, 400, "At least one field is required");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: idParsed.data.id,
        role: UserRole.USER,
      },
    });

    if (!existingUser) {
      return fail(res, 404, "User not found");
    }

    const user = await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: bodyParsed.data,
      select: accountSelect,
    });

    return ok(res, await signUserPaymentSlip(user), "User updated successfully");
  } catch (err) {
    return handleUniqueConstraintError(err, res, "Failed to update user");
  }
};

export const updateOwnAdminAccount = async (req: Request, res: Response) => {
  try {
    const bodyParsed = updateAdminSelfValidator.safeParse(req.body);

    if (!bodyParsed.success) {
      return fail(
        res,
        400,
        "Invalid update fields. Admins can update their own name, email, contact, or institution.",
        { errors: bodyParsed.error.issues },
      );
    }

    if (Object.keys(bodyParsed.data).length === 0) {
      return fail(res, 400, "At least one field is required");
    }

    if (bodyParsed.data.email && !isAllowedAdminEmail(bodyParsed.data.email)) {
      return fail(res, 403, "Admin email must be allowlisted in the environment");
    }

    const adminId = req.user?.userId;

    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: UserRole.ADMIN,
      },
    });

    if (!admin) {
      return fail(res, 403, "Forbidden");
    }

    const updatedAdmin = await prisma.user.update({
      where: {
        id: admin.id,
      },
      data: bodyParsed.data,
      select: accountSelect,
    });

    return ok(res, await signUserPaymentSlip(updatedAdmin), "Admin account updated successfully");
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
      return fail(res, 400, "Invalid user id", {
        errors: parsed.error.issues,
      });
    }

    const adminId = req.user?.userId;

    const user = await prisma.user.findFirst({
      where: {
        id: parsed.data.id,
        role: UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        paymentVerification: {
          select: {
            paymentSlipUrl: true,
          },
        },
      },
    });

    if (!user) {
      return fail(res, 404, "User not found");
    }

    try {
      await deletePaymentSlipByPublicUrl(
        user.paymentVerification?.paymentSlipUrl,
      );
    } catch (error) {
      logger.error("USER_PAYMENT_SLIP_DELETE_FAILED", {
        userId: user.id,
        error,
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

    return ok(res, { deletedEmail: user.email }, "User deleted successfully");
  } catch (error) {
    logger.error("DELETE_USER_FAILED", {
      userId: req.params.id,
      error,
    });
    return fail(res, 500, "Failed to delete user");
  }
};

const normalizeUserQuery = (query: Request["query"]) => {
  const normalizedStatus =
    typeof query.status === "string" ? query.status.toUpperCase() : query.status;

  return {
    status: normalizedStatus,
    query: query.query,
    name: query.name,
    institution: query.institution,
  };
};

const isAllowedAdminEmail = (email: string) => {
  return env.ADMIN_EMAILS.includes(email);
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
    return fail(res, 409, "Email already exists");
  }

  return fail(res, 500, fallbackMessage);
};

const signUserPaymentSlip = async <
  T extends { paymentVerification: null | { paymentSlipUrl: string | null } }
>(user: T) => {
  if (!user.paymentVerification) {
    return user;
  }

  return {
    ...user,
    paymentVerification: {
      ...user.paymentVerification,
      paymentSlipUrl: await createSignedPaymentSlipUrl(
        user.paymentVerification.paymentSlipUrl,
      ),
    },
  };
};
