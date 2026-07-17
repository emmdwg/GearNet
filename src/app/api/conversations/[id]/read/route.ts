import { requireAuth } from "@/lib/api-helpers";
import { assertGroupChatAccess } from "@/lib/group-chat";
import { broadcastReadReceipt } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await assertGroupChatAccess(id, session!.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readAt = new Date();

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
    data: { lastReadAt: readAt },
  });

  try {
    await broadcastReadReceipt(id, {
      userId: session!.user.id,
      readAt: readAt.toISOString(),
    });
  } catch {
    // read state is persisted even if broadcast fails
  }

  const other = await prisma.conversationParticipant.findFirst({
    where: { conversationId: id, userId: { not: session!.user.id } },
    select: { lastReadAt: true },
  });

  return NextResponse.json({
    lastReadAt: readAt.toISOString(),
    otherLastReadAt: other?.lastReadAt?.toISOString() ?? null,
  });
}
