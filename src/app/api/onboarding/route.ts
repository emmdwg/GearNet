import { requireAuth } from "@/lib/api-helpers";
import { getOnboardingStatus } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const status = await getOnboardingStatus(session!.user.id);
  return NextResponse.json(status);
}

export async function PATCH() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await prisma.user.update({
    where: { id: session!.user.id },
    data: { onboardingDismissedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
