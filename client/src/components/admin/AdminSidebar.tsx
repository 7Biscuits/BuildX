import { LayoutGrid, ShieldCheck, Users, UserCog, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminSection } from "@/store/adminDashboardStore";

const items: { id: AdminSection; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "verifications", label: "Pending Verifications", icon: ShieldCheck },
  { id: "users", label: "User Management", icon: Users },
  { id: "admin", label: "Admin Management", icon: UserCog },
  { id: "settings", label: "Settings / Profile", icon: Settings },
];

type AdminSidebarProps = {
  activeSection: AdminSection;
  onChange: (section: AdminSection) => void;
};

export function AdminSidebar({ activeSection, onChange }: AdminSidebarProps) {
  return (
    <aside className="rounded-lg border border-white/10 bg-[#0d1018]/92 p-3 shadow-terminal">
      <div className="border-b border-white/10 px-3 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
          BuildX Admin
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Control Center</h2>
      </div>

      <nav className="mt-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition",
                active
                  ? "bg-secondary/12 text-white ring-1 ring-secondary/40"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md border",
                  active
                    ? "border-secondary/50 bg-secondary/10 text-secondary"
                    : "border-white/10 bg-white/5 text-slate-400",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
