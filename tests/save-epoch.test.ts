import { describe, expect, it } from "vitest";
import {
  NIGHT_SHIFT_SAVE_EPOCH,
  NIGHT_SHIFT_SAVE_KEYS,
  SAVE_EPOCH_STORAGE_KEY,
  resetIncompatibleSaves,
} from "@/src/stores/save-epoch";

function createStorage(entries: Record<string, string>) {
  const values = new Map(Object.entries(entries));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("save epoch", () => {
  it("clears only Night Shift save stores when the epoch is incompatible", () => {
    const storage = createStorage({
      [SAVE_EPOCH_STORAGE_KEY]: String(NIGHT_SHIFT_SAVE_EPOCH - 1),
      "night-shift-world-v1": "old-world",
      "night-shift-sandbox-v1": "old-storylines",
      "night-shift-sleep-hardware-v1": "old-hardware",
      "night-shift-save-v1": "old-five-night",
      "night-shift-locale": "en",
      "unrelated-site-data": "keep",
    });

    expect(resetIncompatibleSaves(storage)).toBe(true);
    for (const key of NIGHT_SHIFT_SAVE_KEYS) expect(storage.getItem(key)).toBeNull();
    expect(storage.getItem(SAVE_EPOCH_STORAGE_KEY)).toBe(String(NIGHT_SHIFT_SAVE_EPOCH));
    expect(storage.getItem("night-shift-locale")).toBe("en");
    expect(storage.getItem("unrelated-site-data")).toBe("keep");
  });

  it("leaves current saves untouched", () => {
    const storage = createStorage({
      [SAVE_EPOCH_STORAGE_KEY]: String(NIGHT_SHIFT_SAVE_EPOCH),
      "night-shift-sandbox-v1": "current",
    });

    expect(resetIncompatibleSaves(storage)).toBe(false);
    expect(storage.getItem("night-shift-sandbox-v1")).toBe("current");
  });
});
