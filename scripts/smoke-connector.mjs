import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const target = `${process.platform}-${process.arch}`;
const outputByTarget = {
  "darwin-arm64": path.join("artifacts", "connectors", "macos-arm64", "Night Shift Connector.app", "Contents", "MacOS", "Night Shift Connector"),
  "darwin-x64": path.join("artifacts", "connectors", "macos-x64", "Night Shift Connector.app", "Contents", "MacOS", "Night Shift Connector"),
  "windows-x64": path.join("artifacts", "connectors", "windows-x64", "Night-Shift-Connector.exe"),
  "linux-x64": path.join("artifacts", "connectors", "linux-x64", "Night-Shift-Connector"),
};
const executable = outputByTarget[target];
if (!executable) throw new Error(`Connector smoke is not configured for ${target}.`);

const temporary = await mkdtemp(path.join(os.tmpdir(), "night-shift-connector-"));
const readyFile = path.join(temporary, "ready.json");
const child = spawn(path.resolve(executable), [
  "--no-open",
  "--bridge-port", "0",
  "--settings-port", "0",
  "--ready-file", readyFile,
], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });

try {
  const ready = await waitForReady(readyFile);
  const [settingsResponse, settingsPageResponse, bridgeResponse] = await Promise.all([
    fetch(`${ready.settingsUrl}/api/status`),
    fetch(ready.settingsUrl),
    fetch(`${ready.bridgeUrl}/v1/status`),
  ]);
  if (!settingsResponse.ok || !settingsPageResponse.ok || !bridgeResponse.ok) {
    throw new Error(`Connector endpoints failed: settings=${settingsResponse.status}, page=${settingsPageResponse.status}, bridge=${bridgeResponse.status}`);
  }
  const settings = await settingsResponse.json();
  const settingsHtml = await settingsPageResponse.text();
  const bridge = await bridgeResponse.json();
  if (!/^\d{6}$/.test(settings.pairCode) || settings.pairCode !== ready.pairCode) {
    throw new Error("Connector did not expose one consistent six-digit pairing code.");
  }
  if (bridge.bridge !== "night-shift-home-assistant" || bridge.paired !== false) {
    throw new Error("Connector bridge status is invalid.");
  }
  if (!settingsHtml.includes("这个小程序只在你的电脑上连接 Home Assistant") || /\\u[0-9a-f]{4}/i.test(settingsHtml)) {
    throw new Error("Compiled Connector settings page did not preserve its human-readable copy.");
  }
  process.stdout.write(`Connector smoke passed: ${ready.settingsUrl} → ${ready.bridgeUrl}\n`);
} finally {
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
  await rm(temporary, { recursive: true, force: true });
}

async function waitForReady(filename) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Connector exited before it became ready.\n${output}`);
    }
    try {
      return JSON.parse(await readFile(filename, "utf8"));
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Connector did not become ready.\n${output}`);
}
