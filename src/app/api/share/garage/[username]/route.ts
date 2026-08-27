import { getUserByUsername } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const cover = user.coverImage || user.avatar;
  if (typeof cover === "string" && cover.startsWith("http")) return NextResponse.redirect(cover);
  return NextResponse.json({ username: user.username, coverImage: user.coverImage });
}
