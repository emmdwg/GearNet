import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const note = await prisma.manualGuideNote.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
    return NextResponse.json({ id: note.id, upvotes: note.upvotes });
  } catch {
    return NextResponse.json({ error: "Failed to upvote" }, { status: 404 });
  }
}
