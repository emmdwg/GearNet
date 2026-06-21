import { prisma } from "@/lib/prisma";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
export const USERNAME_CHANGE_COOLDOWN_DAYS = 30;

export function validateUsername(username: string): string | null {
  const value = username.trim().toLowerCase();
  if (!USERNAME_REGEX.test(value)) {
    return "Username must be 3–30 characters (letters, numbers, underscore only)";
  }
  return null;
}

export function usernameChangeAvailable(usernameChangedAt: Date | null | undefined): {
  allowed: boolean;
  nextChangeAt: string | null;
} {
  if (!usernameChangedAt) return { allowed: true, nextChangeAt: null };
  const next = new Date(usernameChangedAt);
  next.setDate(next.getDate() + USERNAME_CHANGE_COOLDOWN_DAYS);
  if (next <= new Date()) return { allowed: true, nextChangeAt: null };
  return { allowed: false, nextChangeAt: next.toISOString() };
}

export async function changeUsername(userId: string, newUsername: string) {
  const username = newUsername.trim().toLowerCase();
  const validationError = validateUsername(username);
  if (validationError) throw new Error(validationError);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, usernameChangedAt: true },
  });
  if (!user) throw new Error("User not found");
  if (user.username === username) return user.username;

  const { allowed, nextChangeAt } = usernameChangeAvailable(user.usernameChangedAt);
  if (!allowed) {
    throw new Error(`You can change your username again on ${new Date(nextChangeAt!).toLocaleDateString()}`);
  }

  const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (taken && taken.id !== userId) throw new Error("Username is already taken");

  await prisma.user.update({
    where: { id: userId },
    data: { username, usernameChangedAt: new Date() },
  });

  return username;
}
