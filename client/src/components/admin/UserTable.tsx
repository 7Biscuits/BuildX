import { Edit3, Mail, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminManagedUser } from "@/types/api";

type UserTableProps = {
  users: AdminManagedUser[];
  loading?: boolean;
  onEdit: (user: AdminManagedUser) => void;
  onDelete: (user: AdminManagedUser) => void;
};

export function UserTable({
  users,
  loading = false,
  onEdit,
  onDelete,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0d1018]/92 p-5">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-white/10 bg-[#0d1018]/92 p-5 text-center">
        <div>
          <h3 className="text-lg font-semibold text-white">No users found</h3>
          <p className="mt-2 text-sm text-slate-400">
            Try a different search term or remove one of the filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0d1018]/92">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-white/5">
            <tr className="text-xs uppercase tracking-[0.24em] text-slate-400">
              <th className="px-4 py-4">Name</th>
              <th className="px-4 py-4">Institution</th>
              <th className="px-4 py-4">Contact</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Created</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => (
              <tr key={user.id} className="align-top text-sm text-slate-200">
                <td className="px-4 py-4">
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{user.email}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">{user.id}</div>
                </td>
                <td className="px-4 py-4 text-slate-300">{user.institution}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{user.contact || "--"}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                      user.status === "VERIFIED" &&
                        "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20",
                      user.status === "PENDING" &&
                        "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/20",
                      user.status === "REJECTED" &&
                        "bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/20",
                    )}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-400">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "--"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => onEdit(user)}
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      className="bg-red-500/90 text-white hover:bg-red-500"
                      onClick={() => onDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
