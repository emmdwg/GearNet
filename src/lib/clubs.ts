import { jsonArray, parseJsonArray } from "@/lib/api-helpers";
import {
  canManageClub,
  canManageClubJoinRequests,
  isAssignableClubRole,
  normalizeClubRole,
  type AssignableClubRole,
} from "@/lib/club-roles";
import { DEFAULT_AVATAR } from "@/lib/constants";
import {
  ensureClubConversationParticipant,
  removeClubConversationParticipant,
} from "@/lib/group-chat";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/social";
import { NextResponse } from "next/server";

export function compactUser(user: {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar ?? DEFAULT_AVATAR,
  };
}

export function slugifyClubName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "club"
  );
}

export async function allocateClubSlug(name: string, excludeId?: string) {
  const base = slugifyClubName(name);
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await prisma.club.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export async function findClubBySlug(slug: string) {
  return prisma.club.findUnique({
    where: { slug },
    include: { owner: true },
  });
}

export function clubNotFound() {
  return NextResponse.json({ error: "Club not found" }, { status: 404 });
}

export async function getClubMembership(clubId: string, userId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  });
  const member = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  const isOwner = club?.ownerId === userId;
  return {
    member,
    isOwner,
    role: member ? normalizeClubRole(member.role) : isOwner ? ("owner" as const) : null,
    joined: Boolean(member) || isOwner,
  };
}

export async function requireClubMember(clubId: string, userId: string) {
  const membership = await getClubMembership(clubId, userId);
  if (!membership.joined) {
    return {
      membership,
      error: NextResponse.json({ error: "Join this club to continue" }, { status: 403 }),
    };
  }
  return { membership, error: null };
}

export async function requireClubManager(clubId: string, userId: string) {
  const membership = await getClubMembership(clubId, userId);
  if (!canManageClub(membership.role, membership.isOwner)) {
    return {
      membership,
      error: NextResponse.json({ error: "Only club admins can do that" }, { status: 403 }),
    };
  }
  return { membership, error: null };
}

export async function requireJoinRequestManager(clubId: string, userId: string) {
  const membership = await getClubMembership(clubId, userId);
  if (!canManageClubJoinRequests(membership.role, membership.isOwner)) {
    return {
      membership,
      error: NextResponse.json({ error: "You cannot manage join requests" }, { status: 403 }),
    };
  }
  return { membership, error: null };
}

export async function addMemberToClub(clubId: string, userId: string, role: string = "member") {
  const existing = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  if (existing) return { member: existing, alreadyMember: true };

  const member = await prisma.clubMember.create({
    data: { clubId, userId, role },
  });
  await prisma.club.update({
    where: { id: clubId },
    data: { memberCount: { increment: 1 } },
  });
  await prisma.clubJoinRequest.updateMany({
    where: { clubId, userId, status: "pending" },
    data: { status: "approved", reviewedAt: new Date() },
  });
  await ensureClubConversationParticipant(clubId, userId);
  return { member, alreadyMember: false };
}

export async function removeMemberFromClub(clubId: string, userId: string) {
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { ownerId: true } });
  if (club?.ownerId === userId) {
    return { error: "The owner cannot leave the club" };
  }
  const deleted = await prisma.clubMember.deleteMany({
    where: { clubId, userId },
  });
  if (deleted.count > 0) {
    await prisma.club.update({
      where: { id: clubId },
      data: { memberCount: { decrement: 1 } },
    });
  }
  await removeClubConversationParticipant(clubId, userId);
  return { removed: deleted.count > 0 };
}

export function serializeJoinRequest(row: {
  id: string;
  clubId: string;
  userId: string;
  message: string | null;
  status: string;
  createdAt: Date;
  user: { id: string; username: string; displayName: string; avatar: string | null };
}) {
  return {
    id: row.id,
    clubId: row.clubId,
    userId: row.userId,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    user: compactUser(row.user),
  };
}

