import { z } from "zod";
import { AccountStatus } from "../../generated/prisma/client";

export const emailParamValidator = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
});

export const contactParamValidator = z.object({
  contact: z
    .string()
    .trim()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number cannot exceed 15 digits")
    .regex(/^\+?[0-9]+$/, "Invalid contact number"),
});

export const userQueryValidator = z.object({
  status: z
    .enum([
      AccountStatus.PENDING,
      AccountStatus.VERIFIED,
      AccountStatus.REJECTED,
    ])
    .optional(),
  name: z.string().trim().min(1).optional(),
  institution: z.string().trim().min(1).optional(),
});

export const updateUserValidator = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    email: z.email("Invalid email address").trim().toLowerCase().optional(),
    contact: z
      .string()
      .trim()
      .min(10, "Contact number must be at least 10 digits")
      .max(15, "Contact number cannot exceed 15 digits")
      .regex(/^\+?[0-9]+$/, "Invalid contact number")
      .optional(),
    institution: z
      .string()
      .trim()
      .min(2, "Institution name is required")
      .max(200, "Institution name cannot exceed 200 characters")
      .optional(),
    status: z
      .enum([
        AccountStatus.PENDING,
        AccountStatus.VERIFIED,
        AccountStatus.REJECTED,
      ])
      .optional(),
  })
  .strict();

export const updateAdminSelfValidator = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    email: z.email("Invalid email address").trim().toLowerCase().optional(),
    contact: z
      .string()
      .trim()
      .min(2, "Contact is required")
      .max(30, "Contact cannot exceed 30 characters")
      .optional(),
    institution: z
      .string()
      .trim()
      .min(2, "Institution name is required")
      .max(200, "Institution name cannot exceed 200 characters")
      .optional(),
  })
  .strict();
