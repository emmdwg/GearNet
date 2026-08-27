"use client";

import type { ClubDuesEntry, ClubMember } from "@/lib/types";
import { useEffect, useState } from "react";

export function ClubDuesPanel({
  slug,
  canManage,
  members,
  userId,
}: {
  slug: string;
  canManage: boolean;
  members: ClubMember[];
  userId?: string;
}) {
  const [entries, setEntries] = useState<ClubDuesEntry[]>([]);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("Dues");
  const [memberId, setMemberId] = useState(members[0]?.userId ?? "");

  useEffect(() => {
    fetch(`/api/clubs/${slug}/dues`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [slug]);

  async function addDues(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/clubs/${slug}/dues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId, amount: Number(amount), label }),
    });
    if (res.ok) {
      const data = await res.json();
      setEntries((prev) => [data, ...prev]);
      setAmount("");
    }
  }

  if (!canManage && entries.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-zinc-800/70 bg-zinc-900/20 p-4">
      <h3 className="text-sm font-semibold text-white">Dues</h3>
      {canManage ? (
        <form onSubmit={addDues} className="mt-3 flex flex-wrap gap-2">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white"
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.displayName}
              </option>
            ))}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            className="w-24 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white"
          />
          <button type="submit" className="rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950">
            Record
          </button>
        </form>
      ) : null}
      <ul className="mt-3 space-y-1 text-xs text-zinc-500">
        {entries
          .filter((e) => canManage || e.userId === userId)
          .slice(0, 8)
          .map((e) => (
            <li key={e.id}>
              ${e.amount.toFixed(2)} · {e.label}
              {e.paidAt ? " · paid" : " · due"}
            </li>
          ))}
      </ul>
    </div>
  );
}
