import { requireAuth } from "@/lib/api-helpers";
import {
  clubNotFound,
  findClubBySlug,
  listJoinRequests,
  requireJoinRequestManager,
  reviewJoinRequest,
} from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: manageError } = await requireJoinRequestManager(club.id, session!.user.id);
  if (manageError) return manageError;

  return NextResponse.json(await listJoinRequests(club.id));
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;
  const club = await findClubBySlug(slug);
  if (!club) return clubNotFound();
  const { error: manageError } = await requireJoinRequestManager(club.id, session!.user.id);
  if (manageError) return manageError;

  const body = await request.json().catch(() => ({}));
  const action = body.action === "approve" ? "approve" : "reject";
  let requestId = typeof body.requestId === "string" ? body.requestId : "";
  if (!requestId && typeof body.userId === "string") {
    const row = await prisma.clubJoinRequest.findUnique({
      where: { clubId_userId: { clubId: club.id, userId: body.userId } },
    });
    requestId = row?.id ?? "";
  }
  if (!requestId) {
    return NextResponse.json({ error: "Request required" }, { status: 400 });
  }

  const result = await reviewJoinRequest(club.id, requestId, action);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json(result);
}
