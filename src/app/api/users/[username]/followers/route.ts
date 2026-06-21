import { getFollowers, getUserByUsername } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const users = await getFollowers(user.id);
  return NextResponse.json({ users });
}
