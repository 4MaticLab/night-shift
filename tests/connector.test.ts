import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConnectorRuntime, ConnectorStatus } from "@/apps/connector/runtime";
import {
  ConnectorRuntime as Runtime,
  normalizeHttpUrl,
} from "@/apps/connector/runtime";
import {
  createSettingsServer,
  type SettingsServer,
} from "@/apps/connector/settings-server";
import type { HomeAssistantClient } from "@/tools/home-assistant-bridge/home-assistant-client";

const settingsServers: SettingsServer[] = [];
const runtimes: Runtime[] = [];

afterEach(async () => {
  await Promise.all(settingsServers.splice(0).map((server) => server.stop()));
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.stop()));
});

describe("Connector runtime", () => {
  it("validates URLs and never exposes the Home Assistant token", async () => {
    let capturedToken = "";
    const runtime = new Runtime({
      bridgePort: 0,
      pairCode: "246810",
      appUrl: "https://night-shift-zeta.vercel.app",
      clientFactory: (url, token) => {
        capturedToken = token;
        return fakeClient(url);
      },
    });
    runtimes.push(runtime);
    await runtime.start();
    const status = await runtime.configure({
      homeAssistantUrl: "http://homeassistant.local:8123/",
      token: "secret-local-token",
      appUrl: "https://preview.example/",
    });

    expect(capturedToken).toBe("secret-local-token");
    expect(status).toMatchObject({
      pairCode: "246810",
      appUrl: "https://preview.example",
      homeAssistantUrl: "http://homeassistant.local:8123",
      homeAssistant: "online",
      entityCount: 1,
    });
    expect(JSON.stringify(status)).not.toContain("secret-local-token");

    const pair = await fetch(`${status.bridgeUrl}/v1/pair`, {
      method: "POST",
      headers: {
        Origin: "https://preview.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: "246810" }),
    });
    expect(pair.status).toBe(200);
    expect(JSON.stringify(await pair.json())).not.toContain("secret-local-token");
  });

  it("rejects non-HTTP and credential-bearing URLs", () => {
    expect(() => normalizeHttpUrl("homeassistant.local:8123")).toThrow("Only http:// and https://");
    expect(() => normalizeHttpUrl("ws://homeassistant.local")).toThrow("Only http:// and https://");
    expect(() => normalizeHttpUrl("http://user:pass@homeassistant.local")).toThrow("credentials");
  });
});

describe("Connector settings server", () => {
  it("serves the no-terminal setup page and protects state-changing routes by origin", async () => {
    const configure = vi.fn(async (): Promise<ConnectorStatus> => statusFixture);
    const runtime = {
      status: () => statusFixture,
      discover: vi.fn(async () => [{
        name: "Home",
        url: "http://homeassistant.local:8123",
      }]),
      configure,
      disconnect: vi.fn(async () => statusFixture),
    } as unknown as ConnectorRuntime;
    const openApp = vi.fn(async () => undefined);
    const server = createSettingsServer({ runtime, openApp });
    settingsServers.push(server);
    const address = await server.start(0);

    const page = await fetch(address.url);
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain("Night Shift Connector");
    expect(html).toContain("自动发现");
    expect(html).not.toContain("secret-local-token");

    const blocked = await fetch(`${address.url}/api/connect`, {
      method: "POST",
      headers: {
        Origin: "https://evil.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        homeAssistantUrl: "http://homeassistant.local:8123",
        token: "secret-local-token",
      }),
    });
    expect(blocked.status).toBe(403);
    expect(configure).not.toHaveBeenCalled();

    const connected = await fetch(`${address.url}/api/connect`, {
      method: "POST",
      headers: {
        Origin: address.url,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        homeAssistantUrl: "http://homeassistant.local:8123",
        token: "secret-local-token",
      }),
    });
    expect(connected.status).toBe(200);
    expect(configure).toHaveBeenCalledWith({
      homeAssistantUrl: "http://homeassistant.local:8123",
      token: "secret-local-token",
      appUrl: undefined,
    });
    expect(JSON.stringify(await connected.json())).not.toContain("secret-local-token");
  });
});

const statusFixture: ConnectorStatus = {
  bridgeUrl: "http://127.0.0.1:43117",
  pairCode: "246810",
  appUrl: "https://night-shift-zeta.vercel.app",
  homeAssistant: "disabled",
  entityCount: 0,
};

function fakeClient(baseUrl: string): HomeAssistantClient {
  return {
    baseUrl,
    status: "online",
    version: "2026.7.0",
    lastError: undefined,
    entities: new Map([["light.desk", {
      id: "light.desk",
      name: "Desk",
      domain: "light",
      state: "off",
      available: true,
      controllable: true,
      capabilities: ["turn-on", "turn-off"],
      attributes: {},
    }]]),
    connect: vi.fn(async () => undefined),
    close: vi.fn(),
    onStatus: vi.fn(() => () => undefined),
    onEntity: vi.fn(() => () => undefined),
  } as unknown as HomeAssistantClient;
}
