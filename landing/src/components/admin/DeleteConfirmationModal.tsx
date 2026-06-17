import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeleteConfirmationModalProps = {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmationModal({
  open,
  title = "Confirm deletion",
  description,
  confirmLabel = "Delete",
  loading = false,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-red-500/20 bg-[#0c0f16] p-5 shadow-terminal">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-md bg-red-500/10 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-500 text-white hover:bg-red-500/90"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
