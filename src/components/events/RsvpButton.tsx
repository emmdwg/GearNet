"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export function RsvpButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rsvped, setRsvped] = useState(false);

  async function handleRsvp() {
    if (!user) {
      router.push(`/auth/signin?callbackUrl=/events`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setRsvped(data.rsvped);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRsvp}
      disabled={loading}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
        rsvped
          ? "border border-amber-500/50 bg-amber-500/10 text-amber-400"
          : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
      }`}
    >
      {loading ? "..." : rsvped ? "Going ✓" : "RSVP"}
    </button>
  );
}
