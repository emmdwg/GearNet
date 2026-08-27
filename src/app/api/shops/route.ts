import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  const scope = new URL(request.url).searchParams.get("scope");

  if (scope === "mine") {
    if (!session?.user?.id) return NextResponse.json([]);
    const logs = await prisma.maintenanceLog.findMany({
      where: { userId: session.user.id, shopName: { not: null } },
      select: { shopName: true, performedAt: true },
      orderBy: { performedAt: "desc" },
    });
    const byName = new Map<string, { name: string; visitCount: number; lastVisit?: string }>();
    for (const log of logs) {
      const name = log.shopName?.trim();
      if (!name) continue;
      const existing = byName.get(name.toLowerCase());
      if (existing) {
        existing.visitCount += 1;
      } else {
        byName.set(name.toLowerCase(), {
          name,
          visitCount: 1,
          lastVisit: log.performedAt.toISOString(),
        });
      }
    }
    return NextResponse.json([...byName.values()]);
  }

  const logs = await prisma.maintenanceLog.findMany({
    where: { shopName: { not: null } },
    select: { shopName: true },
    take: 200,
  });
  const counts = new Map<string, number>();
  for (const log of logs) {
    const name = log.shopName?.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return NextResponse.json(
    [...counts.entries()].map(([name, visitCount]) => ({ name, visitCount })),
  );
}
