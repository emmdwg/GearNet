import { getBlockedUserIds, isBlocked } from "@/lib/blocking";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/social";

export type ProfileAccessLevel = "owner" | "full" | "limited";

export type ProfileViewContext = {
  access: ProfileAccessLevel;
  canViewPosts: boolean;
  canViewGarage: boolean;
  canViewLocation: boolean;
  canMessage: boolean;
  isFollowing: boolean;
  isPrivate: boolean;
  /** Owner setting: garage deliberately hidden even if profile is visible. */
  showGarage: boolean;
};

async function isFollowingUser(followerId: string, followingId: string) {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return Boolean(follow);
}

export async function canSendMessage(recipientId: string, senderId: string): Promise<boolean> {
  if (recipientId === senderId) return false;
  if (await isBlocked(recipientId, senderId)) return false;

  const settings = await getOrCreateSettings(recipientId);
  if (settings.allowMessages === "none") return false;
  if (settings.allowMessages === "everyone") return true;
  if (settings.allowMessages === "following") {
    return isFollowingUser(recipientId, senderId);
  }
  return false;
}

export async function getProfileViewContext(
  profileUserId: string,
  viewerId?: string | null
): Promise<ProfileViewContext> {
  const settings = await getOrCreateSettings(profileUserId);

  if (viewerId === profileUserId) {
    return {
      access: "owner",
      canViewPosts: true,
      canViewGarage: true,
      canViewLocation: true,
      canMessage: false,
      isFollowing: false,
      isPrivate: settings.profileVisibility !== "public",
      showGarage: settings.showGarage,
    };
  }

  if (viewerId && (await isBlocked(profileUserId, viewerId))) {
    return {
      access: "limited",
      canViewPosts: false,
      canViewGarage: false,
      canViewLocation: false,
      canMessage: false,
      isFollowing: false,
      isPrivate: true,
      showGarage: false,
    };
  }

  const isFollowing = viewerId ? await isFollowingUser(viewerId, profileUserId) : false;
  const restricted =
    settings.profileVisibility === "followers" || settings.profileVisibility === "private";
  const canViewContent = !restricted || isFollowing;

  return {
    access: canViewContent ? "full" : "limited",
    canViewPosts: canViewContent,
    canViewGarage: canViewContent && settings.showGarage,
    canViewLocation: canViewContent && settings.showLocation,
    canMessage: viewerId ? await canSendMessage(profileUserId, viewerId) : false,
    isFollowing,
    isPrivate: restricted,
    showGarage: settings.showGarage,
  };
}

type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverImage?: string | null;
  bio: string;
  location: string;
  interests: string[];
};

export function filterUserForViewer<T extends PublicUser>(user: T, ctx: ProfileViewContext): T {
  if (ctx.access === "owner" || ctx.access === "full") {
    return {
      ...user,
      location: ctx.canViewLocation ? user.location : "",
    };
  }

  return {
    ...user,
    bio: "",
    location: "",
    interests: [],
    coverImage: null,
  };
}

/**
 * Batch-check which authors' posts a viewer may see in Explore/search/discover.
 * Public authors are always visible; followers/private require an active follow.
 * Blocked users (either direction) are excluded.
 */
export async function getDiscoverableAuthorIds(
  authorIds: string[],
  viewerId?: string | null,
): Promise<Set<string>> {
  const unique = [...new Set(authorIds.filter(Boolean))];
  if (unique.length === 0) return new Set();

  const [blockedIds, settingsRows, followRows] = await Promise.all([
    viewerId ? getBlockedUserIds(viewerId) : Promise.resolve([] as string[]),
    prisma.userSettings.findMany({
      where: { userId: { in: unique } },
      select: { userId: true, profileVisibility: true },
    }),
    viewerId
      ? prisma.follow.findMany({
          where: { followerId: viewerId, followingId: { in: unique } },
          select: { followingId: true },
        })
      : Promise.resolve([] as { followingId: string }[]),
  ]);

  const blocked = new Set(blockedIds);
  const visibility = new Map(
    settingsRows.map((s) => [s.userId, s.profileVisibility ?? "public"] as const),
  );
  const following = new Set(followRows.map((f) => f.followingId));

  const allowed = new Set<string>();
  for (const id of unique) {
    if (viewerId && id === viewerId) {
      allowed.add(id);
      continue;
    }
    if (blocked.has(id)) continue;
    const vis = visibility.get(id) ?? "public";
    if (vis === "public") {
      allowed.add(id);
      continue;
    }
    if (viewerId && following.has(id)) allowed.add(id);
  }
  return allowed;
}

export async function filterItemsByDiscoverableAuthor<T extends { userId: string }>(
  items: T[],
  viewerId?: string | null,
): Promise<T[]> {
  if (items.length === 0) return items;
  const allowed = await getDiscoverableAuthorIds(
    items.map((i) => i.userId),
    viewerId,
  );
  return items.filter((i) => allowed.has(i.userId));
}
