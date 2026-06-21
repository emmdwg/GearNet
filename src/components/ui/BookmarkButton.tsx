"use client";

import { useAuth } from "@/lib/auth-context";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  targetType: "post" | "listing";
  targetId: string;
  initialSaved?: boolean;
  withLabel?: boolean;
  className?: string;
};

export function BookmarkButton({ targetType, targetId, initialSaved = false, withLabel = false, className }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (pending) return;

    setPending(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (!res.ok) {
        setSaved(!next);
        return;
      }
      const data = await res.json();
      setSaved(data.bookmarked);
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={
        className ??
        `flex items-center gap-1.5 transition-colors ${saved ? "text-amber-400" : "hover:text-amber-400"}`
      }
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
