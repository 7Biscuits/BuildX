import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { paymentReceiptUpload } from "../middleware/multer.middleware";
import { uploadPaymentSlip } from "../controllers/payment.controller";

export const paymentRouter = Router();

/*
  @route   POST /api/payments/upload
  @desc    Upload payment slip for verification
  @access  Private (logged-in user)
*/
paymentRouter.post(
  "/upload",
  authenticate,
  authorize(["USER"]),
  paymentReceiptUpload,
  uploadPaymentSlip,
);
