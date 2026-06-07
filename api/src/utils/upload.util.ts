import { randomUUID } from "crypto";
import { supabase } from "./supabase";

const PAYMENT_SLIPS_BUCKET = "payment-slips";

const allowedImageTypes = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageMimeType = keyof typeof allowedImageTypes;

export type UploadPaymentSlipInput = {
  fileBuffer: Buffer;
  mimeType: string;
  userId: string;
};

export type UploadedPaymentSlip = {
  publicUrl: string;
  path: string;
};

export class StorageUploadError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500, options?: ErrorOptions) {
    super(message, options);
    this.name = "StorageUploadError";
    this.statusCode = statusCode;
  }
}

export const uploadPaymentSlip = async ({
  fileBuffer,
  mimeType,
  userId,
}: UploadPaymentSlipInput): Promise<UploadedPaymentSlip> => {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new StorageUploadError("File buffer is empty", 400);
  }

  if (!isAllowedImageMimeType(mimeType)) {
    throw new StorageUploadError("Only image files are allowed", 400);
  }

  const extension = allowedImageTypes[mimeType];
  const filePath = `${userId}/${randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage
    .from(PAYMENT_SLIPS_BUCKET)
    .upload(filePath, fileBuffer, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new StorageUploadError("Failed to upload payment slip", 500, {
      cause: error,
    });
  }

  const { data: publicUrlData } = supabase.storage
    .from(PAYMENT_SLIPS_BUCKET)
    .getPublicUrl(data.path);

  if (!publicUrlData.publicUrl) {
    throw new StorageUploadError("Failed to generate payment slip URL", 500);
  }

  return {
    publicUrl: publicUrlData.publicUrl,
    path: data.path,
  };
};

const isAllowedImageMimeType = (
  mimeType: string,
): mimeType is AllowedImageMimeType => {
  return Object.hasOwn(allowedImageTypes, mimeType);
};
