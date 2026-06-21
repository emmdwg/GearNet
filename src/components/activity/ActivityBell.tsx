"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

export function ActivityBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUnread(data.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  return (
    <Link href="/activity" className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white">
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-zinc-950">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
