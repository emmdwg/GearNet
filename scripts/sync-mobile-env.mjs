/**
 * Sync EXPO_PUBLIC_* vars from project root .env into mobile/.env.
 * Auto-detects the PC LAN IP and sets EXPO_PUBLIC_API_URL for physical devices.
 * Set GEARNET_MOBILE_API=prod in root .env to point Expo at https://gearnetapp.com.
 *
 * Usage: node scripts/sync-mobile-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootEnvPath = join(root, ".env");
const mobileEnvPath = join(root, "mobile", ".env");

function detectLanIp() {
  const nets = networkInterfaces();
  const candidates = [];

  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      const { address } = net;
      if (address.startsWith("192.168.") || address.startsWith("10.") || address.startsWith("172.")) {
        candidates.push(address);
      }
    }
  }

  return (
    candidates.find((ip) => ip.startsWith("192.168.")) ??
    candidates.find((ip) => ip.startsWith("10.")) ??
    candidates[0] ??
    null
  );
}

function upsertEnvLine(lines, key, value) {
  const line = `${key}=${value}`;
  const index = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
  if (index >= 0) {
    lines[index] = line;
  } else {
    lines.push(line);
  }
}

function readEnvFlag(lines, key) {
  const row = lines.find((l) => l.trim().startsWith(`${key}=`));
  if (!row) return null;
  return row.slice(row.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

if (!existsSync(rootEnvPath)) {
  console.error("Missing root .env");
  process.exit(1);
}

let rootLines = readFileSync(rootEnvPath, "utf8").split(/\r?\n/);
const useProd =
  process.env.GEARNET_MOBILE_API === "prod" || readEnvFlag(rootLines, "GEARNET_MOBILE_API") === "prod";

if (useProd) {
  upsertEnvLine(rootLines, "EXPO_PUBLIC_API_URL", "https://gearnetapp.com");
  writeFileSync(rootEnvPath, rootLines.join("\n").replace(/\n*$/, "\n"), "utf8");
  console.log("EXPO_PUBLIC_API_URL → https://gearnetapp.com (prod)");
} else {
  const lanIp = detectLanIp();
  if (lanIp) {
    const apiUrl = `http://${lanIp}:3000`;
    upsertEnvLine(rootLines, "EXPO_PUBLIC_API_URL", apiUrl);
    writeFileSync(rootEnvPath, rootLines.join("\n").replace(/\n*$/, "\n"), "utf8");
    console.log(`EXPO_PUBLIC_API_URL → ${apiUrl}`);
  } else {
    console.warn("Could not detect LAN IP — keeping existing EXPO_PUBLIC_API_URL");
  }
}

rootLines = readFileSync(rootEnvPath, "utf8").split(/\r?\n/);
const expoLines = rootLines.filter((line) => line.trim().startsWith("EXPO_PUBLIC_"));

if (expoLines.length === 0) {
  console.error("No EXPO_PUBLIC_* vars in root .env");
  process.exit(1);
}

const header = "# Auto-synced from project root .env — restart Expo after changes\n";
writeFileSync(mobileEnvPath, header + expoLines.join("\n") + "\n", "utf8");
console.log(`Wrote ${expoLines.length} vars to mobile/.env`);
