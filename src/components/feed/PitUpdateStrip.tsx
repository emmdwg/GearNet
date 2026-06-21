"use client";

import { Avatar } from "@/components/ui/Avatar";
import Image from "next/image";

type PitUpdateData = {
  id: string;
  userId: string;
  image: string;
  caption: string;
  expiresAt: string;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export function PitUpdateStrip({
  updates,
  onAdd,
  onOpen,
}: {
  updates: PitUpdateData[];
  onAdd?: () => void;
  onOpen?: (id: string) => void;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Pit Updates</h2>
        <span className="text-xs text-zinc-600">24h snapshots from the garage</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {updates.map((update) => {
          const user = update.user;
          if (!user) return null;
          return (
            <button key={update.id} type="button" onClick={() => onOpen?.(update.id)} className="group shrink-0 text-left">
              <div className="relative h-36 w-24 overflow-hidden rounded-xl border-2 border-amber-500/50 bg-zinc-800 transition-colors group-hover:border-amber-400">
                <Image src={update.image} alt={update.caption} fill className="object-cover" sizes="96px" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="truncate text-[10px] text-white">{update.caption}</p>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Avatar src={user.avatar} alt={user.displayName} size="sm" />
                <span className="truncate text-xs text-zinc-400">{user.displayName.split(" ")[0]}</span>
              </div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="flex h-36 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-600 transition-colors hover:border-amber-500/50 hover:text-amber-400"
        >
          <span className="text-2xl">+</span>
          <span className="text-[10px]">Add update</span>
        </button>
      </div>
    </section>
  );
}
