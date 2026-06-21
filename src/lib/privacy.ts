import { isBlocked } from "@/lib/blocking";
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
  const isFollowing = viewerId ? await isFollowingUser(viewerId, profileUserId) : false;

  if (viewerId === profileUserId) {
    return {
      access: "owner",
      canViewPosts: true,
      canViewGarage: true,
      canViewLocation: true,
      canMessage: false,
      isFollowing: false,
      isPrivate: settings.profileVisibility !== "public",
    };
  }

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
