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

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export const register = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = registerValidator.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const { name, email, password, contact, institution } = parsed.data;

    if (isAllowedAdminEmail(email)) {
      return res.status(403).json({
        success: false,
        message: "Please use the admin registration route",
      });
    }

    const paymentFile = getUploadedPaymentFile(req);

    if (!paymentFile) {
      return res.status(400).json({
        success: false,
        message: "Payment receipt image is required",
      });
    }

    const submittedAmount = parseSubmittedAmount(req.body.submittedAmount);

    if (submittedAmount === null) {
      return res.status(400).json({
        success: false,
        message: "submittedAmount must be a valid number",
      });
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
        return res.status(409).json({
          success: false,
          message: "User already exists",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials for payment resubmission",
        });
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

      return res.status(200).json({
        success: true,
        message: "Payment receipt resubmitted. Verification is pending.",
        data: user,
      });
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

    return res.status(201).json({
      success: true,
      message: "Account created. Payment verification is pending.",
      data: user,
    });
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    if (error instanceof StorageUploadError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parsed = loginValidator.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.role === UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Please use the admin login route",
      });
    }

    if (user.status === AccountStatus.REJECTED) {
      return res.status(403).json({
        success: false,
        message: "Payment verification was rejected. Please resubmit a valid receipt.",
      });
    }

    if (user.status !== AccountStatus.VERIFIED) {
      return res.status(403).json({
        success: false,
        message: "Account not verified by admin yet",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    console.error("LOGIN_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const registerAdmin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = adminRegisterValidator.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const { name, email, institution, password } = parsed.data;

    if (!ADMIN_DEFAULT_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Admin registration is not configured",
      });
    }

    if (!isAllowedAdminEmail(email) || password !== ADMIN_DEFAULT_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin registration credentials",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Admin account already exists",
      });
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

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: admin,
    });
  } catch (error) {
    console.error("ADMIN_REGISTER_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginAdmin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = loginValidator.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
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
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
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
    console.error("ADMIN_LOGIN_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const changeAdminPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const parsed = adminChangePasswordValidator.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const adminId = (req as any).user?.userId;
    const { currentPassword, newPassword } = parsed.data;

    const admin = await prisma.user.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
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

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("ADMIN_CHANGE_PASSWORD_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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
    JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const logout = async (_: Request, res: Response): Promise<Response> => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
