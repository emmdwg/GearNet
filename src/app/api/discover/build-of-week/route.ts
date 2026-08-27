import { getBuildOfWeek } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  const post = await getBuildOfWeek(session?.user?.id);
  return NextResponse.json({ post });
}
