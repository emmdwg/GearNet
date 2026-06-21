import { getSession } from "@/lib/session";
import { searchUsers } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const session = await getSession();

  const users = await searchUsers(q, session?.user?.id);
  return NextResponse.json(users);
}
