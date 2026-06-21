"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  userId: string;
  username: string;
  initialFollowing: boolean;
};

export function FollowButton({ userId, username, initialFollowing }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [userId, initialFollowing]);

  if (loading) {
    return <div className="h-10 w-24 animate-pulse rounded-full bg-zinc-800" />;
  }

  if (user?.id === userId) return null;

  async function handleClick() {
    if (!user) {
      router.push(`/auth/signin?callbackUrl=/profile/${username}`);
      return;
    }

    setLoadingAction(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        setFollowing(!next);
        return;
      }
      const data = await res.json();
      setFollowing(data.following);
      router.refresh();
    } catch {
      setFollowing(!next);
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loadingAction}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
        following
          ? "border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
          : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
      }`}
    >
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
