import { z } from "zod";

export const registerValidator = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),

  email: z.email("Invalid email address").trim().toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password cannot exceed 100 characters"),

  contact: z
    .string()
    .trim()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number cannot exceed 15 digits")
    .regex(/^\+?[0-9]+$/, "Invalid contact number"),

  institution: z
    .string()
    .trim()
    .min(2, "Institution name is required")
    .max(200, "Institution name cannot exceed 200 characters"),
});

export const loginValidator = z.object({
  email: z
    .email("Invalid email address")
    .trim()
    .toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

export const adminRegisterValidator = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),

  email: z.email("Invalid email address").trim().toLowerCase(),

  institution: z
    .string()
    .trim()
    .min(2, "Institution name is required")
    .max(200, "Institution name cannot exceed 200 characters"),

  password: z.string().min(1, "Password is required"),
});

export const adminChangePasswordValidator = z.object({
  currentPassword: z.string().min(1, "Current password is required"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password cannot exceed 100 characters"),
});

export type RegisterInput = z.infer<typeof registerValidator>;
export type LoginInput = z.infer<typeof loginValidator>;
export type AdminRegisterInput = z.infer<typeof adminRegisterValidator>;
export type AdminChangePasswordInput = z.infer<
  typeof adminChangePasswordValidator
>;
