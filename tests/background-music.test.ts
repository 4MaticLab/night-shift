import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BGM_PREFERENCE_KEY,
  BGM_SOURCE,
  BGM_VOLUME,
  readMusicPreference,
} from "@/src/components/background-music";

describe("global background music contract", () => {
  it("uses the replaceable C minor nocturne asset at a restrained volume", () => {
    expect(BGM_SOURCE).toBe("/audio/c-minor-nocturne.mp3");
    expect(BGM_VOLUME).toBeGreaterThan(0);
    expect(BGM_VOLUME).toBeLessThanOrEqual(.25);
    const assetPath = join(process.cwd(), "public", BGM_SOURCE);
    expect(existsSync(assetPath)).toBe(true);
    expect(statSync(assetPath).size).toBeGreaterThan(100_000);
  });

  it("defaults new visitors to enabled and only disables on an explicit false preference", () => {
    const storage = (value: string | null) => ({ getItem: (key: string) => {
      expect(key).toBe(BGM_PREFERENCE_KEY);
      return value;
    } });
    expect(readMusicPreference(storage(null))).toBe(true);
    expect(readMusicPreference(storage("true"))).toBe(true);
    expect(readMusicPreference(storage("false"))).toBe(false);
  });
});
