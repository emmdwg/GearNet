import { execSync } from "node:child_process";

const PORTS = [3000, 3001, 8081, 8082, 8083, 8084, 8085, 8086];

function getListeningPids(port) {
  try {
    const out = execSync(`netstat -ano | findstr ":${port}" | findstr LISTENING`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const match = line.trim().match(/\s(\d+)\s*$/);
      if (match) pids.add(match[1]);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function isNodeProcess(pid) {
  try {
    const out = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return out.toLowerCase().includes("node.exe");
  } catch {
    return false;
  }
}

let killed = 0;

for (const port of PORTS) {
  for (const pid of getListeningPids(port)) {
    if (!isNodeProcess(pid)) continue;
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Stopped node process ${pid} on port ${port}`);
      killed++;
    } catch {
      // already exited
    }
  }
}

console.log(killed ? `Freed ${killed} GearNet dev process(es).` : "No GearNet dev ports were in use.");
