import { getConversations } from "@/lib/db";
import { isBlocked } from "@/lib/blocking";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const conversations = await getConversations(session!.user.id);
  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { participantId } = await request.json();
    if (!participantId) {
      return NextResponse.json({ error: "participantId required" }, { status: 400 });
    }
    if (await isBlocked(session!.user.id, participantId)) {
      return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: session!.user.id } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
    });

    if (existing) return NextResponse.json(existing);

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: session!.user.id }, { userId: participantId }],
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
