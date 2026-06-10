// payment.controller.ts

import { Request, Response } from "express";
import {
  StorageUploadError,
  uploadPaymentSlip as uploadPaymentSlipToStorage,
} from "../utils/upload.util";
import { getUploadedPaymentFile } from "../middleware/multer.middleware";
import { submitPendingPaymentVerification } from "../services/payment-verification.service";
import "multer";
import { fail, ok } from "../utils/http";

export const uploadPaymentSlip = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const paymentFile = getUploadedPaymentFile(req);

    if (!paymentFile) {
      return fail(res, 400, "No file uploaded");
    }

    const { publicUrl } = await uploadPaymentSlipToStorage({
      fileBuffer: paymentFile.buffer,
      mimeType: paymentFile.mimetype,
      userId,
    });

    const submittedAmount = parseSubmittedAmount(req.body.submittedAmount);

    if (submittedAmount === null) {
      return fail(res, 400, "submittedAmount must be a valid number");
    }

    const payment = await submitPendingPaymentVerification({
      userId,
      paymentSlipUrl: publicUrl,
      submittedAmount,
    });

    return ok(res, payment, "Payment submitted");
  } catch (err) {
    if (err instanceof StorageUploadError) {
      return fail(res, err.statusCode, err.message);
    }

    return fail(res, 500, "Server error");
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
