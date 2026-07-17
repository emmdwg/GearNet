import { prisma } from "@/lib/prisma";

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
}

export async function isBlocked(a: string, b: string): Promise<boolean> {
  if (a === b) return false;
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return Boolean(block);
}

async function hideDmConversations(userA: string, userB: string) {
  const shared = await prisma.conversation.findMany({
    where: {
      type: "dm",
      AND: [
        { participants: { some: { userId: userA } } },
        { participants: { some: { userId: userB } } },
      ],
    },
    select: { id: true },
  });
  if (shared.length === 0) return;
  await prisma.conversationParticipant.deleteMany({
    where: {
      conversationId: { in: shared.map((c) => c.id) },
      userId: { in: [userA, userB] },
    },
  });
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("You cannot block yourself");

  await prisma.$transaction([
    prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    }),
  ]);

  await hideDmConversations(blockerId, blockedId);
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
}

export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: string,
  details?: string
) {
  if (reporterId === reportedId) throw new Error("You cannot report yourself");
  await prisma.userReport.create({
    data: { reporterId, reportedId, reason, details: details?.trim() || null },
  });
}

export async function reportContent(
  reporterId: string,
  ownerId: string,
  targetType: "post" | "listing",
  targetId: string,
  reason: string,
  details?: string,
) {
  const payload = JSON.stringify({ targetType, targetId, note: details?.trim() || null });
  await reportUser(reporterId, ownerId, reason, payload);
}
