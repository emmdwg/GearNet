import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const collections = await prisma.postCollection.findMany({
    where: { userId: session!.user.id },
    include: { items: { select: { postId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    collections.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt.toISOString(),
      postIds: c.items.map((i) => i.postId),
      count: c.items.length,
    })),
  );
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const created = await prisma.postCollection.create({
    data: { userId: session!.user.id, name },
  });
  return NextResponse.json(
    { id: created.id, name: created.name, createdAt: created.createdAt.toISOString(), postIds: [], count: 0 },
    { status: 201 },
  );
}
