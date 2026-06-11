import { create } from "zustand";
import { authApi } from "@/lib/api";
import {
  API_BASE_URL,
  getStoredAuthToken,
  setStoredAuthToken,
  subscribeToAuthLogout,
} from "@/lib/api/client";
import type { AuthUser, LoginPayload, RegisterPayload, AdminRegisterPayload } from "@/types/api";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | null;
type AuthAction = "login" | "register" | "admin-login" | "admin-register" | null;

const AUTH_USER_KEY = "buildx.auth.user";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  role: AuthUser["role"] | null;
  verificationStatus: VerificationStatus;
  isAuthenticated: boolean;
  status: AuthStatus;
  message: string | null;
  lastAuthAction: AuthAction;
  checkAuth: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  loginAdmin: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  registerAdmin: (payload: AdminRegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  clearSession: () => void;
  clearMessage: () => void;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { 
      message?: string; 
      errors?: { message: string; path: string[] }[] 
    };
    if (data.message === "Account not verified by admin yet") {
      return "Wait until admin has verified your payment receipt.";
    }

    if (data.message === "Admin account already exists") {
      return "Admin account already exists. Please log in instead.";
    }

    if (data.message?.toLowerCase().includes("payment verification was rejected")) {
      return "Payment rejected. Please upload a valid payment receipt.";
    }

    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(" | ");
    }
    return data.message ?? "Something went wrong.";
  }
  if (error instanceof Error && error.message === "Network Error") {
    return `Unable to reach the API at ${API_BASE_URL}. Check that the backend is running and the frontend env points to the correct port.`;
  }
  return "Something went wrong.";
}

function getStoredUser() {
  try {
    const stored = window.localStorage.getItem(AUTH_USER_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_USER_KEY);
  }
}

function sessionFields(user: AuthUser | null, token = getStoredAuthToken()) {
  return {
    user,
    token,
    role: user?.role ?? null,
    verificationStatus: user?.status ?? null,
    isAuthenticated: Boolean(user),
  };
}

const storedUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  ...sessionFields(storedUser),
  status: "loading",
  message: null,
  lastAuthAction: null,

  async checkAuth() {
    try {
      set({ status: "loading" });
      const result = await authApi.me();
      if (result.success && result.data) {
        persistUser(result.data);
        set({
          ...sessionFields(result.data),
          status: "authenticated",
          lastAuthAction: null,
        });
      } else {
        persistUser(null);
        set({ ...sessionFields(null), status: "idle", lastAuthAction: null });
      }
    } catch {
      persistUser(null);
      set({ ...sessionFields(null), status: "idle", lastAuthAction: null });
    }
  },

  async login(payload) {
    set({ status: "loading", message: null });
    try {
      const result = await authApi.login(payload);
      persistUser(result.data);
      set({
        ...sessionFields(result.data),
        status: "authenticated",
        message: result.message ?? "Logged in successfully.",
        lastAuthAction: "login",
      });
    } catch (error) {
      set({
        ...sessionFields(null),
        status: "error",
        message: getErrorMessage(error),
        lastAuthAction: null,
      });
    }
  },

  async loginAdmin(payload) {
    set({ status: "loading", message: null });
    try {
      const result = await authApi.loginAdmin(payload);
      persistUser(result.data);
      set({
        ...sessionFields(result.data),
        status: "authenticated",
        message: result.message ?? "Admin logged in successfully.",
        lastAuthAction: "admin-login",
      });
    } catch (error) {
      set({
        ...sessionFields(null),
        status: "error",
        message: getErrorMessage(error),
        lastAuthAction: null,
      });
    }
  },

  async register(payload) {
    set({ status: "loading", message: null });
    try {
      const result = await authApi.register(payload);
      set({
        ...sessionFields(null),
        status: "idle",
        message:
          result.message ??
          "User registered successfully. Payment verification is pending.",
        lastAuthAction: "register",
      });
      return true;
    } catch (error) {
      set({
        status: "error",
        message: getErrorMessage(error),
        lastAuthAction: null,
      });
      return false;
    }
  },

  async registerAdmin(payload) {
    set({ status: "loading", message: null });
    try {
      const result = await authApi.registerAdmin(payload);
      persistUser(result.data);
      set({
        ...sessionFields(result.data),
        status: "authenticated",
        message: result.message ?? "Admin account created successfully.",
        lastAuthAction: "admin-register",
      });
    } catch (error) {
      set({
        ...sessionFields(null),
        status: "error",
        message: getErrorMessage(error),
        lastAuthAction: null,
      });
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } catch {
      // Ignore network error on logout
    } finally {
      persistUser(null);
      setStoredAuthToken(null);
      set({
        ...sessionFields(null, null),
        status: "idle",
        message: null,
        lastAuthAction: null,
      });
    }
  },

  setToken(token) {
    setStoredAuthToken(token);
    set((state) => ({ ...sessionFields(state.user, token) }));
  },

  setUser(user) {
    persistUser(user);
    set((state) => ({
      ...sessionFields(user, state.token),
      status: user ? "authenticated" : "idle",
      message: state.message,
      lastAuthAction: state.lastAuthAction,
    }));
  },

  clearSession() {
    persistUser(null);
    setStoredAuthToken(null);
    set({
      ...sessionFields(null, null),
      status: "idle",
      message: null,
      lastAuthAction: null,
    });
  },

  clearMessage() {
    set({ message: null });
  },
}));

subscribeToAuthLogout(() => {
  useAuthStore.getState().clearSession();
});
