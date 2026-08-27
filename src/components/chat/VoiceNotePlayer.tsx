"use client";

import { cn } from "@/lib/utils";

type VoiceNotePlayerProps = {
  src?: string;
  audioUrl?: string;
  duration?: number | null;
  isMe?: boolean;
};

export function VoiceNotePlayer({ src, audioUrl, duration, isMe }: VoiceNotePlayerProps) {
  const url = audioUrl ?? src;
  if (!url) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2 py-1.5",
        isMe ? "border-amber-500/30 bg-amber-500/10" : "border-zinc-800 bg-zinc-950",
      )}
    >
      <audio controls preload="none" src={url} className="h-8 max-w-[220px]" />
      {duration != null && duration > 0 ? (
        <span className="text-[10px] text-zinc-500">{Math.round(duration)}s</span>
      ) : null}
    </div>
  );
}
