import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { ConnectorRuntime, DEFAULT_APP_URL, DEFAULT_BRIDGE_PORT } from "./runtime";
import { createSettingsServer } from "./settings-server";

const args = parseArgs(process.argv.slice(2));
const runtime = new ConnectorRuntime({
  bridgePort: args.bridgePort,
  appUrl: args.appUrl,
  allowedOrigins: process.env.NIGHT_SHIFT_ALLOWED_ORIGINS?.split(",").map((value) => value.trim()),
});
const initialStatus = await runtime.start();
const settings = createSettingsServer({ runtime, openApp: openExternal });
const settingsAddress = await settings.start(args.settingsPort);

if (args.readyFile) {
  await writeFile(args.readyFile, JSON.stringify({
    settingsUrl: settingsAddress.url,
    bridgeUrl: initialStatus.bridgeUrl,
    pairCode: initialStatus.pairCode,
  }), { mode: 0o600 });
}

process.stdout.write([
  "Night Shift Connector",
  `Settings: ${settingsAddress.url}`,
  `Bridge: ${initialStatus.bridgeUrl}`,
  `Pairing code: ${initialStatus.pairCode}`,
  "",
].join("\n"));

if (!args.noOpen) await openExternal(settingsAddress.url);

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  await settings.stop();
  await runtime.stop();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

interface ConnectorArgs {
  bridgePort: number;
  settingsPort: number;
  appUrl: string;
  noOpen: boolean;
  readyFile?: string;
}

function parseArgs(values: string[]): ConnectorArgs {
  const valueFor = (name: string) => {
    const index = values.indexOf(name);
    return index >= 0 ? values[index + 1] : undefined;
  };
  return {
    bridgePort: numberArg(valueFor("--bridge-port"), DEFAULT_BRIDGE_PORT),
    settingsPort: numberArg(valueFor("--settings-port"), 43_118),
    appUrl: valueFor("--app-url") ?? process.env.NIGHT_SHIFT_APP_URL ?? DEFAULT_APP_URL,
    noOpen: values.includes("--no-open"),
    readyFile: valueFor("--ready-file"),
  };
}

function numberArg(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65_535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return parsed;
}

async function openExternal(url: string): Promise<void> {
  const command = process.platform === "darwin"
    ? { executable: "open", args: [url] }
    : process.platform === "win32"
      ? { executable: "cmd", args: ["/d", "/s", "/c", "start", "", url] }
      : { executable: "xdg-open", args: [url] };
  const child = spawn(command.executable, command.args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
