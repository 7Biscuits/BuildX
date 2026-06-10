import { Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const ok = <T>(res: Response, data: T, message?: string) => {
  return res.json({ success: true, ...(message ? { message } : {}), data });
};

export const created = <T>(res: Response, data: T, message?: string) => {
  return res.status(201).json({ success: true, ...(message ? { message } : {}), data });
};

export const fail = (
  res: Response,
  statusCode: number,
  message: string,
  options?: { code?: string; errors?: unknown[] },
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(options?.code ? { code: options.code } : {}),
    ...(options?.errors ? { errors: options.errors } : {}),
  });
};

export const validationFail = (res: Response, error: ZodError) => {
  return fail(res, 400, "Validation failed", { errors: error.issues });
};
