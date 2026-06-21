import { getTrendingTags } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const tags = await getTrendingTags(12);
  return NextResponse.json({ tags });
}
