import { prisma } from "@/lib/prisma";

export type GroupConversationType = "club" | "event";

export async function getOrCreateClubConversation(clubId: string, userId: string) {
  const member = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  if (!member) return { error: "Join the club to access crew chat", status: 403 as const };

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { members: { select: { userId: true } } },
  });
  if (!club) return { error: "Club not found", status: 404 as const };

  let conversation = await prisma.conversation.findFirst({
    where: { type: "club", clubId },
  });

  if (!conversation) {
    const memberIds = [...new Set([club.ownerId, ...club.members.map((m) => m.userId)])];
    conversation = await prisma.conversation.create({
      data: {
        type: "club",
        clubId,
        name: `${club.name} Crew`,
        participants: {
          create: memberIds.map((uid) => ({ userId: uid })),
        },
      },
    });
  } else {
    const existing = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
    });
    if (!existing) {
      await prisma.conversationParticipant.create({
        data: { conversationId: conversation.id, userId },
      });
    }
  }

  return { conversation };
}

export async function getOrCreateEventConversation(eventId: string, userId: string) {
  const rsvp = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!rsvp || rsvp.rsvpStatus !== "going") {
    return { error: "RSVP as going to join event crew chat", status: 403 as const };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { where: { rsvpStatus: "going" }, select: { userId: true } } },
  });
  if (!event) return { error: "Event not found", status: 404 as const };

  let conversation = await prisma.conversation.findFirst({
    where: { type: "event", eventId },
  });

  if (!conversation) {
    const memberIds = [...new Set([event.organizerId, ...event.rsvps.map((r) => r.userId)])];
    conversation = await prisma.conversation.create({
      data: {
        type: "event",
        eventId,
        name: `${event.title} Crew`,
        participants: {
          create: memberIds.map((uid) => ({ userId: uid })),
        },
      },
    });
  } else {
    const existing = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
    });
    if (!existing) {
      await prisma.conversationParticipant.create({
        data: { conversationId: conversation.id, userId },
      });
    }
  }

  return { conversation };
}

export async function syncEventConversationParticipants(eventId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { type: "event", eventId },
    include: { participants: { select: { userId: true } } },
  });
  if (!conversation) return;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { where: { rsvpStatus: "going" }, select: { userId: true } } },
  });
  if (!event) return;

  const shouldHave = new Set([event.organizerId, ...event.rsvps.map((r) => r.userId)]);
  const have = new Set(conversation.participants.map((p) => p.userId));

  for (const uid of shouldHave) {
    if (!have.has(uid)) {
      await prisma.conversationParticipant.create({
        data: { conversationId: conversation.id, userId: uid },
      });
    }
  }

  for (const uid of have) {
    if (!shouldHave.has(uid)) {
      await prisma.conversationParticipant.delete({
        where: { conversationId_userId: { conversationId: conversation.id, userId: uid } },
      });
    }
  }
}

/** Remove a user from a club crew conversation after they leave. */
export async function removeClubConversationParticipant(clubId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { type: "club", clubId },
    select: { id: true },
  });
  if (!conversation) return;
  await prisma.conversationParticipant.deleteMany({
    where: { conversationId: conversation.id, userId },
  });
}

/** Add a user to an existing club crew conversation when they join. */
export async function ensureClubConversationParticipant(clubId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { type: "club", clubId },
    select: { id: true },
  });
  if (!conversation) return;
  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
    create: { conversationId: conversation.id, userId },
    update: {},
  });
}

/**
 * Re-check club membership / going RSVP for group chats.
 * Returns false if the user should no longer have access (and removes stale participant).
 */
export async function assertGroupChatAccess(conversationId: string, userId: string): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { type: true, clubId: true, eventId: true },
  });
  if (!conversation) return false;
  if (conversation.type === "dm" || !conversation.type) return true;

  if (conversation.type === "club" && conversation.clubId) {
    const member = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: conversation.clubId, userId } },
    });
    if (!member) {
      await prisma.conversationParticipant.deleteMany({
        where: { conversationId, userId },
      });
      return false;
    }
    return true;
  }

  if (conversation.type === "event" && conversation.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: conversation.eventId },
      select: { organizerId: true },
    });
    if (event?.organizerId === userId) return true;
    const rsvp = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId: conversation.eventId, userId } },
    });
    if (!rsvp || rsvp.rsvpStatus !== "going") {
      await prisma.conversationParticipant.deleteMany({
        where: { conversationId, userId },
      });
      return false;
    }
    return true;
  }

  return true;
}
