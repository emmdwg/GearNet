import { requireAuth } from "@/lib/api-helpers";
import { getOrCreateSettings } from "@/lib/social";
import { serializeUserSettings } from "@/lib/settings-serialize";
import { prisma } from "@/lib/prisma";
import { isProActive } from "@/lib/platform";
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
      isPro: true,
      proExpiresAt: true,
      garageSlug: true,
      primaryVehicleId: true,
      verifiedSeller: true,
      isVerifiedShop: true,
    },
  });

  return NextResponse.json({
    settings: serializeUserSettings(settings),
    profile: user
      ? {
          ...user,
          isPro: isProActive(user),
          proExpiresAt: user.proExpiresAt?.toISOString() ?? null,
        }
      : null,
  });
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

    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      await getOrCreateSettings(session!.user.id);

      // Allowlist only — never pass raw client objects into Prisma (blocks nested relation writes).
      const BOOL_KEYS = [
        "emailNotifications",
        "pushNotifications",
        "activityAlerts",
        "messageAlerts",
        "meetReminders",
        "marketplaceAlerts",
        "weeklyDigest",
        "showLocation",
        "showGarage",
        "alwaysWatermarkExports",
        "alwaysBlurPlates",
      ] as const;
      const STRING_KEYS = [
        "quietHoursStart",
        "quietHoursEnd",
        "theme",
      ] as const;
      const PROFILE_VISIBILITY = new Set(["public", "followers", "private"]);
      const ALLOW_MESSAGES = new Set(["everyone", "following", "none"]);

      const data: Record<string, unknown> = {};
      for (const key of BOOL_KEYS) {
        if (typeof settings[key] === "boolean") data[key] = settings[key];
      }
      for (const key of STRING_KEYS) {
        if (typeof settings[key] === "string") data[key] = settings[key].slice(0, 80);
      }
      if (typeof settings.profileVisibility === "string" && PROFILE_VISIBILITY.has(settings.profileVisibility)) {
        data.profileVisibility = settings.profileVisibility;
      }
      if (typeof settings.allowMessages === "string" && ALLOW_MESSAGES.has(settings.allowMessages)) {
        data.allowMessages = settings.allowMessages;
      }
      if (typeof settings.nearYouRadius === "number" && Number.isFinite(settings.nearYouRadius)) {
        data.nearYouRadius = Math.min(500, Math.max(1, Math.round(settings.nearYouRadius)));
      }
      if (Array.isArray(settings.sceneTags)) {
        data.sceneTags = JSON.stringify(
          settings.sceneTags.filter((t): t is string => typeof t === "string").slice(0, 40)
        );
      }

      if (Object.keys(data).length > 0) {
        await prisma.userSettings.update({
          where: { userId: session!.user.id },
          data,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
