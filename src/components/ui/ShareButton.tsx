"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  text: string;
  path: string;
  className?: string;
};

export function ShareButton({ title, text, path, className }: Props) {
  const [msg, setMsg] = useState("");

  async function handleShare() {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMsg("Link copied!");
        setTimeout(() => setMsg(""), 2000);
      }
    } catch {
      // share cancelled
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        className ??
        "flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
      }
    >
      <Share2 className="h-4 w-4" />
      {msg || "Share"}
    </button>
  );
}
