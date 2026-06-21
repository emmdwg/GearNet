import { requireAuth } from "@/lib/api-helpers";
import { changeUsername, usernameChangeAvailable } from "@/lib/username";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { usernameChangedAt: true },
  });

  const availability = usernameChangeAvailable(user?.usernameChangedAt);
  return NextResponse.json(availability);
}

export async function PATCH(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { username } = await request.json();
    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

    const newUsername = await changeUsername(session!.user.id, username);
    return NextResponse.json({ username: newUsername });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not change username" },
      { status: 400 }
    );
  }
}
