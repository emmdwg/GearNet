import { MessageUserButton } from "@/components/chat/MessageUserButton";
import { FollowButton } from "@/components/profile/FollowButton";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getUserByUsername, getUserPosts, getUserVehicles } from "@/lib/db";
import { getFollowStats } from "@/lib/social";
import { getSession } from "@/lib/session";
import { Bookmark, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ username: string }> };

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const session = await getSession();
  const isOwnProfile = session?.user?.id === user.id;
  const [userVehicles, userPosts, followStats] = await Promise.all([
    getUserVehicles(user.id),
    getUserPosts(user.id),
    getFollowStats(user.id, session?.user?.id),
  ]);

  const coverImage = userVehicles[0]?.image ?? userPosts[0]?.image ?? null;

  return (
    <div className="mx-auto max-w-2xl pb-10">
      {/* Cover banner */}
      <div className="relative h-40 overflow-hidden bg-zinc-900 sm:h-52">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="640px"
            className="scale-110 object-cover opacity-40 blur-[2px]"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="px-4">
        {/* Avatar + identity */}
        <div className="-mt-12 flex items-end justify-between gap-4">
          <div className="rounded-full ring-4 ring-zinc-950">
            <Avatar src={user.avatar} alt={user.displayName} size="lg" ring />
          </div>
          <div className="mb-1 flex flex-wrap items-center justify-end gap-2">
            <FollowButton userId={user.id} username={user.username} initialFollowing={followStats.isFollowing} />
            {isOwnProfile ? (
              <Link
                href="/saved"
                className="flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              >
                <Bookmark className="h-4 w-4" />
                Saved
              </Link>
            ) : (
              <MessageUserButton
                userId={user.id}
                username={user.username}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              />
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
          <p className="text-sm text-zinc-500">@{user.username}</p>
          {user.location ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-400">
              <MapPin className="h-3.5 w-3.5" />
              {user.location}
            </p>
          ) : null}
          {user.bio ? <p className="mt-3 text-sm leading-relaxed text-zinc-300">{user.bio}</p> : null}
          {user.interests.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.interests.map((interest) => (
                <Badge key={interest} variant="accent">
                  {interest}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <Stat label="Posts" value={userPosts.length} />
          <Stat label="Followers" value={followStats.followers} href={`/profile/${user.username}/followers`} />
          <Stat label="Following" value={followStats.following} href={`/profile/${user.username}/following`} />
          <Stat label="Vehicles" value={userVehicles.length} href={`/garage/${user.username}`} />
        </div>
      </div>

      <div className="mt-6">
        <ProfileTabs posts={userPosts} vehicles={userVehicles} username={user.username} />
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rounded-xl py-1 transition-colors hover:bg-zinc-800/60">
        {inner}
      </Link>
    );
  }
  return <div className="py-1">{inner}</div>;
}
