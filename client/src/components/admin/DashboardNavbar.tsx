import { Bell, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/types/api";

type DashboardNavbarProps = {
  admin: AuthUser;
  onLogout: () => Promise<void> | void;
};

export function DashboardNavbar({ admin, onLogout }: DashboardNavbarProps) {
  return (
    <header className="rounded-lg border border-white/10 bg-[#0d1018]/92 px-4 py-4 shadow-terminal">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
            Protected Route
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review verifications, manage users, and keep admin access tidy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 sm:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary/10 text-secondary">
              <Shield className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{admin.name}</p>
              <p className="truncate text-xs text-slate-400">{admin.email}</p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
