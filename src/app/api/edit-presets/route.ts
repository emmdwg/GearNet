import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const presets = await prisma.editPreset.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(presets);
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const preset = await prisma.editPreset.create({
    data: {
      userId: session!.user.id,
      name,
      adjustments: typeof body.adjustments === "string" ? body.adjustments : JSON.stringify(body.adjustments ?? {}),
      filterId: typeof body.filterId === "string" ? body.filterId : null,
    },
  });
  return NextResponse.json(preset, { status: 201 });
}
