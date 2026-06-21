"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserResult = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewChatModal({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  async function startChat(user: UserResult) {
    setStarting(user.id);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onClose();
      router.push(`/chat?conversation=${data.id}`);
    } catch {
      setStarting(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Chat">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username..."
          autoFocus
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {loading ? <p className="py-4 text-center text-sm text-zinc-500">Searching...</p> : null}
        {!loading && query && results.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">No users found</p>
        ) : null}
        {results.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => startChat(user)}
            disabled={starting === user.id}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <Avatar src={user.avatar} alt={user.displayName} size="sm" />
            <div>
              <p className="font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-zinc-500">@{user.username}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
