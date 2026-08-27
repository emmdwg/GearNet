import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const rows = await prisma.userBlock.findMany({
    where: { blockerId: session!.user.id },
    include: { blocked: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    rows.map((row) => ({
      id: row.blocked.id,
      username: row.blocked.username,
      displayName: row.blocked.displayName,
    })),
  );
}
