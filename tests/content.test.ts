import { describe, expect, it } from "vitest";
import { nightShiftCase } from "@/src/content/case";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import { preparations } from "@/src/content/preparations";
import { getAsset, getNightSealAsset } from "@/src/content/assets";
import {
  finishSleepSession,
  nightSealProgress,
  qualityFromDuration,
  startSleepSession,
} from "@/src/lib/game-engine/sleep-session";

describe("Night Shift case content", () => {
  it("contains the complete five-night mystery", () => {
    expect(nightShiftCase.chapters).toHaveLength(5);
    expect(nightShiftCase.clues).toHaveLength(12);
    expect(nightShiftCase.collectibles).toHaveLength(8);
  });

  it("always advances the main story without punishing short sleep", () => {
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      expect(resolveNight(chapter, "interrupted").clueIds.length).toBeGreaterThan(0);
      expect(resolveNight(chapter, "regular").clueIds.length).toBeGreaterThan(0);
      expect(resolveNight(chapter, "restful").clueIds.length).toBeGreaterThan(0);
    }
  });

  it("gives restful nights a route at least as rich as interrupted nights", () => {
    expect(resolveNight(1, "restful").route.length).toBeGreaterThanOrEqual(resolveNight(1, "interrupted").route.length);
    expect(resolveNight(1, "restful").observation).toBeTruthy();
    expect(resolveNight(1, "interrupted").echo).toBeTruthy();
  });

  it("lets preparation change atmosphere without changing fixed clues", () => {
    const results = preparations.map((item) => resolveNight(1, "regular", item.id));
    expect(new Set(results.map((result) => result.preparationEcho)).size).toBe(3);
    expect(results.map((result) => result.clueIds)).toEqual([
      results[0].clueIds,
      results[0].clueIds,
      results[0].clueIds,
    ]);
  });

  it("resolves every collectible and night seal through the asset manifest", () => {
    for (const collectible of nightShiftCase.collectibles) {
      expect(getAsset(collectible.assetId).category).toBe("collectible");
    }
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      expect(getNightSealAsset(chapter).category).toBe("night-seal");
    }
  });

  it("derives real-night quality from explicit duration boundaries", () => {
    expect(qualityFromDuration(299)).toBe("interrupted");
    expect(qualityFromDuration(300)).toBe("regular");
    expect(qualityFromDuration(419)).toBe("regular");
    expect(qualityFromDuration(420)).toBe("restful");
  });

  it("settles a real night from its persisted start time", () => {
    const startedAt = new Date("2026-07-22T22:00:00.000Z");
    const session = startSleepSession("real", "regular", startedAt);
    const completed = finishSleepSession(session, new Date("2026-07-23T04:30:00.000Z"));

    expect(completed.durationMinutes).toBe(390);
    expect(completed.quality).toBe("regular");
    expect(completed.endedAt).toBe("2026-07-23T04:30:00.000Z");
    expect(resolveNight(1, completed.quality).clueIds.length).toBeGreaterThan(0);
  });

  it("keeps demo quality deterministic and compresses seal progress", () => {
    const session = startSleepSession("demo", "restful", new Date("2026-07-22T22:00:00.000Z"));
    const completed = finishSleepSession(session, new Date("2026-07-22T22:00:12.000Z"));

    expect(completed.durationMinutes).toBe(484);
    expect(completed.quality).toBe("restful");
    expect(nightSealProgress(session, new Date("2026-07-22T22:00:01.000Z"))).toBe(3);
  });

  it("restores real-night seal progress from elapsed wall time", () => {
    const session = startSleepSession("real", "regular", new Date("2026-07-22T22:00:00.000Z"));

    expect(nightSealProgress(session, new Date("2026-07-23T02:00:00.000Z"))).toBe(50);
    expect(nightSealProgress(session, new Date("2026-07-23T08:00:00.000Z"))).toBe(100);
  });
});
