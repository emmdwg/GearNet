import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identifier =
    (typeof body.email === "string" && body.email.trim()) ||
    (typeof body.username === "string" && body.username.trim()) ||
    (typeof body.phone === "string" && body.phone.trim()) ||
    "";
  if (!identifier) return NextResponse.json({ error: "Login identifier required" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier.replace(/^@+/, "").toLowerCase() },
        { phone: identifier },
      ],
    },
    select: { email: true, username: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: "No account found" }, { status: 404 });
  return NextResponse.json({ email: user.email, username: user.username, phone: user.phone });
}
