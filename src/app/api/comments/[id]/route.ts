import { requireAuth } from "@/lib/api-helpers";
import { deleteComment } from "@/lib/social";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    await deleteComment(session!.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete comment";
    const status = message === "Not found" ? 404 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
