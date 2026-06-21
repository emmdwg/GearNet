import { MessageUserButton } from "@/components/chat/MessageUserButton";
import { FollowButton } from "@/components/profile/FollowButton";
import { PrivateProfileBanner } from "@/components/profile/PrivateProfileBanner";
import { ProfileAvatarEdit } from "@/components/profile/ProfileAvatarEdit";
import { ProfileCoverEdit } from "@/components/profile/ProfileCoverEdit";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { UserSafetyMenu } from "@/components/social/UserSafetyMenu";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { isBlocked } from "@/lib/blocking";
import { getUserByUsername, getUserPosts, getUserVehicles } from "@/lib/db";
import { filterUserForViewer, getProfileViewContext } from "@/lib/privacy";
import { getFollowStats } from "@/lib/social";
import { getSession } from "@/lib/session";
import { Bookmark, MapPin, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ username: string }> };

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const session = await getSession();
  if (session?.user?.id && (await isBlocked(session.user.id, user.id))) {
    redirect("/explore");
  }

  const view = await getProfileViewContext(user.id, session?.user?.id);
  const profileUser = filterUserForViewer(user, view);
  const isOwnProfile = session?.user?.id === user.id;

  const [userVehicles, userPosts, followStats] = await Promise.all([
    view.canViewGarage ? getUserVehicles(user.id) : Promise.resolve([]),
    view.canViewPosts ? getUserPosts(user.id) : Promise.resolve([]),
    getFollowStats(user.id, session?.user?.id),
  ]);

  const coverImage =
    profileUser.coverImage || userVehicles[0]?.image || userPosts[0]?.image || null;

  return (
    <div className="mx-auto max-w-2xl pb-10">
      {isOwnProfile ? (
        <ProfileCoverEdit coverImage={user.coverImage ?? ""} />
      ) : (
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
      )}

      <div className="px-4">
        {/* Avatar + identity */}
        <div className="-mt-12 flex items-end justify-between gap-4">
          {isOwnProfile ? (
            <ProfileAvatarEdit avatar={user.avatar ?? ""} />
          ) : (
            <div className="rounded-full ring-4 ring-zinc-950">
              <Avatar src={user.avatar} alt={user.displayName} size="lg" ring />
            </div>
          )}
          <div className="mb-1 flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            {!isOwnProfile ? (
              <FollowButton userId={user.id} username={user.username} initialFollowing={followStats.isFollowing} />
            ) : null}
            {isOwnProfile ? (
              <>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-amber-500/40 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Edit
                </Link>
                <Link
                  href="/saved"
                  className="flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                >
                  <Bookmark className="h-4 w-4" />
                  Saved
                </Link>
              </>
            ) : (
              <>
                <UserSafetyMenu userId={user.id} username={user.username} />
                {view.canMessage ? (
                  <MessageUserButton
                    userId={user.id}
                    username={user.username}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                  />
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
          <p className="text-sm text-zinc-500">@{user.username}</p>
          {profileUser.location ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-400">
              <MapPin className="h-3.5 w-3.5" />
              {profileUser.location}
            </p>
          ) : null}
          {profileUser.bio ? <p className="mt-3 text-sm leading-relaxed text-zinc-300">{profileUser.bio}</p> : null}
          {profileUser.interests.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profileUser.interests.map((interest) => (
                <Badge key={interest} variant="accent">
                  {interest}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-3 text-center backdrop-blur-sm">
          <Stat label="Posts" value={view.canViewPosts ? userPosts.length : 0} />
          <Stat label="Followers" value={followStats.followers} href={`/profile/${user.username}/followers`} />
          <Stat label="Following" value={followStats.following} href={`/profile/${user.username}/following`} />
          <Stat
            label="Vehicles"
            value={view.canViewGarage ? userVehicles.length : 0}
            href={view.canViewGarage ? `/garage/${user.username}` : undefined}
          />
        </div>
      </div>

      {view.access === "limited" ? (
        <PrivateProfileBanner isFollowing={view.isFollowing} isPrivate={view.isPrivate} />
      ) : null}

      {view.canViewPosts || view.canViewGarage ? (
        <div className="mt-6">
          <ProfileTabs
            posts={userPosts}
            vehicles={userVehicles}
            username={user.username}
            showGarage={view.canViewGarage}
          />
        </div>
      ) : null}
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
