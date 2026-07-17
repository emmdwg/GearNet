import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/social";

const MENTION_PATTERN = /@([A-Za-z0-9_]{2,30})/g;

export function extractMentions(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const username = match[1]?.toLowerCase();
    if (username) found.add(username);
  }
  return [...found];
}

export async function notifyMentions(options: {
  actorId: string;
  text: string;
  targetType: "post" | "pit_update";
  targetId: string;
  title: string;
  bodyPrefix?: string;
}) {
  const usernames = extractMentions(options.text);
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({
    where: { username: { in: usernames, mode: "insensitive" } },
    select: { id: true, username: true },
  });

  const actor = await prisma.user.findUnique({
    where: { id: options.actorId },
    select: { displayName: true },
  });
  if (!actor) return;

  const body = options.bodyPrefix ?? `${actor.displayName} mentioned you`;

  for (const user of users) {
    await createNotification({
      userId: user.id,
      actorId: options.actorId,
      type: "mention",
      targetType: options.targetType,
      targetId: options.targetId,
      title: options.title,
      body,
    });
  }
}
