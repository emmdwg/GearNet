import { serializeChallenge } from "@/lib/clubs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.clubChallenge.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const challenges = (await Promise.all(rows.map((row) => serializeChallenge(row.id)))).filter(Boolean);
  return NextResponse.json(challenges);
}
