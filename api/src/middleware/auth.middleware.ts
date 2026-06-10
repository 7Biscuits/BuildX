import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { UserRole } from "../../generated/prisma/client";
import { env } from "../config/env";
import { fail } from "../utils/http";

const jwtPayloadValidator = z.object({
  userId: z.uuid(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]),
});

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = getAuthToken(req);

  if (!token) return fail(res, 401, "Unauthorized");

  try {
    const decoded = jwtPayloadValidator.parse(jwt.verify(token, env.JWT_SECRET));
    req.user = decoded;
    next();
  } catch (err) {
    return fail(res, 401, "Invalid jwt token");
  }
};

const getAuthToken = (req: Request) => {
  const cookieToken = req.cookies?.token;
  if (typeof cookieToken === "string") return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return undefined;
};

// Middleware to restrict access based on roles
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return fail(res, 403, "Forbidden: Insufficient permissions");
    }
    next();
  };
};
