import { randomInt } from "node:crypto";
import { AmbientController } from "../../tools/home-assistant-bridge/ambient-controller";
import {
  discoverHomeAssistantInstances,
  type DiscoveredHomeAssistant,
} from "../../tools/home-assistant-bridge/discovery";
import { HomeAssistantClient } from "../../tools/home-assistant-bridge/home-assistant-client";
import {
  createBridgeServer,
  type BridgeServer,
} from "../../tools/home-assistant-bridge/server";

export const DEFAULT_APP_URL = "https://night-shift-zeta.vercel.app";
export const DEFAULT_BRIDGE_PORT = 43_117;

export interface ConnectorStatus {
  bridgeUrl: string;
  pairCode: string;
  appUrl: string;
  homeAssistantUrl?: string;
  homeAssistant: "disabled" | "connecting" | "online" | "offline" | "auth-error";
  entityCount: number;
  version?: string;
  lastError?: string;
}

interface ConnectorRuntimeOptions {
  bridgePort?: number;
  pairCode?: string;
  appUrl?: string;
  allowedOrigins?: string[];
  discovery?: typeof discoverHomeAssistantInstances;
  clientFactory?: (url: string, token: string) => HomeAssistantClient;
}

export class ConnectorRuntime {
  private bridge: BridgeServer | null = null;
  private client: HomeAssistantClient | null = null;
  private bridgePort: number;
  private bridgeUrl = "";
  private appUrl: string;
  private allowedOrigins: string[];
  private homeAssistantUrl: string | undefined;
  private lastError: string | undefined;
  private readonly discovery: typeof discoverHomeAssistantInstances;
  private readonly clientFactory: (url: string, token: string) => HomeAssistantClient;
  readonly pairCode: string;

  constructor(options: ConnectorRuntimeOptions = {}) {
    this.bridgePort = options.bridgePort ?? DEFAULT_BRIDGE_PORT;
    this.pairCode = options.pairCode ?? randomInt(100_000, 1_000_000).toString();
    this.appUrl = normalizeHttpUrl(options.appUrl ?? DEFAULT_APP_URL);
    this.allowedOrigins = uniqueOrigins([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      this.appUrl,
      ...(options.allowedOrigins ?? []),
    ]);
    this.discovery = options.discovery ?? discoverHomeAssistantInstances;
    this.clientFactory = options.clientFactory
      ?? ((url, token) => new HomeAssistantClient(url, token));
  }

  async start(): Promise<ConnectorStatus> {
    await this.replaceBridge();
    return this.status();
  }

  async configure(input: {
    homeAssistantUrl: string;
    token: string;
    appUrl?: string;
  }): Promise<ConnectorStatus> {
    const homeAssistantUrl = normalizeHttpUrl(input.homeAssistantUrl);
    const token = input.token.trim();
    if (!token) throw new Error("Home Assistant token is required.");
    const appUrl = input.appUrl ? normalizeHttpUrl(input.appUrl) : this.appUrl;
    const candidate = this.clientFactory(homeAssistantUrl, token);

    try {
      await candidate.connect();
    } catch (error) {
      candidate.close();
      this.lastError = errorMessage(error);
      throw error;
    }

    this.appUrl = appUrl;
    this.allowedOrigins = uniqueOrigins([
      ...this.allowedOrigins,
      appUrl,
    ]);
    this.homeAssistantUrl = homeAssistantUrl;
    this.lastError = undefined;
    await this.replaceBridge(candidate);
    return this.status();
  }

  async disconnect(): Promise<ConnectorStatus> {
    this.homeAssistantUrl = undefined;
    this.lastError = undefined;
    await this.replaceBridge();
    return this.status();
  }

  async discover(timeoutMs = 2_000): Promise<DiscoveredHomeAssistant[]> {
    return this.discovery(timeoutMs);
  }

  status(): ConnectorStatus {
    return {
      bridgeUrl: this.bridgeUrl,
      pairCode: this.pairCode,
      appUrl: this.appUrl,
      homeAssistantUrl: this.homeAssistantUrl,
      homeAssistant: this.client?.status ?? "disabled",
      entityCount: this.client?.entities.size ?? 0,
      version: this.client?.version,
      lastError: this.client?.lastError ?? this.lastError,
    };
  }

  async stop(): Promise<void> {
    const bridge = this.bridge;
    this.bridge = null;
    this.client = null;
    if (bridge) await bridge.stop();
  }

  private async replaceBridge(client?: HomeAssistantClient): Promise<void> {
    const previous = this.bridge;
    this.bridge = null;
    this.client = null;
    if (previous) await previous.stop();

    const controller = client ? new AmbientController(client) : undefined;
    const bridge = createBridgeServer({
      client,
      controller,
      pairCode: this.pairCode,
      allowedOrigins: this.allowedOrigins,
    });
    const address = await bridge.start(this.bridgePort);
    this.bridgePort = address.port;
    this.bridgeUrl = `http://127.0.0.1:${address.port}`;
    this.bridge = bridge;
    this.client = client ?? null;
  }
}

export function normalizeHttpUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("URL must include http:// or https://.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are supported.");
  }
  if (url.username || url.password) throw new Error("URL credentials are not allowed.");
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function uniqueOrigins(values: string[]): string[] {
  return [...new Set(values.map((value) => new URL(normalizeHttpUrl(value)).origin))];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
