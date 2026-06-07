import { Router } from "express";
import {
  getPendingPayments,
  approvePayment,
  rejectPayment,
} from "../controllers/admin.payment.controller";
import {
  deleteUser,
  getAccountByEmail,
  getUserByContact,
  getUserById,
  getUsers,
  updateOwnAdminAccount,
  updateUser,
} from "../controllers/admin.user.controller";

import { authenticate, authorize } from "../middleware/auth.middleware";

export const adminRouter = Router();

/*
  PROTECT ALL ADMIN ROUTES
*/
adminRouter.use(authenticate);
adminRouter.use(authorize(["ADMIN"]));

/*
  ADMIN ONLY ROUTES
*/
adminRouter.get("/payments/pending", getPendingPayments);
adminRouter.patch("/payments/:id/approve", approvePayment);
adminRouter.patch("/payments/:id/reject", rejectPayment);
adminRouter.get("/users", getUsers);
adminRouter.get("/users/email/:email", getAccountByEmail);
adminRouter.get("/users/contact/:contact", getUserByContact);
adminRouter.get("/users/:id", getUserById);
adminRouter.patch("/users/:id", updateUser);
adminRouter.delete("/users/:id", deleteUser);
adminRouter.patch("/admins/me", updateOwnAdminAccount);
