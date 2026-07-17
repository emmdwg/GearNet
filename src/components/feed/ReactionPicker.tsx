"use client";

import { REACTION_TYPES, type ReactionType } from "@/lib/reactions";
import { useEffect, useRef, useState } from "react";

type Props = {
  userReaction: ReactionType | null;
  reactionCounts?: Partial<Record<ReactionType, number>>;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
};

export function ReactionPicker({ userReaction, reactionCounts = {}, onReact, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const activeEmoji = userReaction
    ? REACTION_TYPES.find((r) => r.type === userReaction)?.emoji ?? "🔥"
    : "🔥";

  const topReactions = REACTION_TYPES.filter((r) => (reactionCounts[r.type] ?? 0) > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`text-xl transition-transform ${userReaction ? "scale-110" : "opacity-90 hover:opacity-100"}`}
        aria-label="React"
      >
        {activeEmoji}
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1.5 shadow-lg">
          {REACTION_TYPES.map((r) => (
            <button
              key={r.type}
              type="button"
              title={r.label}
              onClick={() => {
                onReact(r.type);
                setOpen(false);
              }}
              className={`rounded-full px-1.5 py-0.5 text-lg hover:bg-zinc-800 ${
                userReaction === r.type ? "ring-1 ring-amber-500" : ""
              }`}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      ) : null}
      {topReactions.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
          {topReactions.map((r) => (
            <span key={r.type}>
              {r.emoji} {(reactionCounts[r.type] ?? 0).toLocaleString()}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
