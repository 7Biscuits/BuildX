import { randomUUID } from "crypto";
import { supabase } from "./supabase";
import { env } from "../config/env";

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

export class StorageDeleteError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500, options?: ErrorOptions) {
    super(message, options);
    this.name = "StorageDeleteError";
    this.statusCode = statusCode;
  }
}

export class StorageReadError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500, options?: ErrorOptions) {
    super(message, options);
    this.name = "StorageReadError";
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

  if (!isAllowedImageMimeType(mimeType) || !hasValidImageSignature(fileBuffer, mimeType)) {
    throw new StorageUploadError("Only image files are allowed", 400);
  }

  const extension = allowedImageTypes[mimeType];
  const filePath = `${userId}/${randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage
    .from(env.PAYMENT_SLIPS_BUCKET)
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
    .from(env.PAYMENT_SLIPS_BUCKET)
    .getPublicUrl(data.path);

  if (!publicUrlData.publicUrl) {
    throw new StorageUploadError("Failed to generate payment slip URL", 500);
  }

  return {
    publicUrl: publicUrlData.publicUrl,
    path: data.path,
  };
};

export const deletePaymentSlipByPublicUrl = async (publicUrl: string | null | undefined) => {
  if (!publicUrl) {
    return;
  }

  const objectPath = getPaymentSlipPathFromPublicUrl(publicUrl);

  if (!objectPath) {
    throw new StorageDeleteError("Failed to resolve payment slip storage path", 500);
  }

  const { error } = await supabase.storage
    .from(env.PAYMENT_SLIPS_BUCKET)
    .remove([objectPath]);

  if (error) {
    throw new StorageDeleteError("Failed to delete payment slip", 500, {
      cause: error,
    });
  }
};

export const createSignedPaymentSlipUrl = async (
  publicUrl: string | null | undefined,
  expiresInSeconds = 60 * 60,
) => {
  if (!publicUrl) {
    return null;
  }

  const objectPath = getPaymentSlipPathFromPublicUrl(publicUrl);

  if (!objectPath) {
    throw new StorageReadError("Failed to resolve payment slip storage path", 500);
  }

  const { data, error } = await supabase.storage
    .from(env.PAYMENT_SLIPS_BUCKET)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new StorageReadError("Failed to generate signed payment slip URL", 500, {
      cause: error,
    });
  }

  return data.signedUrl;
};

const isAllowedImageMimeType = (
  mimeType: string,
): mimeType is AllowedImageMimeType => {
  return Object.hasOwn(allowedImageTypes, mimeType);
};

const getPaymentSlipPathFromPublicUrl = (publicUrl: string) => {
  try {
    const url = new URL(publicUrl);
    const publicPrefix = `/storage/v1/object/public/${env.PAYMENT_SLIPS_BUCKET}/`;

    if (!url.pathname.startsWith(publicPrefix)) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(publicPrefix.length));
  } catch {
    return null;
  }
};

const hasValidImageSignature = (buffer: Buffer, mimeType: AllowedImageMimeType) => {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }

  return false;
};
