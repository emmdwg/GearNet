/**
 * Generates VAPID keys and adds them to Vercel + local .env.local.
 * Run: node scripts/setup-vapid-vercel.mjs
 */
import webpush from "web-push";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const { generateVAPIDKeys } = webpush;

const root = process.cwd();
const keys = generateVAPIDKeys();
const subject = "mailto:support@gearnet.app";

const entries = {
  VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_SUBJECT: subject,
};

function upsertEnvLocal() {
  const envPath = join(root, ".env.local");
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

  for (const [key, value] of Object.entries(entries)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    content = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
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

console.log("\nDone. Redeploy Vercel for web push to take effect.");
console.log("Public key (safe to share):", keys.publicKey);
