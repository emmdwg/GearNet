import { requireAuth } from "@/lib/api-helpers";
import { enforceRateLimit } from "@/lib/rate-limit";
import { addComment, getComments, type SocialTargetType } from "@/lib/social";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

function parseTargetType(value: string | null): SocialTargetType | null {
  if (value === "post" || value === "pit_update") return value;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = parseTargetType(searchParams.get("targetType"));
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType and targetId required" }, { status: 400 });
  }

  const session = await getSession();
  const comments = await getComments(targetType, targetId, session?.user?.id);
  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "comments", 30, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const targetType = parseTargetType(body.targetType);
    const targetId = body.targetId as string | undefined;
    const content = body.content as string | undefined;

    if (!targetType || !targetId || !content?.trim()) {
      return NextResponse.json({ error: "targetType, targetId, and content required" }, { status: 400 });
    }

    const parentId = typeof body.parentId === "string" ? body.parentId : undefined;

    const comment = await addComment(session!.user.id, targetType, targetId, content.trim(), parentId);
    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
