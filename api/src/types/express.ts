import type { UserRole } from "../../generated/prisma/client";

export type AuthenticatedUser = {
  userId: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
