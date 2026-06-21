import { jsonArray, requireAuth } from "@/lib/api-helpers";
import { getPosts } from "@/lib/db";
import { getSession } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { imagesToJson, normalizeImages, notifyFollowersOfNewPost, primaryImage } from "@/lib/social";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  const posts = await getPosts(session?.user?.id);
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "posts", 12, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { caption, tags = [] } = body;
    const images = normalizeImages(body);

    if (images.length === 0 || !caption) {
      return NextResponse.json({ error: "At least one image and caption required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: session!.user.id,
        image: primaryImage(images),
        images: imagesToJson(images),
        caption,
        tags: jsonArray(tags),
      },
      include: { user: true },
    });

    try {
      await notifyFollowersOfNewPost(session!.user.id, post.id);
    } catch (err) {
      console.error("Failed to notify followers of new post:", err);
    }

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
