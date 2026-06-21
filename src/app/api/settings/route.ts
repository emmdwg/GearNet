import { requireAuth } from "@/lib/api-helpers";
import { getOrCreateSettings } from "@/lib/social";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const settings = await getOrCreateSettings(session!.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      username: true,
      displayName: true,
      email: true,
      bio: true,
      location: true,
      avatar: true,
      coverImage: true,
      usernameChangedAt: true,
    },
  });

  return NextResponse.json({ settings, profile: user });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { settings, profile } = body as {
      settings?: Record<string, unknown>;
      profile?: {
        displayName?: string;
        bio?: string;
        location?: string;
        avatar?: string;
        coverImage?: string;
      };
    };

    if (profile) {
      const profileData: {
        displayName?: string;
        bio?: string;
        location?: string;
        avatar?: string;
        coverImage?: string;
      } = {};
      if (profile.displayName !== undefined) profileData.displayName = profile.displayName;
      if (profile.bio !== undefined) profileData.bio = profile.bio;
      if (profile.location !== undefined) profileData.location = profile.location;
      if (profile.avatar !== undefined) profileData.avatar = profile.avatar;
      if (profile.coverImage !== undefined) profileData.coverImage = profile.coverImage;

      if (Object.keys(profileData).length > 0) {
        await prisma.user.update({
          where: { id: session!.user.id },
          data: profileData,
        });
      }
    }

    if (settings) {
      await getOrCreateSettings(session!.user.id);
      await prisma.userSettings.update({
        where: { userId: session!.user.id },
        data: settings,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
