import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminManagedUser } from "@/types/api";

type UserDetailsModalProps = {
  open: boolean;
  user: AdminManagedUser | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (
    payload: Pick<AdminManagedUser, "name" | "email" | "contact" | "institution" | "status">,
  ) => Promise<void>;
};

export function UserDetailsModal({
  open,
  user,
  loading = false,
  onClose,
  onSave,
}: UserDetailsModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    institution: "",
    status: "PENDING" as AdminManagedUser["status"],
  });

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name,
      email: user.email,
      contact: user.contact ?? "",
      institution: user.institution,
      status: user.status,
    });
  }, [user]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#0c0f16] shadow-terminal">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Edit user</h3>
            <p className="text-sm text-slate-400">{user.id}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="grid gap-4 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(form);
          }}
        >
          <Field
            label="Name"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          />
          <Field
            label="Contact"
            value={form.contact}
            onChange={(value) => setForm((current) => ({ ...current, contact: value }))}
          />
          <Field
            label="Institution"
            value={form.institution}
            onChange={(value) =>
              setForm((current) => ({ ...current, institution: value }))
            }
          />

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Verification status
            </label>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as AdminManagedUser["status"],
                }))
              }
              className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-secondary"
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-secondary text-slate-950 hover:bg-secondary/90" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
};

function Field({ label, value, onChange, type = "text" }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
      />
    </div>
  );
}
