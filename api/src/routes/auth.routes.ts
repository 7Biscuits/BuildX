import { Router } from "express";
import {
  changeAdminPassword,
  login,
  loginAdmin,
  logout,
  register,
  registerAdmin,
} from "../controllers/auth.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { paymentReceiptUpload } from "../middleware/multer.middleware";

export const authRouter: Router = Router();

/*
    @route   POST /api/auth/register
    @desc    Register a new user
    @access  Public
*/
authRouter.post("/register", paymentReceiptUpload, register);

/*
    @route   POST /api/auth/login
    @desc    Login user
    @access  Public
*/
authRouter.post("/login", login);

/*
    @route   POST /api/auth/admin/register
    @desc    Register an allowlisted admin
    @access  Public
*/
authRouter.post("/admin/register", registerAdmin);

/*
    @route   POST /api/auth/admin/login
    @desc    Login admin
    @access  Public
*/
authRouter.post("/admin/login", loginAdmin);

/*
    @route   PATCH /api/auth/admin/change-password
    @desc    Change admin password
    @access  Admin
*/
authRouter.patch(
  "/admin/change-password",
  authenticate,
  authorize(["ADMIN"]),
  changeAdminPassword,
);

/*
    @route   POST /api/auth/logout
    @desc    Logout user
    @access  Private
*/
authRouter.post("/logout", authenticate, logout);
