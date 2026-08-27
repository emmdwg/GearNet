import { prisma } from "@/lib/prisma";

export async function getCrewOwnerIdsForViewer(viewerId: string) {
  const rows = await prisma.crewMember.findMany({
    where: { crewUserId: viewerId },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

type PitUpdateRow = {
  userId: string;
  visibility: string;
};

export function filterPitUpdatesForViewer<T extends PitUpdateRow>(
  updates: T[],
  viewerId: string | undefined,
  followingIds: Set<string>,
  crewOwnerIds: Set<string>,
) {
  return updates.filter((u) => {
    if (u.visibility === "public") return true;
    if (!viewerId) return false;
    if (u.userId === viewerId) return true;
    if (u.visibility === "followers") return followingIds.has(u.userId);
    if (u.visibility === "crew") return crewOwnerIds.has(u.userId) || followingIds.has(u.userId);
    return false;
  });
}
