import { describe, expect, it } from "vitest";
import { nightShiftCase } from "@/src/content/case";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";

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
});

