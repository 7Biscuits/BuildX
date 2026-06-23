import { AxiosError, isAxiosError } from "axios";
import { API_BASE_URL } from "./client";

type ApiErrorPayload = {
  message?: string;
  errors?: Array<{
    message?: string;
    path?: Array<string | number>;
  }>;
};

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data;

    if (data?.message === "Account not verified by admin yet") {
      return "Wait until admin has verified your payment receipt.";
    }

    if (data?.message === "Admin account already exists") {
      return "Admin account already exists. Please log in instead.";
    }

    if (data?.message?.toLowerCase().includes("payment verification was rejected")) {
      return "Payment rejected. Please upload a valid payment receipt.";
    }

    if (data?.errors?.length) {
      return data.errors
        .map((issue) => {
          const path = issue.path?.join(".") || "field";
          return `${path}: ${issue.message ?? "Invalid value"}`;
        })
        .join(" | ");
    }

    if (data?.message) return data.message;

    if (error.message === "Network Error") {
      return `Unable to reach the API at ${API_BASE_URL}. Check that the backend is running and the frontend env points to the correct port.`;
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getAxiosStatus(error: unknown) {
  return error instanceof AxiosError ? error.response?.status : undefined;
}
