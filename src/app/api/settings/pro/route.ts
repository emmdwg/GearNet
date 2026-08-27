import { requireAuth } from "@/lib/api-helpers";
import { isProActive } from "@/lib/platform";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "trial") {
    if (isProActive(user)) {
      return NextResponse.json({
        pro: { isPro: true, proExpiresAt: user.proExpiresAt?.toISOString() ?? null },
      });
    }
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isPro: true, proExpiresAt: expires },
    });
    return NextResponse.json({
      pro: { isPro: true, proExpiresAt: updated.proExpiresAt?.toISOString() ?? null },
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
