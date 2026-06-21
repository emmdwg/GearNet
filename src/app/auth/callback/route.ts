import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/explore";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/signin?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/signin?error=verification_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    await prisma.user.updateMany({
      where: { id: user.id },
      data: { emailVerified: new Date(user.email_confirmed_at) },
    });
  }

  if (next.startsWith("/auth/reset-password")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth/signin?verified=1`);
}
