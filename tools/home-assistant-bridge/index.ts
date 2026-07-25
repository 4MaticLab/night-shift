import { randomInt } from "node:crypto";
import { AmbientController } from "./ambient-controller";
import { discoverHomeAssistantInstances } from "./discovery";
import { HomeAssistantClient } from "./home-assistant-client";
import { createBridgeServer } from "./server";

const token = process.env.HA_TOKEN?.trim();
const configuredUrl = process.env.HA_URL?.trim();
const port = Number(process.env.NIGHT_SHIFT_BRIDGE_PORT) || 43_117;
const configuredPairCode = process.env.NIGHT_SHIFT_PAIR_CODE?.trim();
if (configuredPairCode && !/^\d{6}$/.test(configuredPairCode)) {
  throw new Error("NIGHT_SHIFT_PAIR_CODE must contain exactly six digits.");
}
const pairCode = configuredPairCode || randomInt(100_000, 1_000_000).toString();
const allowedOrigins = (process.env.NIGHT_SHIFT_ALLOWED_ORIGINS
  || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const discovered = !configuredUrl && token
  ? await discoverHomeAssistantInstances(2_000)
  : [];
const homeAssistantUrl = configuredUrl || discovered[0]?.url;
const client = homeAssistantUrl && token
  ? new HomeAssistantClient(homeAssistantUrl, token)
  : undefined;
const controller = client ? new AmbientController(client) : undefined;

const bridge = createBridgeServer({
  client,
  controller,
  pairCode,
  allowedOrigins,
});
const address = await bridge.start(port);

process.stdout.write([
  "Night Shift Home Assistant bridge",
  `Listening: http://localhost:${address.port} (${address.host})`,
  `Pairing code: ${bridge.pairCode}`,
  homeAssistantUrl
    ? `Home Assistant: ${homeAssistantUrl}`
    : "Home Assistant: disabled — set HA_URL and HA_TOKEN, or set HA_TOKEN for mDNS discovery.",
  `Allowed origins: ${allowedOrigins.join(", ")}`,
  "",
].join("\n"));

if (client) {
  void client.connect().catch((error: unknown) => {
    process.stderr.write(`Home Assistant connection failed: ${error instanceof Error ? error.message : String(error)}\n`);
  });
}

const shutdown = async () => {
  await bridge.stop();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
