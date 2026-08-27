import { requireAuth } from "@/lib/api-helpers";
import {
  clubNotFound,
  findClubBySlug,
  requireJoinRequestManager,
  reviewJoinRequest,
} from "@/lib/clubs";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string; requestId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug, requestId } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: manageError } = await requireJoinRequestManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const body = await request.json().catch(() => ({}));
  const action = body.action === "approve" ? "approve" : "reject";
  const result = await reviewJoinRequest(club.id, requestId, action);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json(result);
}
