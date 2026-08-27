import { parseJsonArray } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 8);
  const viewer = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { interests: true, sceneTags: true, location: true },
      })
    : null;

  const tags = [
    ...parseJsonArray(viewer?.interests ?? "[]"),
    ...parseJsonArray(viewer?.sceneTags ?? "[]"),
  ].map((t) => t.toLowerCase());

  const users = await prisma.user.findMany({
    where: session?.user?.id ? { id: { not: session.user.id } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
      interests: true,
      sceneTags: true,
      location: true,
    },
  });

  const scored = users
    .map((u) => {
      const theirs = [...parseJsonArray(u.interests), ...parseJsonArray(u.sceneTags)].map((t) =>
        t.toLowerCase(),
      );
      const overlap = tags.filter((t) => theirs.includes(t));
      const sameCity =
        viewer?.location && u.location && viewer.location.toLowerCase() === u.location.toLowerCase();
      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar ?? "",
        bio: u.bio ?? "",
        matchReason: overlap[0]
          ? `Also into ${overlap[0]}`
          : sameCity
            ? "Same city"
            : "Active on GearNet",
        score: overlap.length + (sameCity ? 1 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || 8);

  return NextResponse.json(scored);
}
