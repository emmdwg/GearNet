/**
 * Adds Resend email env vars to Vercel + local .env.local.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node scripts/setup-resend-vercel.mjs
 *
 * Get your API key at https://resend.com/api-keys
 * For testing, use onboarding@resend.dev as the from address until your domain is verified.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiKey = process.env.RESEND_API_KEY?.trim();
const emailFrom = process.env.EMAIL_FROM?.trim() || "GearNet <onboarding@resend.dev>";

if (!apiKey) {
  console.error("Missing RESEND_API_KEY. Create one at https://resend.com/api-keys then run:");
  console.error("  RESEND_API_KEY=re_xxx node scripts/setup-resend-vercel.mjs");
  process.exit(1);
}

const entries = {
  RESEND_API_KEY: apiKey,
  EMAIL_FROM: emailFrom,
};

function upsertEnvLocal() {
  const envPath = join(root, ".env.local");
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

  for (const [key, value] of Object.entries(entries)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${JSON.stringify(value).slice(1, -1)}`;
    const plainLine = `${key}=${value.includes(" ") ? `"${value}"` : value}`;
    content = pattern.test(content) ? content.replace(pattern, plainLine) : `${content.trimEnd()}\n${plainLine}\n`;
  }

  writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`);
  console.log("Updated .env.local");
}

function addVercelEnv(name, value, environment) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--force"],
    { input: value, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], cwd: root, shell: true }
  );
  if (result.status !== 0) {
    console.warn(`Warning: could not set ${name} for ${environment}: ${result.stderr || result.stdout}`);
    return false;
  }
  console.log(`Set ${name} (${environment})`);
  return true;
}

console.log("Linking Vercel project if needed...");
spawnSync("npx", ["vercel", "link", "--project", "gearnet", "--yes"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

upsertEnvLocal();

const environments = ["production", "preview", "development"];
for (const env of environments) {
  for (const [name, value] of Object.entries(entries)) {
    addVercelEnv(name, value, env);
  }
}

console.log("\nDone. Redeploy Vercel for email notifications to take effect.");
console.log(`From address: ${emailFrom}`);
