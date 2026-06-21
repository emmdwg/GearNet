import { jsonArray, requireAuth } from "@/lib/api-helpers";
import { resolveAvatarForUser } from "@/lib/avatar-upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "register", 5, 10 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const { email, password, username, displayName, avatar } = body;

    if (!email || !password || !username || !displayName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { username, displayName },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Registration failed" }, { status: 400 });
    }

    const avatarUrl = await resolveAvatarForUser(data.user.id, avatar);

    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        username,
        displayName,
        avatar: avatarUrl,
        interests: jsonArray([]),
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        needsEmailVerification: true,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
  });
}
