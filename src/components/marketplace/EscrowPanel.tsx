"use client";

import { useEffect, useState } from "react";

type EscrowPanelProps = {
  listingId: string;
  price?: number;
  sellerId?: string;
  currentUserId?: string;
};

export function EscrowPanel({ listingId, price, sellerId, currentUserId }: EscrowPanelProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/marketplace/${listingId}/escrow`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStatus(data?.status ?? null))
      .catch(() => {});
  }, [listingId, currentUserId]);

  async function requestEscrow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/marketplace/${listingId}/escrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setStatus(data.status ?? "requested");
    } finally {
      setBusy(false);
    }
  }

  const isSeller = Boolean(currentUserId && sellerId && currentUserId === sellerId);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">Protected checkout</h3>
      <p className="mt-1 text-xs text-zinc-500">
        GearNet can hold payment{price != null ? ` (${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price / 100)})` : ""} until the part ships.
      </p>
      {status ? (
        <p className="mt-2 text-xs capitalize text-amber-400">Escrow {status.replace("-", " ")}</p>
      ) : !isSeller && currentUserId ? (
        <button
          type="button"
          onClick={() => void requestEscrow()}
          disabled={busy}
          className="mt-3 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-50"
        >
          {busy ? "Requesting…" : "Request escrow"}
        </button>
      ) : null}
    </div>
  );
}
