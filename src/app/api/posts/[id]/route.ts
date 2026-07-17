import {
  getBookmarkState,
  getComments,
  getUserLikeState,
  imagesToJson,
  normalizeImages,
  primaryImage,
  serializeImagesField,
  serializePostMediaFields,
  validateVideoPayload,
  videoChaptersToJson,
} from "@/lib/social";
import { jsonArray, parseJsonArray, requireAuth } from "@/lib/api-helpers";
import { isBlocked } from "@/lib/blocking";
import { buildPostLegendaryFields } from "@/lib/post-fields";
import { getProfileViewContext } from "@/lib/privacy";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSession();

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        club: { select: { id: true, isPublic: true, requiresApproval: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === post.userId;
    if (post.status !== "published" && !isOwner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session?.user?.id && (await isBlocked(session.user.id, post.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!isOwner) {
      const view = await getProfileViewContext(post.userId, session?.user?.id);
      if (!view.canViewPosts) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    if (post.clubId && post.club) {
      const needsMembership = !post.club.isPublic || Boolean(post.club.requiresApproval);
      if (needsMembership) {
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const member = await prisma.clubMember.findUnique({
          where: { clubId_userId: { clubId: post.club.id, userId: session.user.id } },
        });
        if (!member) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      }
    }

    let commentList: Awaited<ReturnType<typeof getComments>> = [];
    let liked = false;
    let bookmarked = false;

    try {
      commentList = await getComments("post", id, session?.user?.id);
    } catch (err) {
      console.error("Failed to load post comments:", err);
    }

    try {
      liked = await getUserLikeState(session?.user?.id, "post", id);
    } catch (err) {
      console.error("Failed to load post like state:", err);
    }

    try {
      bookmarked = await getBookmarkState(session?.user?.id, "post", id);
    } catch (err) {
      console.error("Failed to load post bookmark state:", err);
    }

    return NextResponse.json({
      id: post.id,
      userId: post.userId,
      vehicleId: post.vehicleId,
      postType: post.postType,
      beforeImage: post.beforeImage,
      afterImage: post.afterImage,
      inspiredByPostId: post.inspiredByPostId,
      collaborators: parseJsonArray(post.collaborators),
      audioUrl: post.audioUrl,
      latitude: post.latitude,
      longitude: post.longitude,
      ...serializePostMediaFields(post),
      caption: post.caption,
      tags: parseJsonArray(post.tags),
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      isSponsored: post.isSponsored,
      sponsorName: post.sponsorName,
      sponsorUrl: post.sponsorUrl,
      likes: post.likes,
      comments: post.commentCount,
      liked,
      bookmarked,
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        username: post.user.username,
        displayName: post.user.displayName,
        avatar: post.user.avatar ?? "",
      },
      commentList,
    });
  } catch (err) {
    console.error("GET /api/posts/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "You can only edit your own posts" }, { status: 403 });
    }

    const body = await request.json();
    const data: {
      caption?: string;
      tags?: string;
      images?: string;
      image?: string;
      mediaType?: string;
      videoUrl?: string | null;
      videoDuration?: number | null;
      videoPoster?: string | null;
      videoChapters?: string;
      vehicleId?: string | null;
      postType?: string;
      beforeImage?: string | null;
      afterImage?: string | null;
      inspiredByPostId?: string | null;
      collaborators?: string;
      audioUrl?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      status?: string;
      scheduledAt?: Date | null;
    } = {};

    if (typeof body.caption === "string") data.caption = body.caption.trim();
    if (body.status === "draft" || body.status === "published" || body.status === "scheduled") {
      data.status = body.status;
    }

    if (typeof body.scheduledAt === "string" && body.scheduledAt.trim()) {
      const at = new Date(body.scheduledAt);
      if (Number.isNaN(at.getTime()) || at <= new Date()) {
        return NextResponse.json({ error: "scheduledAt must be a valid future date" }, { status: 400 });
      }
      data.scheduledAt = at;
      data.status = "scheduled";
    } else if (body.status === "scheduled") {
      return NextResponse.json({ error: "scheduledAt is required when status is scheduled" }, { status: 400 });
    } else if (body.status === "published" || body.status === "draft") {
      data.scheduledAt = null;
    } else if (body.scheduledAt === null) {
      data.scheduledAt = null;
    }

    if (Array.isArray(body.tags)) data.tags = jsonArray(body.tags.map((t: string) => t.trim()).filter(Boolean));
    Object.assign(data, buildPostLegendaryFields(body));

    if (typeof data.vehicleId === "string" && data.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
        select: { userId: true },
      });
      if (!vehicle || vehicle.userId !== session!.user.id) {
        return NextResponse.json({ error: "Invalid vehicle" }, { status: 400 });
      }
    }
    if (body.mediaType === "video" || typeof body.videoUrl === "string") {
      const hasVideo = typeof body.videoUrl === "string" && body.videoUrl.trim().length > 0;
      if (hasVideo) {
        const videoError = validateVideoPayload(body);
        if (videoError) return NextResponse.json({ error: videoError }, { status: 400 });
        const images = normalizeImages(body);
        const poster = body.videoPoster || body.image || primaryImage(images);
        data.mediaType = "video";
        data.videoUrl = body.videoUrl;
        data.videoDuration = typeof body.videoDuration === "number" ? Math.round(body.videoDuration) : null;
        data.videoPoster = poster || null;
        if (body.videoChapters !== undefined) {
          data.videoChapters = videoChaptersToJson(body.videoChapters);
        }
        data.image = poster || body.videoUrl;
        if (images.length > 0) {
          data.images = imagesToJson(images);
        }
      } else {
        data.mediaType = "image";
        data.videoUrl = null;
        data.videoDuration = null;
        data.videoPoster = null;
        data.videoChapters = "[]";
      }
    }

    if (Array.isArray(body.images) && body.images.length > 0) {
      const images = normalizeImages(body);
      data.mediaType = data.videoUrl ? "video" : "image";
      data.images = imagesToJson(images);
      data.image = data.videoPoster || primaryImage(images);
      if (!data.videoUrl) {
        data.videoUrl = null;
        data.videoDuration = null;
        data.videoPoster = null;
        data.videoChapters = "[]";
      }
    }

    const post = await prisma.post.update({ where: { id }, data, include: { user: true } });
    return NextResponse.json({
      ...post,
      images: serializeImagesField(post.images, post.image),
    });
  } catch (err) {
    console.error("PATCH /api/posts/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.like.deleteMany({ where: { targetType: "post", targetId: id } }),
      prisma.comment.deleteMany({ where: { targetType: "post", targetId: id } }),
      prisma.bookmark.deleteMany({ where: { targetType: "post", targetId: id } }),
      prisma.notification.deleteMany({ where: { targetType: "post", targetId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/posts/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
