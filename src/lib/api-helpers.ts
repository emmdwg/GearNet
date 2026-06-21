import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export function parseJsonArray(value: string): string[] {
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

export function jsonArray(value: string[]): string {
  return JSON.stringify(value);
}
