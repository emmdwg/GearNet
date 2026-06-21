import { FollowList } from "@/components/profile/FollowList";
import { getFollowing, getFollowingIds, getUserByUsername } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ username: string }> };

export default async function FollowingPage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const session = await getSession();
  const [following, viewerFollowingIds] = await Promise.all([
    getFollowing(user.id),
    session?.user?.id ? getFollowingIds(session.user.id) : Promise.resolve<string[]>([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href={`/profile/${user.username}`}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
          <p className="text-sm text-zinc-500">Following {following.length}</p>
        </div>
      </header>

      <FollowList
        users={following}
        viewerFollowingIds={viewerFollowingIds}
        emptyLabel={`${user.displayName} isn't following anyone yet.`}
      />
    </div>
  );
}
