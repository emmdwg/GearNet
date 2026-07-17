"use client";

import { CreateClubModal } from "@/components/forms/CreateClubModal";
import { ClubCard } from "@/components/clubs/ClubCard";
import type { Club } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = { clubs: Club[] };
type Tab = "discover" | "mine";

export function ClubsContent({ clubs }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("discover");

  useEffect(() => {
    if (authLoading) return;
    if (user) setTab("mine");
    else setTab("discover");
  }, [user, authLoading]);

  const activeTab: Tab = user ? tab : "discover";

  const filtered = useMemo(() => {
    let result =
      activeTab === "mine"
        ? clubs.filter((c) => c.joined || c.role === "owner")
        : clubs.filter((c) => c.isPublic);

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return [...result].sort((a, b) => b.memberCount - a.memberCount);
  }, [clubs, search, activeTab]);

  const myClubCount = clubs.filter((c) => c.joined || c.role === "owner").length;

  function handleCreate() {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/clubs";
      return;
    }
    setCreateOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Clubs</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Find your scene or start your own</p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Start a club</span>
          <span className="sm:hidden">Start</span>
        </button>
      </header>

      {!user ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-4 py-3.5 text-sm text-zinc-400">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Sign in to join clubs, see My clubs, and manage requests.
        </div>
      ) : null}

      {user ? (
        <div className="mb-3 flex gap-1 rounded-full bg-zinc-900/70 p-1 ring-1 ring-zinc-800/70">
          {(
            [
              ["mine", myClubCount > 0 ? `My clubs (${myClubCount})` : "My clubs"],
              ["discover", "Discover"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm",
                activeTab === id ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clubs…"
        className="mb-5 w-full rounded-full border border-zinc-800/80 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:outline-none"
      />

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            {activeTab === "mine" ? "Your clubs" : "Browse clubs"}
          </h2>
          <p className="text-xs text-zinc-500">
            {activeTab === "mine" ? "Clubs you own or have joined" : "Public crews looking for members"}
          </p>
        </div>
        {filtered.length > 0 ? (
          <span className="text-[11px] tabular-nums text-zinc-600">{filtered.length}</span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length > 0 ? (
          filtered.map((club) => <ClubCard key={club.id} club={club} />)
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-12 text-center">
            <p className="text-base font-semibold text-white">
              {activeTab === "mine" ? "No clubs yet" : search.trim() ? "No clubs match" : "No clubs yet"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {activeTab === "mine"
                ? "Browse Discover to find your scene, or start one for your crew."
                : search.trim()
                  ? "Try another search."
                  : "Start a club for your crew, or find a meet nearby."}
            </p>
            {activeTab === "mine" ? (
              <button
                type="button"
                onClick={() => setTab("discover")}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                Browse Discover
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4" />
                  Start a club
                </button>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 ring-1 ring-zinc-800/80 transition hover:text-zinc-200"
                >
                  Browse meets
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateClubModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
