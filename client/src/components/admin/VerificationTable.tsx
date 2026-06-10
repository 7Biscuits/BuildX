import { Eye, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PaymentVerification } from "@/types/api";

type VerificationTableProps = {
  items: PaymentVerification[];
  loading?: boolean;
  actionLoadingId?: string | null;
  actionMode?: "approve" | "reject" | null;
  rejectReasons: Record<string, string>;
  approveAmounts: Record<string, string>;
  onPreview: (item: PaymentVerification) => void;
  onRejectReasonChange: (id: string, value: string) => void;
  onApproveAmountChange: (id: string, value: string) => void;
  onApprove: (item: PaymentVerification) => void;
  onReject: (item: PaymentVerification) => void;
};

export function VerificationTable({
  items,
  loading = false,
  actionLoadingId = null,
  actionMode = null,
  rejectReasons,
  approveAmounts,
  onPreview,
  onRejectReasonChange,
  onApproveAmountChange,
  onApprove,
  onReject,
}: VerificationTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0d1018]/92 p-5">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-white/10 bg-[#0d1018]/92 p-5 text-center">
        <div>
          <h3 className="text-lg font-semibold text-white">No pending verifications</h3>
          <p className="mt-2 text-sm text-slate-400">
            Payment verification requests will appear here as soon as users submit them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isApproving = actionLoadingId === item.id && actionMode === "approve";
        const isRejecting = actionLoadingId === item.id && actionMode === "reject";

        return (
          <div
            key={item.id}
            className="rounded-lg border border-white/10 bg-[#0d1018]/92 p-4 shadow-terminal"
          >
            <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_auto]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{item.user?.name}</h3>
                  <span className="inline-flex rounded-full bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/20">
                    Pending
                  </span>
                </div>
                <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <p><span className="text-slate-500">Email:</span> {item.user?.email}</p>
                  <p><span className="text-slate-500">Contact:</span> {item.user?.contact || "--"}</p>
                  <p><span className="text-slate-500">Institution:</span> {item.user?.institution}</p>
                  <p>
                    <span className="text-slate-500">Submitted:</span>{" "}
                    {new Date(item.submittedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Verified amount
                  </label>
                  <Input
                    value={approveAmounts[item.id] ?? String(item.submittedAmount ?? "")}
                    onChange={(event) => onApproveAmountChange(item.id, event.target.value)}
                    placeholder="Optional amount"
                    className="mt-2 h-10 border-white/10 bg-black/10 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Rejection reason
                  </label>
                  <textarea
                    value={rejectReasons[item.id] ?? ""}
                    onChange={(event) => onRejectReasonChange(item.id, event.target.value)}
                    placeholder="Explain why this receipt is being rejected"
                    className="mt-2 min-h-[90px] w-full rounded-md border border-white/10 bg-black/10 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-secondary"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-3 xl:min-w-[200px]">
                <button
                  type="button"
                  onClick={() => onPreview(item)}
                  className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                >
                  <Eye className="h-4 w-4" />
                  Preview receipt
                </button>
                <Button
                  type="button"
                  onClick={() => onApprove(item)}
                  className={cn(
                    "h-11 bg-emerald-500 text-white hover:bg-emerald-500/90",
                    isApproving && "opacity-80",
                  )}
                  disabled={isApproving || isRejecting}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isApproving ? "Approving..." : "Approve user"}
                </Button>
                <Button
                  type="button"
                  onClick={() => onReject(item)}
                  className={cn(
                    "h-11 bg-rose-500 text-white hover:bg-rose-500/90",
                    isRejecting && "opacity-80",
                  )}
                  disabled={isApproving || isRejecting}
                >
                  <XCircle className="h-4 w-4" />
                  {isRejecting ? "Rejecting..." : "Reject user"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
