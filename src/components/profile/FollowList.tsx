import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/profile/FollowButton";
import Link from "next/link";

type ListUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
};

type Props = {
  users: ListUser[];
  viewerFollowingIds: string[];
  emptyLabel: string;
};

export function FollowList({ users, viewerFollowingIds, emptyLabel }: Props) {
  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
        >
          <Link href={`/profile/${u.username}`}>
            <Avatar src={u.avatar} alt={u.displayName} />
          </Link>
          <Link href={`/profile/${u.username}`} className="min-w-0 flex-1">
            <p className="truncate font-medium text-white hover:text-amber-400">{u.displayName}</p>
            <p className="truncate text-xs text-zinc-500">@{u.username}</p>
            {u.bio && <p className="mt-0.5 truncate text-xs text-zinc-600">{u.bio}</p>}
          </Link>
          <FollowButton userId={u.id} username={u.username} initialFollowing={viewerFollowingIds.includes(u.id)} />
        </div>
      ))}
    </div>
  );
}
