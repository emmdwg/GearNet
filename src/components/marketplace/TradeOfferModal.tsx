"use client";

import { X } from "lucide-react";
import { useState } from "react";

type TradeOfferModalProps = {
  open: boolean;
  onClose: () => void;
  listingId: string;
  sellerId?: string;
};

export function TradeOfferModal({ open, onClose, listingId }: TradeOfferModalProps) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/marketplace/${listingId}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (res.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Trade offer</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        {done ? (
          <p className="text-sm text-zinc-400">Offer sent. The seller will see it in Messages.</p>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="What are you offering?"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
            <button
              type="button"
              onClick={submit}
              disabled={busy || !message.trim()}
              className="mt-3 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send offer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
