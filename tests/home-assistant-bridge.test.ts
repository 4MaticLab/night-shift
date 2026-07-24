import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebSocketServer, type WebSocket } from "ws";
import { AmbientController } from "@/tools/home-assistant-bridge/ambient-controller";
import { normalizeHomeAssistantState } from "@/tools/home-assistant-bridge/entity-normalizer";
import { HomeAssistantClient } from "@/tools/home-assistant-bridge/home-assistant-client";
import { createBridgeServer, type BridgeServer } from "@/tools/home-assistant-bridge/server";

interface MockHomeAssistant {
  url: string;
  calls: Array<Record<string, unknown>>;
  emitState: (state: Record<string, unknown>) => void;
  close: () => Promise<void>;
}

const openBridges: BridgeServer[] = [];
const openHomeAssistants: MockHomeAssistant[] = [];

afterEach(async () => {
  await Promise.all(openBridges.splice(0).map((bridge) => bridge.stop()));
  await Promise.all(openHomeAssistants.splice(0).map((homeAssistant) => homeAssistant.close()));
});

async function createMockHomeAssistant(options: { rejectToken?: boolean } = {}): Promise<MockHomeAssistant> {
  const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
  await once(server, "listening");
  const sockets = new Set<WebSocket>();
  const calls: Array<Record<string, unknown>> = [];

  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.send(JSON.stringify({ type: "auth_required", ha_version: "2026.7.0" }));
    socket.on("close", () => sockets.delete(socket));
    socket.on("message", (payload) => {
      const message = JSON.parse(payload.toString()) as Record<string, unknown>;
      if (message.type === "auth") {
        if (options.rejectToken || message.access_token !== "secret-ha-token") {
          socket.send(JSON.stringify({ type: "auth_invalid", message: "bad token" }));
        } else {
          socket.send(JSON.stringify({ type: "auth_ok", ha_version: "2026.7.0" }));
        }
        return;
      }

      const id = message.id;
      if (message.type === "get_states") {
        socket.send(JSON.stringify({
          id,
          type: "result",
          success: true,
          result: [
            {
              entity_id: "light.desk_lamp",
              state: "off",
              attributes: {
                friendly_name: "Desk Lamp",
                brightness: 12,
                rgb_color: [12, 34, 56],
                supported_color_modes: ["rgb"],
              },
            },
            {
              entity_id: "sensor.bedroom_temperature",
              state: "21.4",
              attributes: {
                friendly_name: "Bedroom Temperature",
                device_class: "temperature",
                unit_of_measurement: "°C",
              },
            },
            {
              entity_id: "lock.front_door",
              state: "locked",
              attributes: { friendly_name: "Front Door" },
            },
          ],
        }));
        return;
      }
      if (message.type === "subscribe_events") {
        socket.send(JSON.stringify({ id, type: "result", success: true, result: null }));
        return;
      }
      if (message.type === "call_service") {
        calls.push(message);
        socket.send(JSON.stringify({ id, type: "result", success: true, result: { response: null } }));
      }
    });
  });

  const address = server.address() as AddressInfo;
  const mock = {
    url: `http://127.0.0.1:${address.port}`,
    calls,
    emitState: (state: Record<string, unknown>) => {
      const message = JSON.stringify({
        id: 2,
        type: "event",
        event: {
          event_type: "state_changed",
          data: { entity_id: state.entity_id, new_state: state },
        },
      });
      for (const socket of sockets) socket.send(message);
    },
    close: () => new Promise<void>((resolve) => {
      for (const socket of sockets) socket.close();
      server.close(() => resolve());
    }),
  };
  openHomeAssistants.push(mock);
  return mock;
}

describe("Home Assistant entity boundary", () => {
  it("normalizes only supported ambient domains and strips unrelated attributes", () => {
    expect(normalizeHomeAssistantState({
      entity_id: "lock.front_door",
      state: "locked",
      attributes: { friendly_name: "Front Door" },
    })).toBeNull();

    expect(normalizeHomeAssistantState({
      entity_id: "light.desk_lamp",
      state: "on",
      attributes: {
        friendly_name: "Desk Lamp",
        brightness: 999,
        rgb_color: [10, 20, 30],
        supported_color_modes: ["rgb"],
        access_token: "must-not-pass",
      },
    })).toEqual({
      id: "light.desk_lamp",
      name: "Desk Lamp",
      domain: "light",
      state: "on",
      available: true,
      controllable: true,
      capabilities: ["turn-on", "turn-off", "brightness", "color"],
      attributes: {
        deviceClass: undefined,
        unit: undefined,
        brightness: 255,
        rgbColor: [10, 20, 30],
        percentage: undefined,
      },
    });
  });
});