export async function listJoinRequests(clubId: string) {
  const rows = await prisma.clubJoinRequest.findMany({
    where: { clubId, status: "pending" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(serializeJoinRequest);
}

export async function reviewJoinRequest(
  clubId: string,
  requestId: string,
  action: "approve" | "reject" | "deny",
) {
  const request = await prisma.clubJoinRequest.findFirst({
    where: { id: requestId, clubId },
  });
  if (!request) return { error: "Request not found", status: 404 as const };

  const approved = action === "approve";
  await prisma.clubJoinRequest.update({
    where: { id: request.id },
    data: { status: approved ? "approved" : "rejected", reviewedAt: new Date() },
  });
  if (approved) {
    await addMemberToClub(clubId, request.userId, "member");
  }
  return { status: approved ? "approved" : "rejected" };
}

export async function serializeChallenge(challengeId: string) {
  const challenge = await prisma.clubChallenge.findUnique({
    where: { id: challengeId },
    include: {
      winner: true,
      entries: { include: { user: true, post: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!challenge) return null;

  const entries = challenge.entries.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    postId: entry.postId,
    createdAt: entry.createdAt.toISOString(),
    user: compactUser(entry.user),
    post: entry.post
      ? { id: entry.post.id, image: entry.post.image, caption: entry.post.caption }
      : null,
  }));

  const scoreByUser = new Map<string, { score: number; user: ReturnType<typeof compactUser> }>();
  for (const entry of entries) {
    const prev = scoreByUser.get(entry.userId);
    scoreByUser.set(entry.userId, {
      score: (prev?.score ?? 0) + 1,
      user: entry.user,
    });
  }

  return {
    id: challenge.id,
    clubId: challenge.clubId,
    title: challenge.title,
    description: challenge.description,
    type: challenge.type as "photo-battle" | "attendance" | "build-of-month",
    startsAt: challenge.startsAt.toISOString(),
    endsAt: challenge.endsAt.toISOString(),
    status: challenge.status,
    winnerId: challenge.winnerId,
    winner: challenge.winner ? compactUser(challenge.winner) : null,
    createdAt: challenge.createdAt.toISOString(),
    entryCount: entries.length,
    entries,
    leaderboard: [...scoreByUser.values()]
      .sort((a, b) => b.score - a.score)
      .map((row) => ({ userId: row.user.id, score: row.score, user: row.user })),
  };
}

export async function serializeProject(projectId: string) {
  const project = await prisma.clubProject.findUnique({
    where: { id: projectId },
    include: { vehicle: true },
  });
  if (!project) return null;
  const contributorIds = parseJsonArray(project.contributorIds);
  const contributors =
    contributorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: contributorIds } },
          select: { id: true, username: true, displayName: true, avatar: true },
        })
      : [];
  return {
    id: project.id,
    clubId: project.clubId,
    vehicleId: project.vehicleId,
    title: project.title,
    description: project.description,
    coverImage: project.coverImage,
    contributorIds,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    vehicle: project.vehicle
      ? {
          id: project.vehicle.id,
          year: project.vehicle.year,
          make: project.vehicle.make,
          model: project.vehicle.model,
          image: project.vehicle.image,
          slug: project.vehicle.slug,
        }
      : null,
    contributors: contributors.map(compactUser),
  };
}

export function serializeDues(entry: {
  id: string;
  clubId: string;
  userId: string;
  amount: number;
  label: string;
  paidAt: Date | null;
  recordedById: string;
  createdAt: Date;
  user: { id: string; username: string; displayName: string; avatar: string | null };
  recordedBy: { id: string; username: string; displayName: string; avatar: string | null };
}) {
  return {
    id: entry.id,
    clubId: entry.clubId,
    userId: entry.userId,
    amount: entry.amount,
    label: entry.label,
    paidAt: entry.paidAt?.toISOString() ?? null,
    recordedById: entry.recordedById,
    createdAt: entry.createdAt.toISOString(),
    user: compactUser(entry.user),
    recordedBy: compactUser(entry.recordedBy),
  };
}

export async function notifyClubOwner(
  club: { id: string; name: string; ownerId: string },
  actorId: string,
  title: string,
  body: string,
) {
  if (club.ownerId === actorId) return;
  try {
    await createNotification({
      userId: club.ownerId,
      actorId,
      type: "follow",
      targetType: "club",
      targetId: club.id,
      title,
      body,
    });
  } catch {
    // notifications are best-effort
  }
}

export function tagsToJson(tags: unknown) {
  const list = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean)
    : typeof tags === "string"
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
  return jsonArray(list);
}

export function parseAssignableRole(value: unknown): AssignableClubRole | null {
  if (typeof value !== "string") return null;
  const role = value === "mod" ? "associate" : value;
  return isAssignableClubRole(role) ? role : null;
}
