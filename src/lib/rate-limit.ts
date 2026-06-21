import { NextResponse } from "next/server";

type Entry = { count: number; resetAt: number };

// In-memory fixed-window limiter. Good enough for a single instance / low traffic.
// For multi-instance production scale, swap this store for Redis/Upstash.
const store = new Map<string, Entry>();

function prune(now: number) {
  if (store.size < 5000) return;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  prune(now);

  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Returns a 429 NextResponse when the limit is exceeded, otherwise null.
 * Usage: const limited = enforceRateLimit(request, "posts", 10, 60_000); if (limited) return limited;
 */
export function enforceRateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(request);
  const { ok, resetAt } = rateLimit(`${name}:${ip}`, limit, windowMs);
  if (ok) return null;

  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
