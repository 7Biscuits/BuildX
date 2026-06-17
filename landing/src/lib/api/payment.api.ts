import { api } from "./client";
import type { ApiEnvelope, PaymentVerification } from "@/types/api";

export async function uploadReceipt(payload: {
  submittedAmount?: string;
  paymentReceipt: File;
}): Promise<ApiEnvelope<PaymentVerification>> {
  const formData = new FormData();

  if (payload.submittedAmount) {
    formData.append("submittedAmount", payload.submittedAmount);
  }

  formData.append("paymentReceipt", payload.paymentReceipt);

  const response = await api.post<ApiEnvelope<PaymentVerification>>(
    "/api/payments/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}
