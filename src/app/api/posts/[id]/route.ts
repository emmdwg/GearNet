import { getBookmarkState, getComments, getUserLikeState, imagesToJson, normalizeImages, primaryImage, serializeImagesField } from "@/lib/social";
import { jsonArray, parseJsonArray, requireAuth } from "@/lib/api-helpers";
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
      include: { user: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      image: post.image,
      images: serializeImagesField(post.images, post.image),
      caption: post.caption,
      tags: parseJsonArray(post.tags),
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
    const data: { caption?: string; tags?: string; images?: string; image?: string } = {};

    if (typeof body.caption === "string") data.caption = body.caption.trim();
    if (Array.isArray(body.tags)) data.tags = jsonArray(body.tags.map((t: string) => t.trim()).filter(Boolean));
    if (Array.isArray(body.images) && body.images.length > 0) {
      const images = normalizeImages(body);
      data.images = imagesToJson(images);
      data.image = primaryImage(images);
    }

    const post = await prisma.post.update({ where: { id }, data, include: { user: true } });
    return NextResponse.json(post);
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
