import { isIP } from "net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateHostnameOrIp(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (host === "0.0.0.0" || host === "::" || host === "::1") return true;

  const ipVersion = isIP(host);
  if (!ipVersion) return false;

  if (ipVersion === 4) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  // IPv6: unique local, link-local, loopback
  const normalized = host.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function allowedMediaHosts(): string[] {
  const hosts: string[] = ["res.cloudinary.com", "gearnetapp.com", "www.gearnetapp.com"];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const host = new URL(supabaseUrl).hostname;
      hosts.push(host);
    }
  } catch {
    // ignore
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName) {
    hosts.push("res.cloudinary.com");
  }
  return hosts;
}

/** True if URL is https and host is an allowlisted media CDN (or our site). */
export function isAllowedMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    if (isPrivateHostnameOrIp(parsed.hostname)) return false;

    const host = parsed.hostname.toLowerCase();
    const allowed = allowedMediaHosts();
    return allowed.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Fetch image bytes only from allowlisted hosts; blocks SSRF to private networks. */
export async function fetchAllowedImageBuffer(url: string): Promise<Buffer | null> {
  if (!isAllowedMediaUrl(url)) return null;
  try {
    const res = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "image/*,*/*;q=0.8" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 12 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}
