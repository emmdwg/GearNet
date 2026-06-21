import { getPostsByTag, getTrendingTags } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ tag: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const [posts, trending] = await Promise.all([getPostsByTag(decoded), getTrendingTags(8)]);
  return NextResponse.json({ tag: decoded, posts, trending });
}
