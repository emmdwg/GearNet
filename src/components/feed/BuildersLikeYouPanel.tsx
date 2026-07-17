"use client";

import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/profile/FollowButton";
import { Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export type BuilderLikeYou = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  matchReason?: string;
};

export function BuildersLikeYouPanel() {
  const [users, setUsers] = useState<BuilderLikeYou[]>([]);

  useEffect(() => {
    fetch("/api/discover/builders-like-you")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  if (users.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Builders like you</h3>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3">
            <Link href={`/profile/${u.username}`}>
              <Avatar src={u.avatar} alt={u.displayName} size="sm" />
            </Link>
            <Link href={`/profile/${u.username}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white hover:text-amber-400">{u.displayName}</p>
              <p className="truncate text-xs text-zinc-500">
                @{u.username}
                {u.matchReason ? ` · ${u.matchReason}` : ""}
              </p>
            </Link>
            <FollowButton userId={u.id} username={u.username} initialFollowing={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
