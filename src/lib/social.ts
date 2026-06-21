import { jsonArray, parseJsonArray } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export type SocialTargetType = "post" | "pit_update";
export type LikeTargetType = SocialTargetType | "comment";

export function normalizeImages(input: {
  images?: string[];
  image?: string;
}): string[] {
  if (Array.isArray(input.images) && input.images.length > 0) {
    return input.images.filter(Boolean);
  }
  if (input.image) return [input.image];
  return [];
}

export function primaryImage(images: string[], fallback = ""): string {
  return images[0] ?? fallback;
}

async function getTargetOwner(targetType: SocialTargetType, targetId: string) {
  if (targetType === "post") {
    const post = await prisma.post.findUnique({ where: { id: targetId }, select: { userId: true } });
    return post?.userId;
  }
  if (targetType === "pit_update") {
    const update = await prisma.pitUpdate.findUnique({ where: { id: targetId }, select: { userId: true } });
    return update?.userId;
  }
  return undefined;
}

async function incrementLikeCount(targetType: SocialTargetType, targetId: string, delta: number) {
  if (targetType === "post") {
    await prisma.post.update({ where: { id: targetId }, data: { likes: { increment: delta } } });
  } else {
    await prisma.pitUpdate.update({ where: { id: targetId }, data: { likes: { increment: delta } } });
  }
}

async function incrementCommentCount(targetType: SocialTargetType, targetId: string, delta: number) {
  if (targetType === "post") {
    await prisma.post.update({ where: { id: targetId }, data: { commentCount: { increment: delta } } });
  } else {
    await prisma.pitUpdate.update({ where: { id: targetId }, data: { commentCount: { increment: delta } } });
  }
}

export async function createNotification(data: {
  userId: string;
  actorId: string;
  type: string;
  targetType?: string;
  targetId?: string;
  title: string;
  body: string;
}) {
  if (data.userId === data.actorId) return;

  const settings = await prisma.userSettings.findUnique({ where: { userId: data.userId } });
  if (settings && !settings.activityAlerts) return;

  await prisma.notification.create({ data });
}

export async function toggleLike(userId: string, targetType: LikeTargetType, targetId: string) {
  const existing = await prisma.like.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    if (targetType === "post" || targetType === "pit_update") {
      await incrementLikeCount(targetType, targetId, -1);
    }
    return { liked: false };
  }

  await prisma.like.create({ data: { userId, targetType, targetId } });
  if (targetType === "post" || targetType === "pit_update") {
    await incrementLikeCount(targetType, targetId, 1);
  }

  const actor = await prisma.user.findUnique({ where: { id: userId } });
  if (!actor) return { liked: true };

  if (targetType === "comment") {
    const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { userId: true } });
    if (comment && comment.userId !== userId) {
      await createNotification({
        userId: comment.userId,
        actorId: userId,
        type: "like",
        targetType: "comment",
        targetId,
        title: "Comment liked",
        body: `${actor.displayName} liked your comment`,
      });
    }
    return { liked: true };
  }

  const ownerId = await getTargetOwner(targetType, targetId);
  if (ownerId && ownerId !== userId) {
    await createNotification({
      userId: ownerId,
      actorId: userId,
      type: "like",
      targetType,
      targetId,
      title: "New like",
      body: `${actor.displayName} liked your ${targetType === "pit_update" ? "pit update" : "post"}`,
    });
  }

  return { liked: true };
}

export async function addComment(
  userId: string,
  targetType: SocialTargetType,
  targetId: string,
  content: string,
  parentId?: string
) {
  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentId, targetType, targetId },
      select: { userId: true },
    });
    if (!parent) throw new Error("Parent comment not found");
  }

  const comment = await prisma.comment.create({
    data: { userId, targetType, targetId, content, parentId: parentId ?? null },
    include: { user: true },
  });

  await incrementCommentCount(targetType, targetId, 1);

  const actor = comment.user;
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { userId: true } });
    if (parent && parent.userId !== userId) {
      await createNotification({
        userId: parent.userId,
        actorId: userId,
        type: "reply",
        targetType,
        targetId,
        title: "New reply",
        body: `${actor.displayName}: ${content.slice(0, 80)}`,
      });
    }
  } else {
    const ownerId = await getTargetOwner(targetType, targetId);
    if (ownerId && ownerId !== userId) {
      await createNotification({
        userId: ownerId,
        actorId: userId,
        type: "comment",
        targetType,
        targetId,
        title: "New comment",
        body: `${actor.displayName}: ${content.slice(0, 80)}`,
      });
    }
  }

  return serializeComment(comment, 0, false, []);
}

type SerializedComment = {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  parentId: string | null;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatar: string };
  replies: SerializedComment[];
};

