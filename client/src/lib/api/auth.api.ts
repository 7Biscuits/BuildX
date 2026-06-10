import { api } from "./client";
import type {
  ApiEnvelope,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  AdminRegisterPayload,
} from "@/types/api";

export async function login(payload: LoginPayload): Promise<ApiEnvelope<AuthUser>> {
  const response = await api.post<ApiEnvelope<AuthUser>>("/api/auth/login", payload);
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<ApiEnvelope<AuthUser>> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("email", payload.email);
  formData.append("password", payload.password);
  formData.append("contact", payload.contact);
  formData.append("institution", payload.institution);
  if (payload.submittedAmount) {
    formData.append("submittedAmount", payload.submittedAmount);
  }
  formData.append("paymentReceipt", payload.paymentReceipt);

  const response = await api.post<ApiEnvelope<AuthUser>>(
    "/api/auth/register",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function registerAdmin(
  payload: AdminRegisterPayload
): Promise<ApiEnvelope<AuthUser>> {
  const response = await api.post<ApiEnvelope<AuthUser>>(
    "/api/auth/admin/register",
    payload
  );
  return response.data;
}

export async function loginAdmin(
  payload: LoginPayload
): Promise<ApiEnvelope<AuthUser>> {
  const response = await api.post<ApiEnvelope<AuthUser>>(
    "/api/auth/admin/login",
    payload
  );
  return response.data;
}

export async function changePasswordAdmin(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiEnvelope<null>> {
  const response = await api.patch<ApiEnvelope<null>>(
    "/api/auth/admin/change-password",
    payload
  );
  return response.data;
}

export async function logout(): Promise<ApiEnvelope<null>> {
  const response = await api.post<ApiEnvelope<null>>("/api/auth/logout");
  return response.data;
}

export async function profile(): Promise<ApiEnvelope<AuthUser>> {
  const response = await api.get<ApiEnvelope<AuthUser>>("/api/user/profile");
  return response.data;
}

export async function me(): Promise<ApiEnvelope<AuthUser>> {
  const response = await api.get<ApiEnvelope<AuthUser>>("/api/auth/me");
  return response.data;
}
