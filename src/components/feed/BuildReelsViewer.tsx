"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronUp, ChevronDown } from "lucide-react";

type ReelPost = {
  id: string;
  caption: string;
  videoUrl: string;
  videoPoster?: string | null;
  image?: string;
  user: { username: string; displayName: string; avatar: string };
};

export function BuildReelsViewer({ onClose }: { onClose: () => void }) {
  const [posts, setPosts] = useState<ReelPost[]>([]);
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch("/api/discover/build-reels")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    void v.play().catch(() => null);
  }, [index, posts]);

  const current = posts[index];

  function go(delta: number) {
    setIndex((i) => Math.max(0, Math.min(posts.length - 1, i + delta)));
  }

  if (!current) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950">
        <button type="button" onClick={onClose} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center text-white">
          <X className="h-6 w-6" />
        </button>
        <p className="text-zinc-500">No build reels yet — share video build posts!</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black">
      <button type="button" onClick={onClose} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white">
        <X className="h-5 w-5" />
      </button>
      <div className="flex h-full flex-col items-center justify-center">
        <video
          ref={videoRef}
          key={current.id}
          src={current.videoUrl}
          poster={current.videoPoster ?? current.image}
          className="max-h-full w-full max-w-lg object-contain"
          playsInline
          loop
          controls
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <p className="font-semibold text-white">@{current.user.username}</p>
          <p className="text-sm text-zinc-300">{current.caption}</p>
        </div>
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          <button type="button" disabled={index <= 0} onClick={() => go(-1)} className="rounded-full bg-zinc-800/80 p-2 text-white disabled:opacity-30">
            <ChevronUp className="h-5 w-5" />
          </button>
          <button type="button" disabled={index >= posts.length - 1} onClick={() => go(1)} className="rounded-full bg-zinc-800/80 p-2 text-white disabled:opacity-30">
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
        {current.user.avatar ? (
          <div className="absolute left-4 bottom-24">
            <Image src={current.user.avatar} alt="" width={40} height={40} className="rounded-full border border-white/20" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
