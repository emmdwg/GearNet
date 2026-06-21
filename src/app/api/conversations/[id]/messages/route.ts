import { isBlocked } from "@/lib/blocking";
import { createNotification } from "@/lib/social";
import { getConversationMessages } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { broadcastChatMessage } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await getConversationMessages(id);
  return NextResponse.json(messages);
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: { not: session!.user.id } },
      select: { userId: true },
    });
    if (otherParticipant && (await isBlocked(session!.user.id, otherParticipant.userId))) {
      return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session!.user.id,
        content: content.trim(),
      },
      include: { sender: true },
    });

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
      data: { lastReadAt: new Date() },
    });

    const payload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      sentAt: message.sentAt.toISOString(),
    };

    await broadcastChatMessage(id, payload);

    if (otherParticipant) {
      await createNotification({
        userId: otherParticipant.userId,
        actorId: session!.user.id,
        type: "message",
        targetType: "conversation",
        targetId: id,
        title: "New message",
        body: `${message.sender.displayName}: ${message.content.slice(0, 80)}`,
      });
    }

    return NextResponse.json(payload, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
