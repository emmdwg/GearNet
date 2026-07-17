"use client";

import type { VideoChapter } from "@/lib/types";

type Props = {
  chapters: VideoChapter[];
  duration?: number;
  currentTime?: number;
  onSeek?: (timeSec: number) => void;
  variant?: "list" | "scrubber";
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

export function VideoChapterMarkers({ chapters, duration, currentTime = 0, onSeek, variant = "list" }: Props) {
  if (!chapters.length) return null;

  if (variant === "scrubber" && duration && duration > 0) {
    return (
      <div className="relative h-6 px-1">
        <div className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded bg-zinc-700" />
        {chapters.map((ch) => {
          const pct = Math.min(100, Math.max(0, (ch.timeSec / duration) * 100));
          const active = Math.abs(currentTime - ch.timeSec) < 1.5;
          return (
            <button
              key={`${ch.timeSec}-${ch.label}`}
              type="button"
              title={`${formatTime(ch.timeSec)} — ${ch.label}`}
              onClick={() => onSeek?.(ch.timeSec)}
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                active ? "border-amber-400 bg-amber-400" : "border-amber-500/80 bg-zinc-900 hover:bg-amber-500/30"
              }`}
              style={{ left: `${pct}%` }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-zinc-800 bg-zinc-900/50 px-3 py-2">
      {chapters.map((ch) => (
        <button
          key={`${ch.timeSec}-${ch.label}`}
          type="button"
          onClick={() => onSeek?.(ch.timeSec)}
          className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:border-amber-500/50 hover:text-white"
        >
          <span className="font-mono text-amber-400">{formatTime(ch.timeSec)}</span> {ch.label}
        </button>
      ))}
    </div>
  );
}
