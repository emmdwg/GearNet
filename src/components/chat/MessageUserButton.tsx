"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userId: string;
  username: string;
  className?: string;
  children?: React.ReactNode;
};

export function MessageUserButton({ userId, username, className, children }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!user) {
      router.push(`/auth/signin?callbackUrl=/profile/${username}`);
      return;
    }
    if (user.id === userId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start conversation");
      router.push(`/chat?conversation=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {children ?? (loading ? "Opening..." : "Message")}
      </button>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </>
  );
}
