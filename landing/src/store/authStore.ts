import { create } from "zustand";
import type { AuthUser, LoginPayload, RegisterPayload, AdminRegisterPayload } from "@/types/api";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | null;
type AuthAction = "login" | "register" | "admin-login" | "admin-register" | null;

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: null,
  verificationStatus: null,
  isAuthenticated: false,
  status: "idle",
  message: null,
  lastAuthAction: null,

  async checkAuth() {
    // Keep user as null for previewing registration/login tabs
    set({ user: null, isAuthenticated: false, status: "idle" });
  },

  async login(payload) {
    set({ status: "loading", message: null });
    setTimeout(() => {
      // Simulate validation error or mock success
      if (!payload.email.includes("@")) {
        set({
          status: "error",
          message: "Validation error: Invalid email address",
          lastAuthAction: null,
        });
      } else {
        set({
          status: "idle",
          message: "Mock Login: System active. Real API connection disabled for preview.",
          lastAuthAction: "login",
        });
      }
    }, 800);
  },

  async loginAdmin(payload) {
    set({ status: "loading", message: null });
    setTimeout(() => {
      set({
        status: "idle",
        message: "Mock Admin Login: Real API connection disabled for preview.",
        lastAuthAction: "admin-login",
      });
    }, 800);
  },

  async register(payload) {
    set({ status: "loading", message: null });
    return new Promise((resolve) => {
      setTimeout(() => {
        set({
          status: "idle",
          message: "✓ Registration receipt submitted! User account created (Payment verification: PENDING). [PREVIEW MODE]",
          lastAuthAction: "register",
        });
        resolve(true);
      }, 1200);
    });
  },

  async registerAdmin(payload) {
    set({ status: "loading", message: null });
    setTimeout(() => {
      set({
        status: "idle",
        message: "Mock Admin Registered! Real API connection disabled for preview.",
        lastAuthAction: "admin-register",
      });
    }, 800);
  },

  async logout() {
    set({
      user: null,
      token: null,
      role: null,
      verificationStatus: null,
      isAuthenticated: false,
      status: "idle",
      message: null,
      lastAuthAction: null,
    });
  },

  setToken(token) {
    set({ token });
  },

  setUser(user) {
    set({ 
      user, 
      role: user?.role ?? null,
      verificationStatus: user?.status ?? null,
      isAuthenticated: Boolean(user),
      status: user ? "authenticated" : "idle" 
    });
  },

  clearSession() {
    set({
      user: null,
      token: null,
      role: null,
      verificationStatus: null,
      isAuthenticated: false,
      status: "idle",
      message: null,
      lastAuthAction: null,
    });
  },

  clearMessage() {
    set({ message: null });
  },
}));
