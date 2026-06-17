import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUserFilters } from "@/types/api";

type UserSearchBarProps = {
  filters: AdminUserFilters;
  onChange: (filters: Partial<AdminUserFilters>) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
};

export function UserSearchBar({
  filters,
  onChange,
  onSearch,
  onReset,
  loading = false,
}: UserSearchBarProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1018]/92 p-4">
      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_auto]">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={filters.query ?? ""}
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder="UUID, email, contact, name, institution"
              className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Status
          </label>
          <select
            value={filters.status ?? ""}
            onChange={(event) =>
              onChange({ status: event.target.value as AdminUserFilters["status"] })
            }
            className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-secondary"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Institution
          </label>
          <Input
            value={filters.institution ?? ""}
            onChange={(event) => onChange({ institution: event.target.value })}
            placeholder="Institution"
            className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            type="button"
            onClick={onSearch}
            className="h-11 bg-secondary text-slate-950 hover:bg-secondary/90"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={onReset}
            disabled={loading}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
