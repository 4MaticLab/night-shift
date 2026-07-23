export const NIGHT_SHIFT_SAVE_EPOCH = 2;
export const SAVE_EPOCH_STORAGE_KEY = "night-shift-save-epoch";

export const NIGHT_SHIFT_SAVE_KEYS = [
  "night-shift-world-v1",
  "night-shift-sandbox-v1",
  "night-shift-sleep-hardware-v1",
  "night-shift-save-v1",
] as const;

type SaveStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function resetIncompatibleSaves(
  storage: SaveStorage,
  epoch = NIGHT_SHIFT_SAVE_EPOCH,
): boolean {
  const expected = String(epoch);
  if (storage.getItem(SAVE_EPOCH_STORAGE_KEY) === expected) return false;

  for (const key of NIGHT_SHIFT_SAVE_KEYS) storage.removeItem(key);
  storage.setItem(SAVE_EPOCH_STORAGE_KEY, expected);
  return true;
}

export function ensureCurrentSaveEpoch(): void {
  if (typeof window === "undefined") return;
  resetIncompatibleSaves(window.localStorage);
}
