import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { finishSleepSession, startSleepSession } from "@/src/lib/game-engine/sleep-session";
import { createSleepSignalSummary } from "@/src/lib/sleep-hardware/simulator";

type HardwareModule = typeof import("@/src/stores/sleep-hardware-store");
let hardwareModule: HardwareModule;

const values = new Map<string, string>();
const memoryStorage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => Array.from(values.keys())[index] ?? null,
  removeItem: (key) => { values.delete(key); },
  setItem: (key, value) => { values.set(key, value); },
};

beforeAll(async () => {
  vi.stubGlobal("localStorage", memoryStorage);
  vi.stubGlobal("window", { localStorage: memoryStorage });
  hardwareModule = await import("@/src/stores/sleep-hardware-store");
});

beforeEach(() => {
  memoryStorage.clear();
  hardwareModule.useSleepHardwareStore.getState().reset();
});

describe("sleep hardware bridge", () => {
  it("keeps gameplay available when no hardware is authorized", () => {
    const session = startSleepSession("demo", "regular", new Date("2026-07-23T22:00:00.000Z"));
    expect(hardwareModule.useSleepHardwareStore.getState().beginCapture(session)).toBe(false);
    expect(hardwareModule.useSleepHardwareStore.getState().activeCapture).toBeNull();
  });

  it("captures a local virtual ring summary and no raw timeline", () => {
    const store = hardwareModule.useSleepHardwareStore.getState();
    store.selectVirtualDevice("night-ring");
    expect(hardwareModule.useSleepHardwareStore.getState().grantConsent(["sleep-window", "heart-rate", "movement"])).toBe(true);
    const session = startSleepSession("demo", "restful", new Date("2026-07-23T22:00:00.000Z"));
    expect(hardwareModule.useSleepHardwareStore.getState().beginCapture(session)).toBe(true);
    const completed = finishSleepSession(session, new Date("2026-07-24T06:00:00.000Z"));
    const summary = hardwareModule.useSleepHardwareStore.getState().finishCapture(completed);

    expect(summary).toMatchObject({
      sessionId: session.id,
      sourceId: "night-ring",
      durationMinutes: 484,
      derivedQuality: "restful",
    });
    expect(summary?.averageHeartRate).toBeTypeOf("number");
    expect(summary?.restlessnessIndex).toBeTypeOf("number");
    expect(summary?.respirationRate).toBeUndefined();
    expect(summary).not.toHaveProperty("samples");
    expect(hardwareModule.useSleepHardwareStore.getState().history[session.id]).toEqual(summary);
    expect(hardwareModule.useSleepHardwareStore.getState().activeCapture).toBeNull();
  });

  it("generates deterministic device-aware summaries", () => {
    const session = finishSleepSession(
      startSleepSession("demo", "regular", new Date("2026-07-23T22:00:00.000Z")),
      new Date("2026-07-24T06:00:00.000Z"),
    );
    const capture = {
      sessionId: session.id,
      sourceId: "under-mattress" as const,
      startedAt: session.startedAt,
      quality: session.quality,
      permissions: ["sleep-window", "movement", "respiration"] as const,
    };
    const first = createSleepSignalSummary({ ...capture, permissions: [...capture.permissions] }, session);
    const second = createSleepSignalSummary({ ...capture, permissions: [...capture.permissions] }, session);

    expect(first).toEqual(second);
    expect(first.averageHeartRate).toBeUndefined();
    expect(first.deepSleepMinutes).toBeUndefined();
    expect(first.respirationRate).toBeTypeOf("number");
    expect(first.restlessnessIndex).toBeTypeOf("number");
  });

  it("never presents a bridge preview as an active capture", () => {
    const store = hardwareModule.useSleepHardwareStore.getState();
    store.selectBridge("oura-cloud");
    expect(hardwareModule.useSleepHardwareStore.getState().grantConsent(["sleep-window"])).toBe(false);
    const session = startSleepSession("real", "regular", new Date("2026-07-23T22:00:00.000Z"));
    expect(hardwareModule.useSleepHardwareStore.getState().beginCapture(session)).toBe(false);
    expect(hardwareModule.useSleepHardwareStore.getState()).toMatchObject({
      mode: "bridge",
      selectedBridgeId: "oura-cloud",
      consent: null,
      activeCapture: null,
    });
  });

  it("revokes consent and stops an active virtual capture without touching the game session", () => {
    const store = hardwareModule.useSleepHardwareStore.getState();
    store.selectVirtualDevice("quiet-pillow");
    store.grantConsent(["sleep-window", "movement"]);
    const session = startSleepSession("real", "regular", new Date("2026-07-23T22:00:00.000Z"));
    expect(hardwareModule.useSleepHardwareStore.getState().beginCapture(session)).toBe(true);
    hardwareModule.useSleepHardwareStore.getState().revokeConsent();

    expect(hardwareModule.useSleepHardwareStore.getState()).toMatchObject({
      mode: "off",
      consent: null,
      activeCapture: null,
    });
    expect(session.endedAt).toBeUndefined();
  });
});

