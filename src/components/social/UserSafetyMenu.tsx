"use client";

import { Ban, Flag, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  userId: string;
  username: string;
  onBlocked?: () => void;
};

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

export function UserSafetyMenu({ userId, username, onBlocked }: Props) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/users/block?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setBlocked(Boolean(d.blocked)))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggleBlock() {
    const res = await fetch(blocked ? `/api/users/block?userId=${userId}` : "/api/users/block", {
      method: blocked ? "DELETE" : "POST",
      headers: blocked ? undefined : { "Content-Type": "application/json" },
      body: blocked ? undefined : JSON.stringify({ userId }),
    });
    if (res.ok) {
      setBlocked(!blocked);
      setMessage(blocked ? "User unblocked" : "User blocked");
      setOpen(false);
      if (!blocked) onBlocked?.();
    }
  }

  async function submitReport() {
    const res = await fetch("/api/users/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason, details }),
    });
    if (res.ok) {
      setReportOpen(false);
      setOpen(false);
      setMessage("Report submitted. Thanks for keeping GearNet safe.");
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-zinc-700 p-2 text-zinc-400 hover:border-zinc-600 hover:text-white"
        aria-label="Safety options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && !reportOpen ? (
        <div className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
          >
            <Flag className="h-4 w-4" /> Report @{username}
          </button>
          <button
            type="button"
            onClick={toggleBlock}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800"
          >
            <Ban className="h-4 w-4" /> {blocked ? "Unblock" : "Block"}
          </button>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
          <p className="mb-3 text-sm font-medium text-white">Report @{username}</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional details..."
            rows={3}
            className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReport}
              className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-zinc-950"
            >
              Submit
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-emerald-400">{message}</p> : null}
    </div>
  );
}
