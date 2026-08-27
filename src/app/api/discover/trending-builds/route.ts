import { getTrendingBuilds } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 20);
  const posts = await getTrendingBuilds(limit || 20, session?.user?.id);
  return NextResponse.json(posts);
}
