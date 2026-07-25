import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getPoster, posterSeries } from "@/src/content/posters";

describe("five-day print posters", () => {
  it("defines one complete and distinct poster for each day", () => {
    expect(posterSeries).toHaveLength(5);
    expect(posterSeries.map((poster) => poster.day)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(posterSeries.map((poster) => poster.layout))).toHaveLength(5);
    expect(new Set(posterSeries.map((poster) => poster.qrContent))).toHaveLength(5);
    expect(new Set(posterSeries.map((poster) => poster.title))).toHaveLength(5);

    for (const poster of posterSeries) {
      expect(getPoster(poster.day)).toBe(poster);
      expect(poster.steps).toHaveLength(3);
      expect(poster.fragment.length).toBeGreaterThan(30);
      expect(poster.cta.length).toBeGreaterThan(5);
    }
  });

  it("only references existing reviewed artwork", () => {
    for (const poster of posterSeries) {
      for (const asset of [poster.primaryImage, poster.secondaryImage]) {
        expect(asset.startsWith("/art/")).toBe(true);
        expect(existsSync(join(process.cwd(), "public", asset))).toBe(true);
      }
    }
  });
});