function serializeComment(
  comment: {
    id: string;
    userId: string;
    targetType: string;
    targetId: string;
    parentId: string | null;
    content: string;
    createdAt: Date;
    user: { id: string; username: string; displayName: string; avatar: string | null };
  },
  likes: number,
  liked: boolean,
  replies: SerializedComment[]
): SerializedComment {
  return {
    id: comment.id,
    userId: comment.userId,
    targetType: comment.targetType,
    targetId: comment.targetId,
    parentId: comment.parentId,
    content: comment.content,
    likes,
    liked,
    createdAt: comment.createdAt.toISOString(),
    user: {
      id: comment.user.id,
      username: comment.user.username,
      displayName: comment.user.displayName,
      avatar: comment.user.avatar ?? "",
    },
    replies,
  };
}

export async function getComments(targetType: SocialTargetType, targetId: string, viewerId?: string) {
  const comments = await prisma.comment.findMany({
    where: { targetType, targetId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  if (comments.length === 0) return [];

  const commentIds = comments.map((c) => c.id);
  const likeGroups = await prisma.like.groupBy({
    by: ["targetId"],
    where: { targetType: "comment", targetId: { in: commentIds } },
    _count: { targetId: true },
  });
  const likeCounts = new Map(likeGroups.map((g) => [g.targetId, g._count.targetId]));

  let likedIds = new Set<string>();
  if (viewerId) {
    const viewerLikes = await prisma.like.findMany({
      where: { userId: viewerId, targetType: "comment", targetId: { in: commentIds } },
      select: { targetId: true },
    });
    likedIds = new Set(viewerLikes.map((l) => l.targetId));
  }

  const byId = new Map(
    comments.map((c) =>
      [
        c.id,
        serializeComment(c, likeCounts.get(c.id) ?? 0, likedIds.has(c.id), []),
      ] as const
    )
  );

  const roots: SerializedComment[] = [];
  for (const c of comments) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(node);
    } else if (!c.parentId) {
      roots.push(node);
    }
  }

  return roots;
}

export async function getUserLikeState(userId: string | undefined, targetType: SocialTargetType, targetId: string) {
  if (!userId) return false;
  const like = await prisma.like.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });
  return Boolean(like);
}

export async function getNotifications(userId: string) {
  const items = await prisma.notification.findMany({
    where: { userId },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return items.map((n) => ({
    id: n.id,
    type: n.type,
    targetType: n.targetType,
    targetId: n.targetId,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    actor: {
      id: n.actor.id,
      username: n.actor.username,
      displayName: n.actor.displayName,
      avatar: n.actor.avatar ?? "",
    },
  }));
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function getOrCreateSettings(userId: string) {
  const existing = await prisma.userSettings.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userSettings.create({ data: { userId } });
}

export type BookmarkTargetType = "post" | "listing";

export async function toggleBookmark(userId: string, targetType: BookmarkTargetType, targetId: string) {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }

  await prisma.bookmark.create({ data: { userId, targetType, targetId } });
  return { bookmarked: true };
}

export async function getBookmarkState(userId: string | undefined, targetType: BookmarkTargetType, targetId: string) {
  if (!userId) return false;
  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });
  return Boolean(bookmark);
}

export async function getBookmarkIds(userId: string, targetType: BookmarkTargetType) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, targetType },
    orderBy: { createdAt: "desc" },
    select: { targetId: true },
  });
  return bookmarks.map((b) => b.targetId);
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) return { following: false };

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return { following: false };
  }

  await prisma.follow.create({ data: { followerId, followingId } });

  const actor = await prisma.user.findUnique({ where: { id: followerId } });
  if (actor) {
    await createNotification({
      userId: followingId,
      actorId: followerId,
      type: "follow",
      title: "New follower",
      body: `${actor.displayName} started following you`,
    });
  }

  return { following: true };
}

export async function notifyFollowersOfNewPost(authorId: string, postId: string) {
  const [author, follows] = await Promise.all([
    prisma.user.findUnique({ where: { id: authorId } }),
    prisma.follow.findMany({ where: { followingId: authorId }, select: { followerId: true } }),
  ]);

  if (!author || follows.length === 0) return;

  const followerIds = follows.map((f) => f.followerId).filter((id) => id !== authorId);
  if (followerIds.length === 0) return;

  const muted = await prisma.userSettings.findMany({
    where: { userId: { in: followerIds }, activityAlerts: false },
    select: { userId: true },
  });
  const mutedSet = new Set(muted.map((s) => s.userId));
  const recipients = followerIds.filter((id) => !mutedSet.has(id));
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      actorId: authorId,
      type: "post",
      targetType: "post",
      targetId: postId,
      title: "New post",
      body: `${author.displayName} shared a new post`,
    })),
  });
}

export async function getFollowStats(userId: string, viewerId?: string) {
  const [followers, following, viewerFollows] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    viewerId && viewerId !== userId
      ? prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: userId } } })
      : Promise.resolve(null),
  ]);

  return { followers, following, isFollowing: Boolean(viewerFollows) };
}

export function serializeImagesField(imagesJson: string, fallbackImage: string) {
  const parsed = parseJsonArray(imagesJson);
  return parsed.length > 0 ? parsed : fallbackImage ? [fallbackImage] : [];
}

export function imagesToJson(images: string[]) {
  return jsonArray(images);
}
