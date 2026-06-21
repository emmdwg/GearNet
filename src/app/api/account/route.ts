import { requireAuth } from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;

  try {
    await prisma.user.delete({ where: { id: userId } });

    const supabase = createAdminClient();
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Supabase deleteUser failed:", authError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/account failed:", err);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
}
