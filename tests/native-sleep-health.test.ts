import { describe, expect, it, vi } from "vitest";
import type { AuthorizationStatus } from "@capgo/capacitor-health";
import { finishSleepSession, startSleepSession } from "@/src/lib/game-engine/sleep-session";
import {
  authorizeNativeSleep,
  bridgeForCapacitorPlatform,
  getNativeSleepAvailability,
  normalizeNativeSleepSummary,
  readNativeSleepSummary,
  type NativeHealthGateway,
} from "@/src/lib/sleep-hardware/native-health";

function gateway(overrides: Partial<NativeHealthGateway> = {}): NativeHealthGateway {
  return {
    isAvailable: vi.fn(async () => ({ available: true, platform: "ios" as const })),
    requestAuthorization: vi.fn(async () => ({
      readAuthorized: ["sleep"],
      readDenied: [],
      writeAuthorized: [],
      writeDenied: [],
    } satisfies AuthorizationStatus)),
    readSamples: vi.fn(async () => ({ samples: [] })),
    ...overrides,
  };
}

describe("native system sleep bridge", () => {
  it("maps only installed native platforms to their system health store", async () => {
    expect(bridgeForCapacitorPlatform("ios")).toBe("apple-health");
    expect(bridgeForCapacitorPlatform("android")).toBe("health-connect");
    expect(bridgeForCapacitorPlatform("web")).toBeUndefined();

    await expect(getNativeSleepAvailability(gateway(), "web")).resolves.toEqual({
      native: false,
      available: false,
      reason: "web",
    });
    await expect(getNativeSleepAvailability(gateway(), "ios")).resolves.toMatchObject({
      native: true,
      available: true,
      bridgeId: "apple-health",
    });
  });

  it("requests read-only sleep access and treats Android denial as non-authorized", async () => {
    const iosGateway = gateway();
    await expect(authorizeNativeSleep("apple-health", iosGateway)).resolves.toBe(true);
    expect(iosGateway.requestAuthorization).toHaveBeenCalledWith({ read: ["sleep"], write: [] });

    const androidGateway = gateway({
      requestAuthorization: vi.fn(async () => ({
        readAuthorized: [],
        readDenied: ["sleep"],
        writeAuthorized: [],
        writeDenied: [],
      } satisfies AuthorizationStatus)),
    });
    await expect(authorizeNativeSleep("health-connect", androidGateway)).resolves.toBe(false);
  });

  it("merges overlapping stage records without double-counting the night", () => {
    const session = finishSleepSession(
      startSleepSession("real", "regular", new Date("2026-07-23T22:00:00.000Z")),
      new Date("2026-07-24T06:00:00.000Z"),
    );
    const summary = normalizeNativeSleepSummary(session, "apple-health", [
      {
        dataType: "sleep",
        value: 480,
        unit: "minute",
        startDate: "2026-07-23T22:00:00.000Z",
        endDate: "2026-07-24T06:00:00.000Z",
        sourceName: "Apple Watch",
        sleepState: "asleep",
        hasStageData: true,
        stages: [
          { startDate: "2026-07-23T22:00:00.000Z", endDate: "2026-07-24T00:00:00.000Z", stage: "light", durationMinutes: 120 },
          { startDate: "2026-07-24T00:00:00.000Z", endDate: "2026-07-24T01:30:00.000Z", stage: "deep", durationMinutes: 90 },
          { startDate: "2026-07-24T01:30:00.000Z", endDate: "2026-07-24T05:45:00.000Z", stage: "rem", durationMinutes: 255 },
          { startDate: "2026-07-24T05:45:00.000Z", endDate: "2026-07-24T06:00:00.000Z", stage: "awake", durationMinutes: 15 },
        ],
      },
    ]);

    expect(summary).toMatchObject({
      sourceId: "apple-health",
      sourceKind: "native",
      sourceName: "Apple Watch",
      durationMinutes: 465,
      deepSleepMinutes: 90,
      wakeEvents: 1,
      derivedQuality: "restful",
    });
    expect(summary).not.toHaveProperty("samples");
  });

  it("returns no summary for denied, delayed, or empty system sleep data", async () => {
    const session = finishSleepSession(
      startSleepSession("real", "regular", new Date("2026-07-23T22:00:00.000Z")),
      new Date("2026-07-24T06:00:00.000Z"),
    );
    await expect(readNativeSleepSummary(session, "health-connect", gateway())).resolves.toBeNull();
  });
});
