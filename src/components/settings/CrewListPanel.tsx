"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useCallback, useEffect, useState } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";

type CrewMember = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
};

type SearchUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
};

export function CrewListPanel() {
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    const res = await fetch("/api/users/me/crew", { cache: "no-store" });
    if (res.status === 401) {
      setLoadError("Sign in again to manage your crew.");
      setMembers([]);
      return;
    }
    if (!res.ok) {
      setLoadError("Couldn’t load your crew. Try refreshing.");
      return;
    }
    const data = await res.json();
    setMembers(Array.isArray(data.members) ? data.members : []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const q = query.trim().replace(/^@+/, "");
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      const memberIds = new Set(members.map((m) => m.userId));
      setSuggestions(
        (Array.isArray(data) ? data : []).filter((u: SearchUser) => !memberIds.has(u.id)).slice(0, 6),
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [query, members]);

  async function addMember(opts: { username?: string; userId?: string }) {
    const username = (opts.username ?? "").replace(/^@+/, "").trim();
    const userId = opts.userId?.trim() ?? "";
    if (!username && !userId) return;

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/users/me/crew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userId ? { userId } : { username }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError("Sign in again to add crew members.");
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn’t add crew member");
        return;
      }
      setMembers(Array.isArray(data.members) ? data.members : []);
      setQuery("");
      setSuggestions([]);
    } catch {
      setError("Couldn’t add crew member. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/users/me/crew?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn’t remove crew member");
        return;
      }
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch {
      setError("Couldn’t remove crew member");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Your inner circle — crew-only Pit Updates are visible to people on this list.
      </p>
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="relative z-20">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => {
              window.setTimeout(() => {
                e.target.scrollIntoView({ block: "center", behavior: "smooth" });
              }, 250);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addMember({ username: query });
              }
            }}
            placeholder="Search @username to add…"
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            disabled={busy || query.trim().replace(/^@+/, "").length < 2}
            onClick={() => void addMember({ username: query })}
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
        {suggestions.length > 0 ? (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg">
            {suggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                disabled={busy}
                onClick={() => void addMember({ userId: user.id, username: user.username })}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800 disabled:opacity-50"
              >
                <Avatar src={user.avatar} alt={user.displayName} size="sm" />
                <span className="text-sm text-white">{user.displayName}</span>
                <span className="text-xs text-zinc-500">@{user.username}</span>
                <UserPlus className="ml-auto h-4 w-4 text-amber-400" />
              </button>
            ))}
          </div>
        ) : query.trim().replace(/^@+/, "").length >= 2 && !busy ? (
          <p className="mt-1 text-xs text-zinc-600">No matches — check the spelling, or tap Add to try that username.</p>
        ) : null}
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-zinc-500">No crew members yet. Add close friends who should see WIP pits.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2"
            >
              <Avatar src={member.avatar} alt={member.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{member.displayName}</p>
                <p className="truncate text-xs text-zinc-500">@{member.username}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeMember(member.userId)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                aria-label={`Remove ${member.displayName}`}
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
