"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { ClubChallenge, Post } from "@/lib/types";
import { useEffect, useState } from "react";

export function ClubChallengesPanel({
  slug,
  canManage,
  canEnter,
  clubPosts,
  userId,
}: {
  slug: string;
  canManage: boolean;
  canEnter: boolean;
  clubPosts: Post[];
  userId?: string;
}) {
  const [challenges, setChallenges] = useState<ClubChallenge[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"photo-battle" | "attendance" | "build-of-month">("photo-battle");

  useEffect(() => {
    fetch(`/api/clubs/${slug}/challenges`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setChallenges(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [slug]);

  async function createChallenge(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/clubs/${slug}/challenges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), type }),
    });
    if (res.ok) {
      setTitle("");
      const data = await res.json();
      setChallenges((prev) => [data, ...prev]);
    }
  }

  async function enter(challengeId: string, postId?: string) {
    await fetch(`/api/clubs/${slug}/challenges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, postId, enter: true }),
    });
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-white">Challenges</h2>
      {canManage ? (
        <form onSubmit={createChallenge} className="mb-4 flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Challenge title"
            className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            <option value="photo-battle">Photo battle</option>
            <option value="attendance">Attendance</option>
            <option value="build-of-month">Build of the month</option>
          </select>
          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      ) : null}
      {challenges.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 px-6 py-10 text-center text-sm text-zinc-500">
          No active challenges.
        </p>
      ) : (
        <div className="space-y-3">
          {challenges.map((ch) => (
            <article key={ch.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="font-semibold text-white">{ch.title}</p>
              <p className="text-xs capitalize text-zinc-500">{ch.type.replaceAll("-", " ")}</p>
              {canEnter && userId ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void enter(ch.id, clubPosts[0]?.id)}
                    className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
                  >
                    Enter
                  </button>
                  {ch.entries?.map((entry) => (
                    <span key={entry.id} className="flex items-center gap-1 text-xs text-zinc-400">
                      <Avatar src={entry.user.avatar} alt={entry.user.displayName} size="sm" />
                      {entry.user.displayName}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