describe("Home Assistant WebSocket client and cue controller", () => {
  it("authenticates, reads state, receives updates and executes cues idempotently", async () => {
    const homeAssistant = await createMockHomeAssistant();
    const client = new HomeAssistantClient(homeAssistant.url, "secret-ha-token", {
      reconnect: false,
      commandTimeoutMs: 1_000,
    });
    const entityListener = vi.fn();
    client.onEntity(entityListener);

    await client.connect();
    expect(client.status).toBe("online");
    expect(client.version).toBe("2026.7.0");
    expect([...client.entities]).toHaveLength(2);
    expect(client.entities.has("lock.front_door")).toBe(false);

    homeAssistant.emitState({
      entity_id: "light.desk_lamp",
      state: "on",
      attributes: {
        friendly_name: "Desk Lamp",
        brightness: 80,
        supported_color_modes: ["rgb"],
      },
    });
    await vi.waitFor(() => expect(client.entities.get("light.desk_lamp")?.state).toBe("on"));
    expect(entityListener).toHaveBeenCalled();

    const controller = new AmbientController(client);
    controller.setBindings({ "night.started": "light.desk_lamp" });
    expect(await controller.executeCue("session-001:night.started", "night.started")).toMatchObject({
      status: "executed",
      entityId: "light.desk_lamp",
    });
    expect(await controller.executeCue("session-001:night.started", "night.started")).toEqual({
      status: "duplicate",
    });
    expect(homeAssistant.calls).toHaveLength(1);
    expect(homeAssistant.calls[0]).toMatchObject({
      type: "call_service",
      domain: "light",
      service: "turn_on",
      target: { entity_id: "light.desk_lamp" },
    });
  });

  it("surfaces invalid Home Assistant credentials without reconnecting", async () => {
    const homeAssistant = await createMockHomeAssistant({ rejectToken: true });
    const client = new HomeAssistantClient(homeAssistant.url, "wrong-token", {
      reconnect: false,
      commandTimeoutMs: 500,
    });
    await expect(client.connect()).rejects.toThrow("bad token");
    expect(client.status).toBe("auth-error");
  });
});

describe("loopback bridge HTTP boundary", () => {
  it("requires an allowed origin and explicit pairing, then rejects unsafe bindings", async () => {
    const homeAssistant = await createMockHomeAssistant();
    const client = new HomeAssistantClient(homeAssistant.url, "secret-ha-token", {
      reconnect: false,
      commandTimeoutMs: 1_000,
    });
    await client.connect();
    const controller = new AmbientController(client);
    const bridge = createBridgeServer({
      client,
      controller,
      pairCode: "654321",
      allowedOrigins: ["http://localhost:3000"],
      discovery: async () => [{
        name: "Test Home",
        url: homeAssistant.url,
        version: "2026.7.0",
        uuid: "abc",
      }],
    });
    openBridges.push(bridge);
    const address = await bridge.start(0);
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const forbidden = await fetch(`${baseUrl}/v1/status`, {
      headers: { Origin: "https://evil.example" },
    });
    expect(forbidden.status).toBe(403);

    const unpaired = await fetch(`${baseUrl}/v1/entities`, {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(unpaired.status).toBe(401);

    const malformedPair = await fetch(`${baseUrl}/v1/pair`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: "{",
    });
    expect(malformedPair.status).toBe(400);

    const pair = await fetch(`${baseUrl}/v1/pair`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: "654321" }),
    });
    expect(pair.status).toBe(200);
    const cookie = pair.headers.get("set-cookie")?.split(";")[0];
    expect(cookie).toMatch(/^night_shift_ha_session=/);

    const status = await fetch(`${baseUrl}/v1/status`, {
      headers: {
        Origin: "http://localhost:3000",
        Cookie: cookie!,
      },
    });
    const statusBody = JSON.stringify(await status.json());
    expect(statusBody).not.toContain("secret-ha-token");
    expect(statusBody).toContain('"paired":true');

    const unsafeBinding = await fetch(`${baseUrl}/v1/bindings`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        Cookie: cookie!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bindings: { "night.started": "sensor.bedroom_temperature" } }),
    });
    expect(unsafeBinding.status).toBe(400);

    const safeBinding = await fetch(`${baseUrl}/v1/bindings`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        Cookie: cookie!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bindings: { "night.started": "light.desk_lamp" } }),
    });
    expect(safeBinding.status).toBe(200);

    const discovery = await fetch(`${baseUrl}/v1/discovery?timeout=100`, {
      headers: {
        Origin: "http://localhost:3000",
        Cookie: cookie!,
      },
    });
    expect(await discovery.json()).toEqual({
      instances: [{
        name: "Test Home",
        url: homeAssistant.url,
        version: "2026.7.0",
        uuid: "abc",
      }],
    });
  });
});
