import { messagePreview } from "@/lib/chat-content";
import { requireAuth } from "@/lib/api-helpers";
import { isBlocked } from "@/lib/blocking";
import { serializeUser } from "@/lib/db";
import { assertGroupChatAccess } from "@/lib/group-chat";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
    });
    if (!participant) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (!(await assertGroupChatAccess(id, session!.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { sentAt: "desc" }, take: 1 },
        participants: { include: { user: true } },
        club: { select: { id: true, slug: true, name: true, image: true } },
        event: { select: { id: true, title: true, image: true } },
      },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isGroup = conversation.type === "club" || conversation.type === "event";
    const other = !isGroup
      ? conversation.participants.find((p) => p.userId !== session!.user.id)?.user
      : undefined;

    if (!isGroup && other && (await isBlocked(session!.user.id, other.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const groupName =
      conversation.name ?? conversation.club?.name ?? conversation.event?.title ?? "Crew Chat";

    return NextResponse.json({
      id: conversation.id,
      type: conversation.type,
      participantCount: conversation.participants.length,
      lastMessage: conversation.messages[0]
        ? messagePreview(conversation.messages[0].content)
        : "",
      lastMessageAt:
        conversation.messages[0]?.sentAt.toISOString() ?? conversation.createdAt.toISOString(),
      unread: 0,
      otherUser: other ? serializeUser(other) : null,
      groupName: isGroup ? groupName : undefined,
      groupImage: isGroup ? (conversation.club?.image ?? conversation.event?.image ?? null) : undefined,
      clubId: conversation.clubId ?? undefined,
      clubSlug: conversation.club?.slug,
      eventId: conversation.eventId ?? undefined,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId: id, userId: session!.user.id } },
    });

    const remaining = await prisma.conversationParticipant.count({
      where: { conversationId: id },
    });

    if (remaining === 0) {
      await prisma.conversation.delete({ where: { id } });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
