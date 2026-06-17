import axios, { AxiosInstance } from "axios";
import type {
  ApiEnvelope,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  AdminRegisterPayload,
  PaymentVerification,
} from "@/types/api";

export class BuildXSDK {
  private client: AxiosInstance;

  constructor(baseURL: string = "http://localhost:5006") {
    this.client = axios.create({
      baseURL,
      withCredentials: true,
    });
  }

  // --- AUTHENTICATION MODULE ---
  public auth = {
    /**
     * Authenticate and log in a verified user
     */
    login: async (payload: LoginPayload): Promise<ApiEnvelope<AuthUser>> => {
      const response = await this.client.post<ApiEnvelope<AuthUser>>(
        "/api/auth/login",
        payload
      );
      return response.data;
    },

    /**
     * Register a new user account with payment proof receipt slip
     */
    register: async (payload: RegisterPayload): Promise<ApiEnvelope<AuthUser>> => {
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

      const response = await this.client.post<ApiEnvelope<AuthUser>>(
        "/api/auth/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },

    /**
     * Register a new allowlisted administrator
     */
    registerAdmin: async (payload: AdminRegisterPayload): Promise<ApiEnvelope<AuthUser>> => {
      const response = await this.client.post<ApiEnvelope<AuthUser>>(
        "/api/auth/admin/register",
        payload
      );
      return response.data;
    },

    /**
     * Authenticate and log in an administrator
     */
    loginAdmin: async (payload: LoginPayload): Promise<ApiEnvelope<AuthUser>> => {
      const response = await this.client.post<ApiEnvelope<AuthUser>>(
        "/api/auth/admin/login",
        payload
      );
      return response.data;
    },

    /**
     * Change password for the currently logged in administrator
     */
    changePasswordAdmin: async (payload: { currentPassword: string; newPassword: string }): Promise<ApiEnvelope<null>> => {
      const response = await this.client.patch<ApiEnvelope<null>>(
        "/api/auth/admin/change-password",
        payload
      );
      return response.data;
    },

    /**
     * Clear HTTP-only session cookies and log out
     */
    logout: async (): Promise<ApiEnvelope<null>> => {
      const response = await this.client.post<ApiEnvelope<null>>("/api/auth/logout");
      return response.data;
    },

    /**
     * Retrieve the profile details of the authenticated user
     */
    profile: async (): Promise<ApiEnvelope<AuthUser>> => {
      const response = await this.client.get<ApiEnvelope<AuthUser>>("/api/user/profile");
      return response.data;
    },
  };

  // --- PAYMENTS MANAGEMENT MODULE ---
  public payments = {
    /**
     * Upload or resubmit a payment receipt screenshot
     */
    uploadReceipt: async (payload: { submittedAmount?: string; paymentReceipt: File }): Promise<ApiEnvelope<PaymentVerification>> => {
      const formData = new FormData();
      if (payload.submittedAmount) {
        formData.append("submittedAmount", payload.submittedAmount);
      }
      formData.append("paymentReceipt", payload.paymentReceipt);

      const response = await this.client.post<ApiEnvelope<PaymentVerification>>(
        "/api/payments/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },

    /**
     * Retrieve a list of all pending payment verifications (Admin only)
     */
    getPending: async (): Promise<ApiEnvelope<PaymentVerification[]>> => {
      const response = await this.client.get<ApiEnvelope<PaymentVerification[]>>(
        "/api/admin/payments/pending"
      );
      return response.data;
    },

    /**
     * Approve a payment verification and verify the linked user account (Admin only)
     */
    approve: async (id: string, verifiedAmount?: number): Promise<ApiEnvelope<PaymentVerification>> => {
      const response = await this.client.patch<ApiEnvelope<PaymentVerification>>(
        `/api/admin/payments/${id}/approve`,
        { verifiedAmount }
      );
      return response.data;
    },

    /**
     * Reject a payment verification and set rejection status (Admin only)
     */
    reject: async (id: string, reason?: string): Promise<ApiEnvelope<PaymentVerification>> => {
      const response = await this.client.patch<ApiEnvelope<PaymentVerification>>(
        `/api/admin/payments/${id}/reject`,
        { reason }
      );
      return response.data;
    },
  };

  // --- ADMIN USER MODERATION MODULE ---
  public adminUsers = {
    /**
     * Retrieve a list of all registered normal users (Admin only)
     */
    listUsers: async (filters?: { status?: string; name?: string; institution?: string }): Promise<ApiEnvelope<AuthUser[]>> => {
      const response = await this.client.get<ApiEnvelope<AuthUser[]>>("/api/admin/users", {
        params: filters,
      });
      return response.data;
    },

    /**
     * Retrieve details of a specific user by ID (Admin only)
     */
    getUser: async (id: string): Promise<ApiEnvelope<AuthUser>> => {
      const response = await this.client.get<ApiEnvelope<AuthUser>>(`/api/admin/users/${id}`);
      return response.data;
    },

    /**
     * Update details of a specific user (Admin only)
     */
    updateUser: async (id: string, payload: Partial<Omit<AuthUser, "id" | "role">>): Promise<ApiEnvelope<AuthUser>> => {
      const response = await this.client.patch<ApiEnvelope<AuthUser>>(
        `/api/admin/users/${id}`,
        payload
      );
      return response.data;
    },

    /**
     * Delete a specific user profile and record deletion log (Admin only)
     */
    deleteUser: async (id: string): Promise<ApiEnvelope<{ deletedEmail: string }>> => {
      const response = await this.client.delete<ApiEnvelope<{ deletedEmail: string }>>(
        `/api/admin/users/${id}`
      );
      return response.data;
    },

    /**
     * Update the currently logged in administrator's profile details (Admin only)
     */
    updateAdminProfile: async (payload: { name?: string; email?: string; contact?: string; institution?: string }): Promise<ApiEnvelope<AuthUser>> => {
      const response = await this.client.patch<ApiEnvelope<AuthUser>>(
        "/api/admin/admins/me",
        payload
      );
      return response.data;
    },
  };
}
