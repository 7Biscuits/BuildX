import { ExternalLink, X } from "lucide-react";

type PaymentReceiptModalProps = {
  open: boolean;
  receiptUrl?: string | null;
  userName?: string;
  onClose: () => void;
};

export function PaymentReceiptModal({
  open,
  receiptUrl,
  userName,
  onClose,
}: PaymentReceiptModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg border border-white/10 bg-[#0c0f16] shadow-terminal">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Payment Receipt</h3>
            <p className="text-sm text-slate-400">{userName ?? "Verification preview"}</p>
          </div>

          <div className="flex items-center gap-2">
            {receiptUrl ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {receiptUrl ? (
            <img
              src={receiptUrl}
              alt={userName ? `${userName} payment receipt` : "Payment receipt"}
              className="max-h-[75vh] w-full rounded-md border border-white/10 object-contain"
            />
          ) : (
            <div className="grid min-h-[320px] place-items-center rounded-md border border-dashed border-white/15 text-sm text-slate-400">
              No receipt image available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
