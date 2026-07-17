import { getConversations } from "@/lib/db";
import { isBlocked } from "@/lib/blocking";
import { canSendMessage } from "@/lib/privacy";
import { requireAuth } from "@/lib/api-helpers";
import { sendConversationMessage, getOrCreateConversation } from "@/lib/marketplace-chat";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const conversations = await getConversations(session!.user.id);
    return NextResponse.json(conversations);
  } catch (err) {
    console.error("GET /api/conversations failed:", err);
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { participantId, initialMessage } = await request.json();
    if (!participantId) {
      return NextResponse.json({ error: "participantId required" }, { status: 400 });
    }
    if (await isBlocked(session!.user.id, participantId)) {
      return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });
    }
    if (!(await canSendMessage(participantId, session!.user.id))) {
      return NextResponse.json({ error: "This user is not accepting messages" }, { status: 403 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: "dm",
        AND: [
          { participants: { some: { userId: session!.user.id } } },
          { participants: { some: { userId: participantId } } },
        ],
        participants: { every: { userId: { in: [session!.user.id, participantId] } } },
      },
    });

    const conversation = await getOrCreateConversation(session!.user.id, participantId);
    if (typeof initialMessage === "string" && initialMessage.trim()) {
      await sendConversationMessage(conversation.id, session!.user.id, initialMessage.trim());
    }

    return NextResponse.json(conversation, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
