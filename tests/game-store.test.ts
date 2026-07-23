import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { nightShiftCase } from "@/src/content/case";
import { getCorrespondencePrompt } from "@/src/content/correspondence";
import { DEMO_JOURNEY_SEED } from "@/src/content/souvenirs";
import { getOpportunityCandidates } from "@/src/content/opportunities";
import { DEFAULT_CAMPAIGN_ID, RAIN_RADIO_CAMPAIGN_ID } from "@/src/content/campaigns/registry";
import { rainRadioCampaign } from "@/src/content/campaigns/rain-radio";

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
  storeModule.useGameStore.getState().switchCampaign(DEFAULT_CAMPAIGN_ID);
  storeModule.useGameStore.setState({ campaignSaves: {} });
  storeModule.useGameStore.getState().reset();
});

describe("Night Shift game store", () => {
  it("completes the deterministic five-night loop", () => {
    storeModule.useGameStore.getState().begin();

    for (const chapter of nightShiftCase.chapters) {
      let state = storeModule.useGameStore.getState();
      expect(state.chapter).toBe(chapter.number);
      if (chapter.number >= 2) {
        const notice = getOpportunityCandidates(chapter.number, state.journeySeed, state.opportunityHistory)[0];
        expect(state.resolveOpportunity(notice.id, notice.responses[0].id)).toBe(true);
        expect(storeModule.useGameStore.getState().resolveOpportunity(notice.id, notice.responses[1].id)).toBe(false);
        state = storeModule.useGameStore.getState();
      }
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
      expect(state.growthHistory[chapter.number]).toMatchObject({
        chapter: chapter.number,
        quality: "restful",
        choiceId: chosenDirection,
        preparationId: "side-lamp",
        watchId: "midnight",
      });
      expect(state.lastSleepSession?.watchId).toBe("midnight");
      expect(state.lastSleepSession?.wakeEcho).toBeUndefined();
      expect(state.growthHistory[chapter.number]?.wakeEchoId).toBeUndefined();
      expect(state.societyHistory[chapter.number]).toMatchObject({
        chapter: chapter.number,
        choiceId: chosenDirection,
      });
      expect(state.journeySeed).toBe(DEMO_JOURNEY_SEED);
      expect(state.souvenirHistory[chapter.number]).toMatchObject({
        chapter: chapter.number,
        choiceId: chosenDirection,
        preparationId: "side-lamp",
        journeySeed: DEMO_JOURNEY_SEED,
      });
      const prompt = getCorrespondencePrompt(state.societyHistory[chapter.number]!);
      expect(state.answerCorrespondence(chapter.number, prompt.replies[0].id)).toBe(true);
      expect(storeModule.useGameStore.getState().answerCorrespondence(chapter.number, prompt.replies[1].id)).toBe(false);
      expect(storeModule.useGameStore.getState().correspondenceHistory[chapter.number]).toMatchObject({
        chapter: chapter.number,
        promptId: prompt.id,
        replyId: prompt.replies[0].id,
      });
      state.continueDay();
    }

    const completed = storeModule.useGameStore.getState();
    expect(completed.phase).toBe("ending");
    expect(completed.completedReports).toHaveLength(5);
    expect(completed.nightSealIds).toHaveLength(5);
    expect(Object.keys(completed.societyHistory)).toHaveLength(5);
    expect(Object.keys(completed.correspondenceHistory)).toHaveLength(5);
    expect(Object.keys(completed.souvenirHistory)).toHaveLength(5);
    expect(Object.keys(completed.opportunityHistory)).toHaveLength(4);
    expect(new Set(Object.values(completed.souvenirHistory).map((record) => record?.souvenirId))).toHaveLength(5);
    expect(completed.unlockedClueIds).toHaveLength(12);
  });

  it("completes the second campaign and reaches its own ending", () => {
    expect(storeModule.useGameStore.getState().switchCampaign(RAIN_RADIO_CAMPAIGN_ID)).toBe(true);
    storeModule.useGameStore.getState().begin();

    for (const chapter of rainRadioCampaign.case.chapters) {
      const state = storeModule.useGameStore.getState();
      state.selectChoice(chapter.choices[0].id);
      storeModule.useGameStore.getState().startNight("restful", "side-lamp", "demo");
      storeModule.useGameStore.getState().finishNight();
      storeModule.useGameStore.getState().continueDay();
    }

    const completed = storeModule.useGameStore.getState();
    expect(completed.campaignId).toBe(RAIN_RADIO_CAMPAIGN_ID);
    expect(completed.phase).toBe("ending");
    expect(completed.completedReports).toHaveLength(rainRadioCampaign.case.chapters.length);
    expect(completed.unlockedClueIds).toEqual(rainRadioCampaign.case.clues.map((clue) => clue.id));
    completed.chooseEnding("protect");
    expect(storeModule.useGameStore.getState().endingId).toBe("protect");
  });

  it("keeps progress and received clues isolated while switching campaigns", () => {
    const first = storeModule.useGameStore.getState();
    first.begin();
    first.receiveSharedClue("flower-cycle");
    expect(first.switchCampaign(RAIN_RADIO_CAMPAIGN_ID)).toBe(true);

    const second = storeModule.useGameStore.getState();
    expect(second.started).toBe(false);
    expect(second.unlockedClueIds).toEqual([]);
    expect(second.receiveSharedClue("radio-warm-dial")).toBe("received");
    expect(second.receiveSharedClue("flower-cycle")).toBe("invalid");
    expect(second.switchCampaign(DEFAULT_CAMPAIGN_ID)).toBe(true);

    const restoredFirst = storeModule.useGameStore.getState();
    expect(restoredFirst.started).toBe(true);
    expect(restoredFirst.receivedClueIds).toEqual(["flower-cycle"]);
    expect(restoredFirst.unlockedClueIds).toEqual(["flower-cycle"]);
    expect(restoredFirst.switchCampaign(RAIN_RADIO_CAMPAIGN_ID)).toBe(true);
    expect(storeModule.useGameStore.getState().receivedClueIds).toEqual(["radio-warm-dial"]);
  });

  it("persists and rehydrates an active real night", async () => {
    const state = storeModule.useGameStore.getState();
    state.begin();
    storeModule.useGameStore.getState().selectChoice("source");
    storeModule.useGameStore.getState().startNight("regular", "side-lamp", "real");
    const activeId = storeModule.useGameStore.getState().activeSleepSession?.id;
    const journeySeed = storeModule.useGameStore.getState().journeySeed;
    expect(storeModule.useGameStore.getState().recordWakeEcho()).toBe(true);
    expect(storeModule.useGameStore.getState().recordWakeEcho()).toBe(false);
    const wakeEcho = storeModule.useGameStore.getState().activeSleepSession?.wakeEcho;
    const saved = memoryStorage.getItem("night-shift-save-v1");

    expect(saved).toContain(activeId);
    expect(journeySeed).not.toBe(0);
    expect(journeySeed).not.toBe(DEMO_JOURNEY_SEED);
    storeModule.useGameStore.getState().reset();
    memoryStorage.setItem("night-shift-save-v1", saved!);
    await storeModule.useGameStore.persist.rehydrate();

    const restored = storeModule.useGameStore.getState();
    expect(restored.phase).toBe("night");
    expect(restored.sleepMode).toBe("real");
    expect(restored.selectedChoice).toBe("source");
    expect(restored.activeSleepSession?.id).toBe(activeId);
    expect(restored.activeSleepSession?.watchId).toMatch(/lamplighting|midnight|last-watch|daylight/);
    expect(restored.activeSleepSession?.wakeEcho).toEqual(wakeEcho);
    expect(restored.journeySeed).toBe(journeySeed);
  });

  it("gives only interrupted Demo nights one deterministic sleep-gap echo", () => {
    const state = storeModule.useGameStore.getState();
    state.begin();
    state.selectChoice("source");
    storeModule.useGameStore.getState().startNight("interrupted", "side-lamp", "demo");
    expect(storeModule.useGameStore.getState().activeSleepSession?.wakeEcho?.echoId).toBe("sleep-gap-01");
    expect(storeModule.useGameStore.getState().recordWakeEcho()).toBe(false);
    storeModule.useGameStore.getState().finishNight();
    expect(storeModule.useGameStore.getState().growthHistory[1]?.wakeEchoId).toBe("sleep-gap-01");

    storeModule.useGameStore.getState().reset();
    storeModule.useGameStore.getState().begin();
    storeModule.useGameStore.getState().selectChoice("source");
    storeModule.useGameStore.getState().startNight("regular", "side-lamp", "demo");
    expect(storeModule.useGameStore.getState().activeSleepSession?.wakeEcho).toBeUndefined();
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
    expect(migrated.campaignId).toBe(DEFAULT_CAMPAIGN_ID);
    expect(migrated.campaignSaves).toEqual({});
    expect(migrated.activeSleepSession).toBeNull();
    expect(migrated.lastSleepSession).toBeNull();
    expect(migrated.preparationHistory).toEqual({});
    expect(migrated.choiceHistory).toEqual({});
    expect(migrated.growthHistory).toEqual({});
    expect(migrated.societyHistory).toEqual({});
    expect(migrated.correspondenceHistory).toEqual({});
    expect(migrated.journeySeed).toBe(DEMO_JOURNEY_SEED);
    expect(migrated.souvenirHistory).toEqual({});
    expect(migrated.opportunityHistory).toEqual({});
    expect(migrated.receivedClueIds).toEqual([]);
    expect(migrated.boardPositions).toEqual({});
    expect(migrated.nightSealIds).toEqual([]);
    expect(migrated.selectedPreparationId).toBe("");
  });

  it("migrates legacy sessions and greenhouse records to safe city watches", () => {
    const realStartedAt = new Date(2026, 6, 23, 3, 15);
    const migrated = storeModule.migrateGameState({
      activeSleepSession: {
        id: "legacy-real",
        mode: "real",
        quality: "regular",
        startedAt: realStartedAt.toISOString(),
      },
      lastSleepSession: {
        id: "legacy-demo",
        mode: "demo",
        quality: "regular",
        startedAt: "not-a-date",
      },
      growthHistory: {
        1: {
          chapter: 1,
          quality: "regular",
          durationMinutes: 390,
          choiceId: "source",
          preparationId: "side-lamp",
          completedAt: "2026-07-11T05:28:00.000Z",
        },
      },
    } as never);

    expect(migrated.activeSleepSession?.watchId).toBe("last-watch");
    expect(migrated.lastSleepSession?.watchId).toBe("midnight");
    expect(migrated.growthHistory[1]?.watchId).toBe("midnight");
    expect(migrated.activeSleepSession?.wakeEcho).toBeUndefined();
    expect(migrated.growthHistory[1]?.wakeEchoId).toBeUndefined();
  });

  it("filters cross-campaign data while migrating a campaign save", () => {
    const migrated = storeModule.migrateGameState({
      campaignId: RAIN_RADIO_CAMPAIGN_ID,
      completedReports: [1],
      unlockedClueIds: ["ticket-date", "radio-warm-dial"],
      receivedClueIds: ["postcard", "radio-warm-dial"],
      unlockedCollectibleIds: ["torn-ticket", "radio-dial"],
      confirmedRelations: ["mina-evelyn", rainRadioCampaign.relations[0].id],
      choiceHistory: { 1: "source" },
      boardPositions: {
        "ticket-date": { x: 100, y: 100 },
        "radio-warm-dial": { x: 200, y: 140 },
      },
      growthHistory: {
        1: {
          chapter: 1,
          quality: "regular",
          durationMinutes: 390,
          choiceId: "source",
          preparationId: "side-lamp",
          watchId: "midnight",
          completedAt: "2026-07-11T05:28:00.000Z",
        },
      },
    });

    expect(migrated.campaignId).toBe(RAIN_RADIO_CAMPAIGN_ID);
    expect(migrated.unlockedClueIds).toEqual(["radio-warm-dial"]);
    expect(migrated.receivedClueIds).toEqual(["radio-warm-dial"]);
    expect(migrated.unlockedCollectibleIds).toEqual(["radio-dial"]);
    expect(migrated.confirmedRelations).toEqual([rainRadioCampaign.relations[0].id]);
    expect(migrated.choiceHistory).toEqual({});
    expect(migrated.growthHistory[1]?.choiceId).toBe("dial");
    expect(migrated.boardPositions).toEqual({ "radio-warm-dial": { x: 200, y: 140 } });
  });

  it("persists valid evidence positions and can restore the default desk", () => {
    const state = storeModule.useGameStore.getState();
    expect(state.setBoardPosition("ticket-date", { x: 120, y: 90 })).toBe(false);

    state.unlockBoard();
    expect(storeModule.useGameStore.getState().setBoardPosition("ticket-date", { x: 418.5, y: 207 })).toBe(true);
    expect(storeModule.useGameStore.getState().setBoardPosition("ticket-date", { x: Number.POSITIVE_INFINITY, y: 0 })).toBe(false);
    expect(storeModule.useGameStore.getState().boardPositions).toEqual({ "ticket-date": { x: 418.5, y: 207 } });
    expect(memoryStorage.getItem("night-shift-save-v1")).toContain('"ticket-date"');

    storeModule.useGameStore.getState().resetBoardPositions();
    expect(storeModule.useGameStore.getState().boardPositions).toEqual({});
  });

  it("drops malformed board coordinates while migrating older saves", () => {
    const migrated = storeModule.migrateGameState({
      boardPositions: {
        "ticket-date": { x: 240, y: 160 },
        broken: { x: "left", y: null },
      },
    });

    expect(migrated.boardPositions).toEqual({ "ticket-date": { x: 240, y: 160 } });
  });

  it("receives one whitelisted friend clue without advancing the case", () => {
    const state = storeModule.useGameStore.getState();

    expect(state.receiveSharedClue("not-a-clue")).toBe("invalid");
    expect(state.receiveSharedClue("flower-cycle")).toBe("received");
    const received = storeModule.useGameStore.getState();
    expect(received.started).toBe(true);
    expect(received.chapter).toBe(1);
    expect(received.phase).toBe("day");
    expect(received.unlockedClueIds).toEqual(["flower-cycle"]);
    expect(received.receivedClueIds).toEqual(["flower-cycle"]);
    expect(received.completedReports).toEqual([]);
    expect(received.confirmedRelations).toEqual([]);
    expect(received.receiveSharedClue("flower-cycle")).toBe("already-received");

    const migrated = storeModule.migrateGameState({
      unlockedClueIds: [],
      receivedClueIds: ["postcard", "unknown", "postcard"],
    });
    expect(migrated.receivedClueIds).toEqual(["postcard"]);
    expect(migrated.unlockedClueIds).toEqual(["postcard"]);

    storeModule.useGameStore.getState().reset();
    expect(storeModule.useGameStore.getState().receiveSharedClue("ticket-date")).toBe("received");
    storeModule.useGameStore.getState().selectChoice("source");
    storeModule.useGameStore.getState().startNight("restful", "side-lamp", "demo");
    storeModule.useGameStore.getState().finishNight();
    const earned = storeModule.useGameStore.getState();
    expect(earned.receivedClueIds).toEqual([]);
    expect(earned.unlockedClueIds).toEqual(["ticket-date", "ticket-paper", "matchbox"]);
  });

  it("restores prior reports and postcard preparations for demo chapter jumps", () => {
    storeModule.useGameStore.getState().jumpToChapter(4);
    const state = storeModule.useGameStore.getState();

    expect(state.completedReports).toEqual([1, 2, 3]);
    expect(state.nightSealIds).toEqual([1, 2, 3]);
    expect(state.preparationHistory).toEqual({ 1: "side-lamp", 2: "side-lamp", 3: "side-lamp" });
    expect(state.choiceHistory).toEqual({ 1: "source", 2: "mina", 3: "hotel" });
    expect(Object.keys(state.growthHistory)).toEqual(["1", "2", "3"]);
    expect(Object.keys(state.societyHistory)).toEqual(["1", "2", "3"]);
    expect(Object.keys(state.correspondenceHistory)).toEqual(["1", "2", "3"]);
    expect(state.journeySeed).toBe(DEMO_JOURNEY_SEED);
    expect(Object.keys(state.souvenirHistory)).toEqual(["1", "2", "3"]);
    expect(new Set(Object.values(state.souvenirHistory).map((record) => record?.souvenirId))).toHaveLength(3);
    expect(Object.keys(state.opportunityHistory)).toEqual(["2", "3"]);
    expect(state.opportunityHistory[2]).toMatchObject({ chapter: 2, dismissed: false });
    expect(state.growthHistory[2]).toMatchObject({ chapter: 2, quality: "regular", durationMinutes: 390, choiceId: "mina", preparationId: "side-lamp", watchId: "midnight" });
    expect(state.societyHistory[3]).toMatchObject({ chapter: 3, choiceId: "hotel", societyId: "misfiled-registry", standing: "entrusted" });
    expect(state.correspondenceHistory[2]).toMatchObject({ chapter: 2, societyId: "misfiled-registry", standing: "known", replyId: "registry-known-witness" });
  });

  it("reconstructs complete greenhouse records for pre-v5 completed reports", () => {
    const migrated = storeModule.migrateGameState({
      completedReports: [1, 2],
      preparationHistory: { 1: "flower-note" },
      choiceHistory: { 1: "track" },
    });

    expect(migrated.growthHistory[1]).toMatchObject({ chapter: 1, choiceId: "track", preparationId: "flower-note", quality: "regular", watchId: "midnight" });
    expect(migrated.growthHistory[2]).toMatchObject({ chapter: 2, choiceId: "mina", preparationId: "side-lamp", quality: "regular" });
    expect(migrated.societyHistory[1]).toMatchObject({ chapter: 1, choiceId: "track", societyId: "afterlight-cartographers", standing: "noticed" });
    expect(migrated.societyHistory[2]).toMatchObject({ chapter: 2, choiceId: "mina", societyId: "misfiled-registry", standing: "noticed" });
    expect(migrated.correspondenceHistory).toEqual({});
    expect(Object.keys(migrated.souvenirHistory)).toEqual(["1", "2"]);
    expect(migrated.souvenirHistory[1]).toMatchObject({ chapter: 1, choiceId: "track", preparationId: "flower-note", journeySeed: DEMO_JOURNEY_SEED });
    expect(migrated.opportunityHistory).toEqual({});
  });

  it("lets an unanswered letter pass without changing fixed night rewards", () => {
    const state = storeModule.useGameStore.getState();
    state.begin();
    state.selectChoice("source");
    storeModule.useGameStore.getState().startNight("interrupted", "tram-fare", "demo");
    storeModule.useGameStore.getState().finishNight();
    const afterNight = storeModule.useGameStore.getState();
    const clueIds = [...afterNight.unlockedClueIds];
    const collectibleIds = [...afterNight.unlockedCollectibleIds];

    expect(afterNight.correspondenceHistory).toEqual({});
    afterNight.continueDay();
    const continued = storeModule.useGameStore.getState();
    expect(continued.chapter).toBe(2);
    expect(continued.phase).toBe("day");
    expect(continued.unlockedClueIds).toEqual(clueIds);
    expect(continued.unlockedCollectibleIds).toEqual(collectibleIds);
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
    storeModule.useGameStore.setState({ receivedClueIds: [...storeModule.useGameStore.getState().unlockedClueIds] });
    storeModule.useGameStore.getState().chooseEnding("return");
    expect(storeModule.useGameStore.getState().endingId).toBeUndefined();

    storeModule.useGameStore.setState({ receivedClueIds: [] });
    storeModule.useGameStore.getState().chooseEnding("return");
    expect(storeModule.useGameStore.getState().endingId).toBe("return");
  });
});
