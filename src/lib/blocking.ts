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
