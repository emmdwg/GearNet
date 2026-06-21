import { requireAuth } from "@/lib/api-helpers";
import { reportUser } from "@/lib/blocking";
import { NextResponse } from "next/server";

const REASONS = ["spam", "harassment", "inappropriate", "impersonation", "other"];

export async function POST(request: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { userId, reason, details } = await request.json();
    if (!userId || !reason) {
      return NextResponse.json({ error: "User and reason required" }, { status: 400 });
    }
    if (!REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    await reportUser(session!.user.id, userId, reason, details);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not submit report" },
      { status: 400 }
    );
  }
}
