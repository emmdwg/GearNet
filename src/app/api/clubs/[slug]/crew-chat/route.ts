import { requireAuth } from "@/lib/api-helpers";
import { clubNotFound, findClubBySlug } from "@/lib/clubs";
import { getOrCreateClubConversation } from "@/lib/group-chat";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();

  const result = await getOrCreateClubConversation(club.id, session!.user.id);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ conversationId: result.conversation!.id });
}
