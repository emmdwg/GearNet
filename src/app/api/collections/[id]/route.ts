import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const collection = await prisma.postCollection.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      items: {
        include: { post: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: collection.id,
    name: collection.name,
    createdAt: collection.createdAt.toISOString(),
    posts: collection.items.map((item) => item.post),
  });
}
