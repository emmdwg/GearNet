"use client";

import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeDate } from "@/lib/utils";
import { CalendarDays, Camera, Heart, MessageSquare, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  targetType?: string | null;
  targetId?: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actor: { username: string; displayName: string; avatar: string };
};

function iconFor(type: string) {
  if (type === "like") return Heart;
  if (type === "comment") return MessageSquare;
  if (type === "rsvp") return CalendarDays;
  if (type === "post") return Camera;
  return UserPlus;
}

export function ActivityContent() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));

    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);

  if (loading) return <p className="p-8 text-center text-zinc-500">Loading activity...</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Activity</h1>
      <p className="mb-6 text-sm text-zinc-500">Likes, comments, meets, and garage interactions</p>

      {items.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-500">
          No activity yet. When someone interacts with your posts or pit updates, it shows up here.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = iconFor(item.type);
            const href =
              item.targetType === "pit_update" && item.targetId
                ? `/explore?pit=${item.targetId}`
                : item.targetType === "post" && item.targetId
                  ? `/explore?post=${item.targetId}`
                  : item.targetType === "post"
                    ? "/explore"
                    : `/profile/${item.actor.username}`;

            return (
              <Link
                key={item.id}
                href={href}
                className={`flex items-start gap-3 rounded-xl border border-zinc-800 p-4 transition-colors hover:bg-zinc-900/60 ${item.read ? "opacity-80" : "bg-amber-500/5"}`}
              >
                <Avatar src={item.actor.avatar} alt={item.actor.displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200">
                    <span className="font-medium text-white">{item.actor.displayName}</span> {item.body}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">{formatRelativeDate(item.createdAt)}</p>
                </div>
                <Icon className="mt-1 h-4 w-4 shrink-0 text-amber-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
