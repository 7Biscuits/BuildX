import { create } from "zustand";
import { adminUserApi, paymentApi } from "@/lib/api";
import type {
  AccountStatus,
  AdminManagedUser,
  AdminUserFilters,
  AuthUser,
  PaymentVerification,
} from "@/types/api";

export type AdminSection =
  | "overview"
  | "verifications"
  | "users"
  | "admin"
  | "quizzes"
  | "settings";

type AdminDashboardState = {
  activeSection: AdminSection;
  pendingVerifications: PaymentVerification[];
  pendingLoading: boolean;
  pendingError: string | null;
  users: AdminManagedUser[];
  usersLoading: boolean;
  usersError: string | null;
  userFilters: AdminUserFilters;
  adminLookupResult: AdminManagedUser | null;
  adminLookupLoading: boolean;
  adminLookupError: string | null;
  profileSaving: boolean;
  setActiveSection: (section: AdminSection) => void;
  setUserFilters: (filters: Partial<AdminUserFilters>) => void;
  resetUserFilters: () => void;
  loadPendingVerifications: () => Promise<void>;
  approveVerification: (id: string, verifiedAmount?: number) => Promise<void>;
  rejectVerification: (id: string, reason?: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  saveUser: (
    id: string,
    payload: Partial<
      Omit<AdminManagedUser, "id" | "role" | "deletedUsers" | "paymentVerification">
    >,
  ) => Promise<AdminManagedUser>;
  deleteUser: (id: string) => Promise<{ deletedEmail: string }>;
  findAdminByEmail: (email: string) => Promise<AdminManagedUser | null>;
  clearAdminLookup: () => void;
  updateOwnAdminProfile: (
    payload: Pick<AuthUser, "name" | "email" | "contact" | "institution">,
  ) => Promise<AdminManagedUser>;
};

const DEFAULT_FILTERS: AdminUserFilters = {
  status: "",
  query: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export const useAdminDashboardStore = create<AdminDashboardState>((set, get) => ({
  activeSection: "overview",
  pendingVerifications: [],
  pendingLoading: false,
  pendingError: null,
  users: [],
  usersLoading: false,
  usersError: null,
  userFilters: DEFAULT_FILTERS,
  adminLookupResult: null,
  adminLookupLoading: false,
  adminLookupError: null,
  profileSaving: false,

  setActiveSection(section) {
    set({ activeSection: section });
  },

  setUserFilters(filters) {
    set((state) => ({
      userFilters: {
        ...state.userFilters,
        ...filters,
      },
    }));
  },

  resetUserFilters() {
    set({ userFilters: DEFAULT_FILTERS });
  },

  async loadPendingVerifications() {
    set({ pendingLoading: true, pendingError: null });

    try {
      const response = await paymentApi.getPending();
      set({
        pendingVerifications: response.data ?? [],
        pendingLoading: false,
      });
    } catch (error) {
      set({
        pendingLoading: false,
        pendingError: getErrorMessage(error, "Failed to load pending verifications."),
      });
    }
  },

  async approveVerification(id, verifiedAmount) {
    await paymentApi.approve(id, verifiedAmount);
    await get().loadPendingVerifications();
  },

  async rejectVerification(id, reason) {
    await paymentApi.reject(id, reason);
    await get().loadPendingVerifications();
  },

  async loadUsers() {
    set({ usersLoading: true, usersError: null });

    try {
      const filters = get().userFilters;
      const cleanParams: Record<string, string> = {};
      if (filters.status) {
        cleanParams.status = filters.status;
      }
      if (filters.query && filters.query.trim() !== "") {
        cleanParams.query = filters.query.trim();
      }
      if (filters.name && filters.name.trim() !== "") {
        cleanParams.name = filters.name.trim();
      }
      if (filters.institution && filters.institution.trim() !== "") {
        cleanParams.institution = filters.institution.trim();
      }

      const response = await adminUserApi.searchUsers(cleanParams);

      set({
        users: response.data ?? [],
        usersLoading: false,
      });
    } catch (error) {
      set({
        usersLoading: false,
        usersError: getErrorMessage(error, "Failed to load users."),
      });
    }
  },

  async saveUser(id, payload) {
    const response = await adminUserApi.updateUser(id, payload);
    const updatedUser = response.data;

    set((state) => ({
      users: state.users.map((user) => (user.id === id ? updatedUser : user)),
    }));

    return updatedUser;
  },

  async deleteUser(id) {
    const response = await adminUserApi.deleteUser(id);

    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
    }));

    return response.data;
  },

  async findAdminByEmail(email) {
    set({
      adminLookupLoading: true,
      adminLookupError: null,
      adminLookupResult: null,
    });

    try {
      const response = await adminUserApi.getAccountByEmail(email);
      const account = response.data;

      if (account.role !== "ADMIN") {
        set({
          adminLookupLoading: false,
          adminLookupError: "No admin account found for that email.",
          adminLookupResult: null,
        });
        return null;
      }

      set({
        adminLookupLoading: false,
        adminLookupResult: account,
      });
      return account;
    } catch (error) {
      set({
        adminLookupLoading: false,
        adminLookupError: getErrorMessage(error, "Failed to fetch admin account."),
      });
      return null;
    }
  },

  clearAdminLookup() {
    set({
      adminLookupResult: null,
      adminLookupError: null,
    });
  },

  async updateOwnAdminProfile(payload) {
    set({ profileSaving: true });

    try {
      const response = await adminUserApi.updateAdminProfile(payload);
      set({ profileSaving: false });
      return response.data;
    } catch (error) {
      set({ profileSaving: false });
      throw error;
    }
  },
}));
