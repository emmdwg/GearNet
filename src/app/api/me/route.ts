import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      username: session.user.username,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  });
}
