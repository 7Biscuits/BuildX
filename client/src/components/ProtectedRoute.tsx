import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/api";
import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
  role?: UserRole;
  requireVerified?: boolean;
};

export default function ProtectedRoute({
  children,
  role,
  requireVerified = false,
}: ProtectedRouteProps) {
  const { status, user, isAuthenticated, role: currentRole, verificationStatus } =
    useAuthStore();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#07060c] font-terminal text-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary shadow-neon-pink" />
          <span className="text-sm font-bold tracking-widest uppercase">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    const blockedReason =
      verificationStatus === "PENDING"
        ? "pending"
        : verificationStatus === "REJECTED"
          ? "rejected"
          : "login";

    if (blockedReason === "pending" || blockedReason === "rejected") {
      return (
        <Navigate
          to="/verification-pending"
          replace
          state={{ from: location.pathname, blockedReason }}
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, blockedReason }}
      />
    );
  }

  if (role && currentRole !== role) {
    return (
      <Navigate
        to={currentRole === "ADMIN" ? "/admin" : "/profile"}
        replace
      />
    );
  }

  if (
    requireVerified &&
    currentRole === "USER" &&
    verificationStatus !== "VERIFIED"
  ) {
    return (
      <Navigate
        to="/profile"
        replace
        state={{ from: location.pathname, blockedReason: verificationStatus?.toLowerCase() }}
      />
    );
  }

  return <>{children}</>;
}
