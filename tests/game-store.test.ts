import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { nightShiftCase } from "@/src/content/case";

type StoreModule = typeof import("@/src/stores/game-store");
let storeModule: StoreModule;

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
  storeModule = await import("@/src/stores/game-store");
});

beforeEach(() => {
  memoryStorage.clear();
  storeModule.useGameStore.getState().reset();
});

describe("Night Shift game store", () => {
  it("completes the deterministic five-night loop", () => {
    storeModule.useGameStore.getState().begin();

    for (const chapter of nightShiftCase.chapters) {
      let state = storeModule.useGameStore.getState();
      expect(state.chapter).toBe(chapter.number);
      const chosenDirection = chapter.choices[(chapter.number - 1) % chapter.choices.length].id;
      state.selectChoice(chosenDirection);
      state = storeModule.useGameStore.getState();
      state.startNight("restful", "side-lamp", "demo");
      storeModule.useGameStore.getState().finishNight();
      state = storeModule.useGameStore.getState();
      expect(state.phase).toBe("morning");
      expect(state.completedReports).toContain(chapter.number);
      expect(state.nightSealIds).toContain(chapter.number);
      expect(state.preparationHistory[chapter.number]).toBe("side-lamp");
      expect(state.choiceHistory[chapter.number]).toBe(chosenDirection);
      state.continueDay();
    }

    const completed = storeModule.useGameStore.getState();
    expect(completed.phase).toBe("ending");
    expect(completed.completedReports).toHaveLength(5);
    expect(completed.nightSealIds).toHaveLength(5);
    expect(completed.unlockedClueIds).toHaveLength(12);
  });

  it("persists and rehydrates an active real night", async () => {
    const state = storeModule.useGameStore.getState();
    state.begin();
    storeModule.useGameStore.getState().selectChoice("source");
    storeModule.useGameStore.getState().startNight("regular", "side-lamp", "real");
    const activeId = storeModule.useGameStore.getState().activeSleepSession?.id;
    const saved = memoryStorage.getItem("night-shift-save-v1");

    expect(saved).toContain(activeId);
    storeModule.useGameStore.getState().reset();
    memoryStorage.setItem("night-shift-save-v1", saved!);
    await storeModule.useGameStore.persist.rehydrate();

    const restored = storeModule.useGameStore.getState();
    expect(restored.phase).toBe("night");
    expect(restored.sleepMode).toBe("real");
    expect(restored.selectedChoice).toBe("source");
    expect(restored.activeSleepSession?.id).toBe(activeId);
  });

  it("migrates legacy saves with session defaults", () => {
    const migrated = storeModule.migrateGameState({
      started: true,
      chapter: 2,
      phase: "night",
      quality: "regular",
      unlockedClueIds: ["ticket-date"],
    });

    expect(migrated.sleepMode).toBe("demo");
    expect(migrated.activeSleepSession).toBeNull();
    expect(migrated.lastSleepSession).toBeNull();
    expect(migrated.preparationHistory).toEqual({});
    expect(migrated.choiceHistory).toEqual({});
    expect(migrated.nightSealIds).toEqual([]);
    expect(migrated.selectedPreparationId).toBe("");
  });

  it("restores prior reports and postcard preparations for demo chapter jumps", () => {
    storeModule.useGameStore.getState().jumpToChapter(4);
    const state = storeModule.useGameStore.getState();

    expect(state.completedReports).toEqual([1, 2, 3]);
    expect(state.nightSealIds).toEqual([1, 2, 3]);
    expect(state.preparationHistory).toEqual({ 1: "side-lamp", 2: "side-lamp", 3: "side-lamp" });
    expect(state.choiceHistory).toEqual({ 1: "source", 2: "mina", 3: "hotel" });
  });

  it("supports all three endings and protects the true ending gate", () => {
    storeModule.useGameStore.getState().chooseEnding("public");
    expect(storeModule.useGameStore.getState().endingId).toBe("public");

    storeModule.useGameStore.getState().reset();
    storeModule.useGameStore.getState().chooseEnding("protect");
    expect(storeModule.useGameStore.getState().endingId).toBe("protect");

    storeModule.useGameStore.getState().reset();
    storeModule.useGameStore.getState().chooseEnding("return");
    expect(storeModule.useGameStore.getState().endingId).toBeUndefined();

    storeModule.useGameStore.getState().jumpToChapter(5);
    storeModule.useGameStore.getState().unlockBoard(true);
    storeModule.useGameStore.getState().chooseEnding("return");
    expect(storeModule.useGameStore.getState().endingId).toBe("return");
  });
});
