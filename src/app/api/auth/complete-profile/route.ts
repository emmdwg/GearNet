import { jsonArray, requireAuth } from "@/lib/api-helpers";
import { normalizePhone } from "@/lib/auth-errors";
import { resolveAvatarForUser } from "@/lib/avatar-upload";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { username, displayName, phone, avatar } = body;

    if (!username || !displayName) {
      return NextResponse.json({ error: "Username and display name are required" }, { status: 400 });
    }

    const existingProfile = await prisma.user.findUnique({ where: { id: session!.user.id } });
    if (existingProfile) {
      return NextResponse.json({ id: existingProfile.id, username: existingProfile.username });
    }

    let normalizedPhone: string | null = null;
    if (phone) {
      try {
        normalizedPhone = normalizePhone(String(phone));
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Invalid phone number" },
          { status: 400 }
        );
      }
    }

    const taken = await prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])],
      },
    });

    if (taken) {
      return NextResponse.json({ error: "Username or phone already taken" }, { status: 409 });
    }

    const avatarUrl = await resolveAvatarForUser(session!.user.id, avatar);

    const user = await prisma.user.create({
      data: {
        id: session!.user.id,
        email: session!.user.email || `${session!.user.id}@phone.gearnet.app`,
        phone: normalizedPhone,
        username,
        displayName,
        avatar: avatarUrl,
        interests: jsonArray([]),
      },
    });

    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Profile setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
