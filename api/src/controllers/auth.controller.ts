// auth.controller.ts

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import {
  adminChangePasswordValidator,
  adminRegisterValidator,
  loginValidator,
  registerValidator,
} from "../validators/auth.validator";
import { getUploadedPaymentFile } from "../middleware/multer.middleware";
import {
  StorageUploadError,
  uploadPaymentSlip,
} from "../utils/upload.util";
import {
  AccountStatus,
  VerificationStatus,
  UserRole,
} from "../../generated/prisma/client";
import { env, isProduction } from "../config/env";
import { logger } from "../lib/logger";
import { created, fail, ok, validationFail } from "../utils/http";

export const register = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = registerValidator.safeParse(req.body);

    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const { name, email, password, contact, institution } = parsed.data;

    if (isAllowedAdminEmail(email)) {
      return fail(res, 403, "Please use the admin registration route");
    }

    const paymentFile = getUploadedPaymentFile(req);

    if (!paymentFile) {
      return fail(res, 400, "Payment receipt image is required");
    }

    const submittedAmount = parseSubmittedAmount(req.body.submittedAmount);

    if (submittedAmount === null) {
      return fail(res, 400, "submittedAmount must be a valid number");
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        paymentVerification: true,
      },
    });

    if (existingUser) {
      if (existingUser.status !== AccountStatus.REJECTED) {
        return fail(res, 409, "User already exists");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!isPasswordValid) {
        return fail(res, 401, "Invalid credentials for payment resubmission");
      }

      const { publicUrl: paymentSlipUrl } = await uploadPaymentSlip({
        fileBuffer: paymentFile.buffer,
        mimeType: paymentFile.mimetype,
        userId: existingUser.id,
      });

      const user = await prisma.$transaction(async (tx) => {
        await tx.paymentVerification.upsert({
          where: { userId: existingUser.id },
          create: {
            userId: existingUser.id,
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

        return tx.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            contact,
            institution,
            status: AccountStatus.PENDING,
          },
          select: userResponseSelect,
        });
      });

      return ok(res, user, "Payment receipt resubmitted. Verification is pending.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = randomUUID();
    const { publicUrl: paymentSlipUrl } = await uploadPaymentSlip({
      fileBuffer: paymentFile.buffer,
      mimeType: paymentFile.mimetype,
      userId,
    });

    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        password: hashedPassword,
        contact,
        institution,
        status: AccountStatus.PENDING,
        paymentVerification: {
          create: {
            paymentSlipUrl,
            submittedAmount,
            status: VerificationStatus.PENDING,
          },
        },
      },
      select: userResponseSelect,
    });

    return created(res, user, "User registered successfully. Payment verification is pending.");
  } catch (error) {
    logger.error("REGISTER_ERROR", { error });

    if (error instanceof StorageUploadError) {
      return fail(res, error.statusCode, error.message);
    }

    return fail(res, 500, "Internal server error");
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parsed = loginValidator.safeParse(req.body);

    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return fail(res, 401, "Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return fail(res, 401, "Invalid credentials");
    }

    if (user.role === UserRole.ADMIN) {
      return fail(res, 403, "Please use the admin login route");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        institution: user.institution,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    logger.error("LOGIN_ERROR", { error });

    return fail(res, 500, "Internal server error");
  }
};

export const registerAdmin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = adminRegisterValidator.safeParse(req.body);

    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const { name, email, institution, password } = parsed.data;

    if (!env.ADMIN_DEFAULT_PASSWORD) {
      return fail(res, 500, "Admin registration is not configured");
    }

    if (!isAllowedAdminEmail(email) || password !== env.ADMIN_DEFAULT_PASSWORD) {
      return fail(res, 401, "Invalid admin registration credentials");
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return fail(res, 409, "Admin account already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        contact: "N/A",
        institution,
        role: UserRole.ADMIN,
        status: AccountStatus.VERIFIED,
      },
      select: userResponseSelect,
    });

    return created(res, admin, "Admin account created successfully");
  } catch (error) {
    logger.error("ADMIN_REGISTER_ERROR", { error });

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return fail(res, 409, "Admin account already exists");
    }

    return fail(res, 500, "Internal server error");
  }
};

export const loginAdmin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = loginValidator.safeParse(req.body);

    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const { email, password } = parsed.data;

    const admin = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (
      !admin ||
      admin.role !== UserRole.ADMIN ||
      !isAllowedAdminEmail(admin.email)
    ) {
      return fail(res, 401, "Invalid admin credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return fail(res, 401, "Invalid admin credentials");
    }

    const token = createAuthToken(admin.id, admin.role);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        contact: admin.contact,
        institution: admin.institution,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    logger.error("ADMIN_LOGIN_ERROR", { error });

    return fail(res, 500, "Internal server error");
  }
};

export const changeAdminPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = adminChangePasswordValidator.safeParse(req.body);

    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const adminId = req.user?.userId;
    const { currentPassword, newPassword } = parsed.data;

    const admin = await prisma.user.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      return fail(res, 403, "Forbidden");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password,
    );

    if (!isPasswordValid) {
      return fail(res, 401, "Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: admin.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    logger.error("ADMIN_CHANGE_PASSWORD_ERROR", { error });

    return fail(res, 500, "Internal server error");
  }
};

const userResponseSelect = {
  id: true,
  name: true,
  email: true,
  contact: true,
  institution: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

const parseSubmittedAmount = (value: unknown): number | undefined | null => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
};

const getAllowedAdminEmails = () => {
  return env.ADMIN_EMAILS;
};

const isAllowedAdminEmail = (email: string) => {
  return getAllowedAdminEmails().includes(email);
};

const createAuthToken = (userId: string, role: string) => {
  return jwt.sign(
    {
      userId,
      role,
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const logout = async (_: Request, res: Response): Promise<Response> => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getCurrentSessionUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return fail(res, 401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userResponseSelect,
    });

    if (!user) {
      return fail(res, 404, "User not found");
    }

    return ok(res, user);
  } catch (error) {
    logger.error("AUTH_ME_ERROR", { error });
    return fail(res, 500, "Internal server error");
  }
};
