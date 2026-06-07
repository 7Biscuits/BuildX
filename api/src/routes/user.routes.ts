import { Router } from "express";
import { getProfile } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const userRouter: Router = Router();

userRouter.use(authenticate);
userRouter.use(authorize(["USER"]));

/*
  @route   GET /api/user/profile
  @desc    Get logged-in verified user's profile
  @access  User
*/
userRouter.get("/profile", getProfile);
