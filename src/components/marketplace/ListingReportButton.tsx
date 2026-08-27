"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

type ListingReportButtonProps = {
  listingId: string;
  className?: string;
};

export function ListingReportButton({ listingId, className }: ListingReportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function report() {
    if (busy || done) return;
    const reason = window.prompt("Why are you reporting this listing?");
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/marketplace/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={report}
      disabled={busy || done}
      className={className ?? "inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400"}
    >
      <Flag className="h-3.5 w-3.5" />
      {done ? "Reported" : busy ? "Sending…" : "Report"}
    </button>
  );
}
