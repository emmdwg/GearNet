"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { ClubJoinRequest } from "@/lib/types";
import { useEffect, useState } from "react";

export function JoinRequestsPanel({
  slug,
  pendingCount,
  onChanged,
}: {
  slug: string;
  pendingCount: number;
  onChanged: () => void;
}) {
  const [requests, setRequests] = useState<ClubJoinRequest[]>([]);
  const [open, setOpen] = useState(pendingCount > 0);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/clubs/${slug}/join-requests`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [slug, open, pendingCount]);

  async function review(userId: string, action: "approve" | "deny") {
    const res = await fetch(`/api/clubs/${slug}/join-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) onChanged();
  }

  if (pendingCount <= 0 && requests.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-amber-200"
      >
        Join requests
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] text-zinc-950">{pendingCount}</span>
      </button>
      {open ? (
        <div className="mt-3 space-y-2">
          {requests.length === 0 ? (
            <p className="text-xs text-zinc-500">No pending requests.</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 rounded-xl bg-zinc-950/40 p-2">
                <Avatar src={req.user.avatar} alt={req.user.displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{req.user.displayName}</p>
                  <p className="truncate text-xs text-zinc-500">@{req.user.username}</p>
                  {req.message ? <p className="mt-1 text-xs text-zinc-400">{req.message}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => void review(req.userId, "approve")}
                  className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-zinc-950"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void review(req.userId, "deny")}
                  className="rounded-full px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-zinc-700"
                >
                  Deny
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
