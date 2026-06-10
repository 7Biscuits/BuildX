import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { logger } from "../lib/logger";

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err instanceof Error && err.message === "Only image files are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  logger.error("UNHANDLED_ERROR", { error: err });

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
