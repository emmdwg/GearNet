import { requireAuth } from "@/lib/api-helpers";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const rows = await prisma.mutedUser.findMany({
    where: { userId: session!.user.id },
    include: { mutedUser: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    rows.map((row) => ({
      id: row.mutedUser.id,
      username: row.mutedUser.username,
      displayName: row.mutedUser.displayName,
      avatar: row.mutedUser.avatar ?? DEFAULT_AVATAR,
      mutedAt: row.createdAt.toISOString(),
    })),
  );
}
