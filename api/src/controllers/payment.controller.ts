// payment.controller.ts

import { Request, Response } from "express";
import {
  StorageUploadError,
  uploadPaymentSlip as uploadPaymentSlipToStorage,
} from "../utils/upload.util";
import { getUploadedPaymentFile } from "../middleware/multer.middleware";
import { submitPendingPaymentVerification } from "../services/payment-verification.service";
import "multer";

export const uploadPaymentSlip = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const paymentFile = getUploadedPaymentFile(req);

    if (!paymentFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { publicUrl } = await uploadPaymentSlipToStorage({
      fileBuffer: paymentFile.buffer,
      mimeType: paymentFile.mimetype,
      userId,
    });

    const submittedAmount = parseSubmittedAmount(req.body.submittedAmount);

    if (submittedAmount === null) {
      return res.status(400).json({
        success: false,
        message: "submittedAmount must be a valid number",
      });
    }

    const payment = await submitPendingPaymentVerification({
      userId,
      paymentSlipUrl: publicUrl,
      submittedAmount,
    });

    return res.json({
      success: true,
      message: "Payment submitted",
      data: payment,
    });
  } catch (err) {
    if (err instanceof StorageUploadError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const parseSubmittedAmount = (value: unknown): number | undefined | null => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
};
