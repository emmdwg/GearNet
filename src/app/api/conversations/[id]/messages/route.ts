import { isBlocked } from "@/lib/blocking";
import { serializeMessageContent, messagePreview } from "@/lib/chat-content";
import { assertGroupChatAccess } from "@/lib/group-chat";
import { canSendMessage } from "@/lib/privacy";
import { createNotification } from "@/lib/social";
import { getConversationMessages } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { broadcastChatMessage, broadcastReadReceipt } from "@/lib/realtime";
import { isAllowedMediaUrl } from "@/lib/safe-fetch";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

const MAX_MESSAGE_CHARS = 4000;
const MAX_GROUP_NOTIFY = 40;

async function markConversationRead(conversationId: string, userId: string) {
  const readAt = new Date();
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: readAt },
  });

  try {
    await broadcastReadReceipt(conversationId, { userId, readAt: readAt.toISOString() });
  } catch {
    // ignore broadcast failures
  }

  return readAt;
}

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
    include: { conversation: { select: { type: true } } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await assertGroupChatAccess(id, session!.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (participant.conversation.type === "dm") {
    const other = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: { not: session!.user.id } },
      select: { userId: true },
    });
    if (other && (await isBlocked(session!.user.id, other.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const [messages, other] = await Promise.all([
    getConversationMessages(id),
    prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: { not: session!.user.id } },
      select: { lastReadAt: true },
    }),
  ]);

  await markConversationRead(id, session!.user.id);

  return NextResponse.json({
    messages,
    otherLastReadAt: other?.lastReadAt?.toISOString() ?? null,
  });
}

export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
      include: { conversation: { select: { type: true } } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!(await assertGroupChatAccess(id, session!.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isGroup = participant.conversation.type === "club" || participant.conversation.type === "event";

    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: id, userId: { not: session!.user.id } },
      select: { userId: true, lastReadAt: true },
    });
    const otherParticipant = !isGroup ? otherParticipants[0] : undefined;
    if (otherParticipant) {
      if (await isBlocked(session!.user.id, otherParticipant.userId)) {
        return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });
      }
      if (!(await canSendMessage(otherParticipant.userId, session!.user.id))) {
        return NextResponse.json({ error: "This user is not accepting messages" }, { status: 403 });
      }
    }

    const { content, imageUrl, audioUrl } = await request.json();
    const safeImage =
      typeof imageUrl === "string" && isAllowedMediaUrl(imageUrl) ? imageUrl : null;
    const safeAudio =
      typeof audioUrl === "string" && isAllowedMediaUrl(audioUrl) ? audioUrl : null;
    if (typeof imageUrl === "string" && imageUrl.trim() && !safeImage) {
      return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
    }
    if (typeof audioUrl === "string" && audioUrl.trim() && !safeAudio) {
      return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
    }
    if (typeof content === "string" && content.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }
    const serialized = serializeMessageContent(
      typeof content === "string" ? content : "",
      safeImage,
      safeAudio,
    );
    if (!serialized.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session!.user.id,
        content: serialized,
      },
      include: { sender: true },
    });

    await markConversationRead(id, session!.user.id);

    // Broadcast a nudge only — never plaintext content on open channels.
    await broadcastChatMessage(id, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sentAt: message.sentAt.toISOString(),
    });

    if (otherParticipant) {
      await createNotification({
        userId: otherParticipant.userId,
        actorId: session!.user.id,
        type: "message",
        targetType: "conversation",
        targetId: id,
        title: "New message",
        body: `${message.sender.displayName}: ${messagePreview(message.content).slice(0, 80)}`,
      });
    } else if (isGroup) {
      for (const p of otherParticipants.slice(0, MAX_GROUP_NOTIFY)) {
        await createNotification({
          userId: p.userId,
          actorId: session!.user.id,
          type: "message",
          targetType: "conversation",
          targetId: id,
          title: "Crew chat",
          body: `${message.sender.displayName}: ${messagePreview(message.content).slice(0, 80)}`,
        });
      }
    }

    return NextResponse.json(
      {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        sentAt: message.sentAt.toISOString(),
        otherLastReadAt: otherParticipant?.lastReadAt?.toISOString() ?? null,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
