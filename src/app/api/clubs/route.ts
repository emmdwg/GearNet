import { jsonArray, requireAuth } from "@/lib/api-helpers";
import { allocateClubSlug } from "@/lib/clubs";
import { getClubs } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  const clubs = await getClubs(session?.user?.id);
  return NextResponse.json(clubs);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "clubs", 8, 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const slug = await allocateClubSlug(name);
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : [];

    const club = await prisma.$transaction(async (tx) => {
      const created = await tx.club.create({
        data: {
          slug,
          name,
          description,
          city: typeof body.city === "string" ? body.city.trim() || null : null,
          image: typeof body.image === "string" ? body.image || null : null,
          coverImage: typeof body.coverImage === "string" ? body.coverImage || null : null,
          tags: jsonArray(tags),
          ownerId: session!.user.id,
          memberCount: 1,
          isPublic: body.isPublic !== false,
          requiresApproval: Boolean(body.requiresApproval),
        },
        include: { owner: true },
      });
      await tx.clubMember.create({
        data: { clubId: created.id, userId: session!.user.id, role: "owner" },
      });
      return created;
    });

    return NextResponse.json(
      {
        ...club,
        tags,
        joined: true,
        role: "owner",
        joinRequestPending: false,
        pendingRequestCount: 0,
        access: "full",
        createdAt: club.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/clubs failed:", err);
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 });
  }
}
