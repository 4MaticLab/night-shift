import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const bridgeMocks = vi.hoisted(() => ({
  pairAmbientBridge: vi.fn(),
  readAmbientBindings: vi.fn(),
  readAmbientBridgeStatus: vi.fn(),
  readAmbientEntities: vi.fn(),
  restoreAmbientScene: vi.fn(),
  sendAmbientCue: vi.fn(),
  testAmbientEntity: vi.fn(),
  writeAmbientBindings: vi.fn(),
}));

vi.mock("@/src/lib/ambient-hardware/bridge-client", () => bridgeMocks);

type AmbientModule = typeof import("@/src/stores/ambient-hardware-store");
let ambientModule: AmbientModule;

const values = new Map<string, string>();
const memoryStorage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => Array.from(values.keys())[index] ?? null,
  removeItem: (key) => { values.delete(key); },
  setItem: (key, value) => { values.set(key, value); },
};
const sessionValues = new Map<string, string>();
const memorySessionStorage: Storage = {
  get length() { return sessionValues.size; },
  clear: () => sessionValues.clear(),
  getItem: (key) => sessionValues.get(key) ?? null,
  key: (index) => Array.from(sessionValues.keys())[index] ?? null,
  removeItem: (key) => { sessionValues.delete(key); },
  setItem: (key, value) => { sessionValues.set(key, value); },
};

const onlineStatus = {
  bridge: "night-shift-home-assistant" as const,
  version: "0.1.0",
  paired: true,
  homeAssistant: "online" as const,
  instanceName: "Home Assistant 2026.7.0",
  entityCount: 1,
};

const deskLamp = {
  id: "light.desk_lamp",
  name: "Desk Lamp",
  domain: "light" as const,
  state: "off",
  available: true,
  controllable: true,
  capabilities: ["turn-on", "turn-off", "brightness"] as const,
  attributes: {},
};

beforeAll(async () => {
  vi.stubGlobal("localStorage", memoryStorage);
  vi.stubGlobal("sessionStorage", memorySessionStorage);
  vi.stubGlobal("window", {
    localStorage: memoryStorage,
    sessionStorage: memorySessionStorage,
  });
  ambientModule = await import("@/src/stores/ambient-hardware-store");
});

beforeEach(() => {
  memoryStorage.clear();
  memorySessionStorage.clear();
  vi.clearAllMocks();
  ambientModule.useAmbientHardwareStore.getState().reset();
  bridgeMocks.readAmbientBridgeStatus.mockResolvedValue(onlineStatus);
  bridgeMocks.readAmbientEntities.mockResolvedValue([deskLamp]);
  bridgeMocks.readAmbientBindings.mockResolvedValue({});
  bridgeMocks.writeAmbientBindings.mockImplementation(async (bindings) => bindings);
  bridgeMocks.pairAmbientBridge.mockResolvedValue(undefined);
  bridgeMocks.sendAmbientCue.mockResolvedValue(undefined);
  bridgeMocks.testAmbientEntity.mockResolvedValue(undefined);
  bridgeMocks.restoreAmbientScene.mockResolvedValue({ restored: [], skipped: [] });
});

describe("ambient hardware store", () => {
  it("degrades to unavailable without changing gameplay state", async () => {
    bridgeMocks.readAmbientBridgeStatus.mockRejectedValue(new Error("bridge offline"));
    expect(await ambientModule.useAmbientHardwareStore.getState().checkBridge()).toBe(false);
    expect(ambientModule.useAmbientHardwareStore.getState()).toMatchObject({
      connection: "unavailable",
      enabled: false,
      entities: {},
      lastError: "bridge offline",
    });
  });

  it("pairs, loads only normalized entities and persists bindings without device state", async () => {
    expect(await ambientModule.useAmbientHardwareStore.getState().pair("654321")).toBe(true);
    expect(bridgeMocks.pairAmbientBridge).toHaveBeenCalledWith("654321");
    expect(ambientModule.useAmbientHardwareStore.getState()).toMatchObject({
      connection: "online",
      entities: { "light.desk_lamp": deskLamp },
    });

    expect(await ambientModule.useAmbientHardwareStore.getState().setBinding(
      "night.started",
      "light.desk_lamp",
    )).toBe(true);
    ambientModule.useAmbientHardwareStore.getState().setEnabled(true);
    const persisted = memoryStorage.getItem("night-shift-ambient-hardware-v1") ?? "";
    expect(persisted).toContain("light.desk_lamp");
    expect(persisted).not.toContain("Desk Lamp");
    expect(persisted).not.toContain("entityCount");
    expect(persisted).not.toContain("token");
  });

  it("sends a bound cue only when enabled and never throws into the game flow", async () => {
    await ambientModule.useAmbientHardwareStore.getState().checkBridge();
    await ambientModule.useAmbientHardwareStore.getState().setBinding(
      "night.started",
      "light.desk_lamp",
    );

    expect(await ambientModule.useAmbientHardwareStore.getState().emitCue(
      "night.started",
      "session-1:night.started",
    )).toBe(false);
    expect(bridgeMocks.sendAmbientCue).not.toHaveBeenCalled();

    ambientModule.useAmbientHardwareStore.getState().setEnabled(true);
    expect(await ambientModule.useAmbientHardwareStore.getState().emitCue(
      "night.started",
      "session-1:night.started",
    )).toBe(true);

    bridgeMocks.sendAmbientCue.mockRejectedValueOnce(new Error("HA disconnected"));
    await expect(ambientModule.useAmbientHardwareStore.getState().emitCue(
      "night.started",
      "session-2:night.started",
    )).resolves.toBe(false);
    expect(ambientModule.useAmbientHardwareStore.getState()).toMatchObject({
      connection: "offline",
      lastError: "HA disconnected",
    });
  });

  it("applies read-only state events without granting control", () => {
    ambientModule.useAmbientHardwareStore.getState().applyBridgeEvent({
      type: "entity",
      entity: {
        id: "sensor.room_temperature",
        name: "Room Temperature",
        domain: "sensor",
        state: "21.5",
        available: true,
        controllable: false,
        capabilities: ["read"],
        attributes: { unit: "°C" },
      },
    });
    expect(ambientModule.useAmbientHardwareStore.getState().entities["sensor.room_temperature"])
      .toMatchObject({ controllable: false, state: "21.5" });
  });
});
