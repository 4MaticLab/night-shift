"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nightGrowthRecordSchema, type CorrespondenceRecord, type NightGrowthRecord, type OpportunityRecord, type SleepMode, type SleepQuality, type SleepSession, type SocietyMemoryRecord, type SouvenirRecord } from "@/src/lib/game-engine/schema";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import type { PreparationId } from "@/src/content/preparations";
import { finishSleepSession, startSleepSession } from "@/src/lib/game-engine/sleep-session";
import { matchEvidenceRelation } from "@/src/content/relations";
import { canChooseEnding, type EndingId } from "@/src/lib/game-engine/ending";
import { getDefaultChoiceId } from "@/src/content/routes";
import { createSocietyMemory } from "@/src/content/societies";
import { createCorrespondenceRecord, getCorrespondencePrompt } from "@/src/content/correspondence";
import { createSouvenirRecord, DEMO_JOURNEY_SEED } from "@/src/content/souvenirs";
import { createOpportunityRecord, getOpportunityCandidates } from "@/src/content/opportunities";

export type Phase = "day" | "ready" | "night" | "morning" | "ending";

export interface GameState {
  started: boolean;
  chapter: number;
  phase: Phase;
  selectedChoice: string;
  selectedPreparationId: PreparationId | "";
  quality: SleepQuality;
  sleepMode: SleepMode;
  activeSleepSession: SleepSession | null;
  lastSleepSession: SleepSession | null;
  preparationHistory: Partial<Record<number, PreparationId>>;
  choiceHistory: Partial<Record<number, string>>;
  growthHistory: Partial<Record<number, NightGrowthRecord>>;
  societyHistory: Partial<Record<number, SocietyMemoryRecord>>;
  correspondenceHistory: Partial<Record<number, CorrespondenceRecord>>;
  journeySeed: number;
  souvenirHistory: Partial<Record<number, SouvenirRecord>>;
  opportunityHistory: Partial<Record<number, OpportunityRecord>>;
  unlockedClueIds: string[];
  unlockedCollectibleIds: string[];
  completedReports: number[];
  confirmedRelations: string[];
  nightSealIds: number[];
  endingId?: string;
  begin: () => void;
  selectChoice: (choice: string) => void;
  startNight: (quality: SleepQuality, preparationId: PreparationId, mode: SleepMode) => void;
  finishNight: () => void;
  answerCorrespondence: (chapter: number, replyId: string) => boolean;
  resolveOpportunity: (noticeId: string, responseId: string) => boolean;
  dismissOpportunities: () => boolean;
  continueDay: () => void;
  connectClues: (firstClueId: string, secondClueId: string) => string | null;
  jumpToChapter: (chapter: number) => void;
  unlockBoard: (confirmRelations?: boolean) => void;
  chooseEnding: (endingId: EndingId) => void;
  reset: () => void;
}

const initial = {
  started: false,
  chapter: 1,
  phase: "day" as Phase,
  selectedChoice: "",
  selectedPreparationId: "" as const,
  quality: "regular" as SleepQuality,
  sleepMode: "demo" as SleepMode,
  activeSleepSession: null as SleepSession | null,
  lastSleepSession: null as SleepSession | null,
  preparationHistory: {} as Partial<Record<number, PreparationId>>,
  choiceHistory: {} as Partial<Record<number, string>>,
  growthHistory: {} as Partial<Record<number, NightGrowthRecord>>,
  societyHistory: {} as Partial<Record<number, SocietyMemoryRecord>>,
  correspondenceHistory: {} as Partial<Record<number, CorrespondenceRecord>>,
  journeySeed: 0,
  souvenirHistory: {} as Partial<Record<number, SouvenirRecord>>,
  opportunityHistory: {} as Partial<Record<number, OpportunityRecord>>,
  unlockedClueIds: [] as string[],
  unlockedCollectibleIds: [] as string[],
  completedReports: [] as number[],
  confirmedRelations: [] as string[],
  nightSealIds: [] as number[],
};

export const useGameStore = create<GameState>()(persist((set, get) => ({
  ...initial,
  begin: () => set({ started: true, phase: "day" }),
  selectChoice: (selectedChoice) => set({ selectedChoice, phase: "ready" }),
  startNight: (quality, selectedPreparationId, sleepMode) => {
    const state = get();
    set({
      quality,
      selectedPreparationId,
      sleepMode,
      journeySeed: state.journeySeed || (sleepMode === "demo" ? DEMO_JOURNEY_SEED : createJourneySeed()),
      activeSleepSession: startSleepSession(sleepMode, quality),
      phase: "night",
    });
  },
  finishNight: () => {
    const state = get();
    const activeSession = state.activeSleepSession ?? startSleepSession(state.sleepMode, state.quality);
    const completedSession = finishSleepSession(activeSession);
    const result = resolveNight(state.chapter, completedSession.quality, state.selectedPreparationId, state.selectedChoice);
    const completedAt = completedSession.endedAt ?? new Date().toISOString();
    const societyMemory = createSocietyMemory(state.chapter, result.choiceId, state.societyHistory, completedAt);
    const preparationId = state.selectedPreparationId || "side-lamp";
    const journeySeed = state.journeySeed || (state.sleepMode === "demo" ? DEMO_JOURNEY_SEED : createJourneySeed());
    const souvenirRecord = createSouvenirRecord(state.chapter, result.choiceId, preparationId, journeySeed, state.souvenirHistory, completedAt);
    set({
      phase: "morning",
      quality: completedSession.quality,
      activeSleepSession: null,
      lastSleepSession: completedSession,
      preparationHistory: {
        ...state.preparationHistory,
        [state.chapter]: preparationId,
      },
      choiceHistory: {
        ...state.choiceHistory,
        [state.chapter]: result.choiceId,
      },
      growthHistory: {
        ...state.growthHistory,
        [state.chapter]: nightGrowthRecordSchema.parse({
          chapter: state.chapter,
          quality: completedSession.quality,
          durationMinutes: completedSession.durationMinutes ?? 0,
          choiceId: result.choiceId,
          preparationId,
          completedAt,
        }),
      },
      societyHistory: {
        ...state.societyHistory,
        [state.chapter]: societyMemory,
      },
      journeySeed,
      souvenirHistory: {
        ...state.souvenirHistory,
        [state.chapter]: souvenirRecord,
      },
      unlockedClueIds: Array.from(new Set([...state.unlockedClueIds, ...result.clueIds])),
      unlockedCollectibleIds: Array.from(new Set([...state.unlockedCollectibleIds, ...result.collectibleIds])),
      completedReports: Array.from(new Set([...state.completedReports, state.chapter])),
      nightSealIds: Array.from(new Set([...state.nightSealIds, state.chapter])),
    });
  },
  answerCorrespondence: (chapter, replyId) => {
    const state = get();
    if (state.correspondenceHistory[chapter]) return false;
    const memory = state.societyHistory[chapter];
    if (!memory) return false;
    try {
      const record = createCorrespondenceRecord(memory, replyId, new Date().toISOString());
      set({ correspondenceHistory: { ...state.correspondenceHistory, [chapter]: record } });
      return true;
    } catch {
      return false;
    }
  },
  resolveOpportunity: (noticeId, responseId) => {
    const state = get();
    if (state.chapter < 2 || state.opportunityHistory[state.chapter]) return false;
    try {
      const record = createOpportunityRecord(state.chapter, state.journeySeed || DEMO_JOURNEY_SEED, state.opportunityHistory, noticeId, responseId, new Date().toISOString());
      set({ opportunityHistory: { ...state.opportunityHistory, [state.chapter]: record } });
      return true;
    } catch {
      return false;
    }
  },
  dismissOpportunities: () => {
    const state = get();
    if (state.chapter < 2 || state.opportunityHistory[state.chapter]) return false;
    try {
      const record = createOpportunityRecord(state.chapter, state.journeySeed || DEMO_JOURNEY_SEED, state.opportunityHistory, undefined, undefined, new Date().toISOString());
      set({ opportunityHistory: { ...state.opportunityHistory, [state.chapter]: record } });
      return true;
    } catch {
      return false;
    }
  },
  continueDay: () => {
    const state = get();
    if (state.chapter >= 5) set({ phase: "ending" });
    else set({ chapter: state.chapter + 1, phase: "day", selectedChoice: "", selectedPreparationId: "" });
  },
  connectClues: (firstClueId, secondClueId) => {
    const state = get();
    if (!state.unlockedClueIds.includes(firstClueId) || !state.unlockedClueIds.includes(secondClueId)) return null;
    const relation = matchEvidenceRelation(firstClueId, secondClueId);
    if (!relation) return null;
    set({ confirmedRelations: Array.from(new Set([...state.confirmedRelations, relation.id])) });
    return relation.id;
  },
  jumpToChapter: (chapter) => {
    const priorChapters = Array.from({ length: Math.max(0, chapter - 1) }, (_, index) => index + 1);
    const preparationHistory = Object.fromEntries(priorChapters.map((number) => [number, "side-lamp" as PreparationId]));
    const choiceHistory = Object.fromEntries(priorChapters.map((number) => [number, getDefaultChoiceId(number)]));
    const growthHistory = createLegacyGrowthHistory(priorChapters, preparationHistory, choiceHistory);
    const societyHistory = createLegacySocietyHistory(priorChapters, choiceHistory, growthHistory);
    set({ ...initial, started: true, chapter, phase: "day", journeySeed: DEMO_JOURNEY_SEED, souvenirHistory: createLegacySouvenirHistory(priorChapters, preparationHistory, choiceHistory, DEMO_JOURNEY_SEED, growthHistory), opportunityHistory: createDemoOpportunityHistory(priorChapters, DEMO_JOURNEY_SEED), nightSealIds: priorChapters, completedReports: priorChapters, preparationHistory, choiceHistory, growthHistory, societyHistory, correspondenceHistory: createDemoCorrespondenceHistory(priorChapters, societyHistory), unlockedClueIds: chapter === 1 ? [] : Array.from({ length: Math.min(12, (chapter - 1) * 3) }, (_, i) => ["ticket-date", "ticket-paper", "matchbox", "flower-cycle", "postcard", "missing-log", "room-307", "transport-photo", "scratched-map", "museum-tag", "ledger-clasp", "evelyn-message"][i]), unlockedCollectibleIds: Array.from({ length: Math.min(8, (chapter - 1) * 2) }, (_, i) => ["torn-ticket", "matchbox-item", "pressed-flower", "postcard-item", "hotel-key", "driver-badge", "museum-tag-item", "ledger-clasp-item"][i]) });
  },
  unlockBoard: (confirmRelations = false) => set({ unlockedClueIds: ["ticket-date", "ticket-paper", "matchbox", "flower-cycle", "postcard", "missing-log", "scratched-map", "room-307", "transport-photo", "museum-tag", "ledger-clasp", "evelyn-message"], unlockedCollectibleIds: ["torn-ticket", "matchbox-item", "pressed-flower", "postcard-item", "hotel-key", "driver-badge", "museum-tag-item", "ledger-clasp-item"], confirmedRelations: confirmRelations ? ["line-institution", "mina-evelyn", "gideon-escape"] : [] }),
  chooseEnding: (endingId) => {
    const state = get();
    if (canChooseEnding(endingId, state)) set({ endingId, phase: "ending" });
  },
  reset: () => set({ ...initial, endingId: undefined }),
}), {
  name: "night-shift-save-v1",
  version: 9,
  migrate: migrateGameState,
}));

export function migrateGameState(persistedState: unknown): GameState {
  const persisted = persistedState && typeof persistedState === "object" ? persistedState as Partial<GameState> : {};
  const preparationHistory = persisted.preparationHistory ?? {};
  const choiceHistory = persisted.choiceHistory ?? {};
  const completedReports = persisted.completedReports ?? [];
  const growthHistory = persisted.growthHistory ?? createLegacyGrowthHistory(completedReports, preparationHistory, choiceHistory);
  const journeySeed = persisted.journeySeed || DEMO_JOURNEY_SEED;
  return {
    ...persisted,
    sleepMode: persisted.sleepMode ?? "demo",
    activeSleepSession: persisted.activeSleepSession ?? null,
    lastSleepSession: persisted.lastSleepSession ?? null,
    preparationHistory,
    choiceHistory,
    growthHistory,
    societyHistory: persisted.societyHistory ?? createLegacySocietyHistory(completedReports, choiceHistory, growthHistory),
    correspondenceHistory: persisted.correspondenceHistory ?? {},
    journeySeed,
    souvenirHistory: persisted.souvenirHistory ?? createLegacySouvenirHistory(completedReports, preparationHistory, choiceHistory, journeySeed, growthHistory),
    opportunityHistory: persisted.opportunityHistory ?? {},
    nightSealIds: persisted.nightSealIds ?? [],
    selectedPreparationId: persisted.selectedPreparationId ?? "",
  } as GameState;
}

function createLegacyGrowthHistory(completedReports: number[], preparationHistory: Partial<Record<number, PreparationId>>, choiceHistory: Partial<Record<number, string>>): Partial<Record<number, NightGrowthRecord>> {
  return Object.fromEntries(completedReports.map((chapter) => [chapter, nightGrowthRecordSchema.parse({
    chapter,
    quality: "regular",
    durationMinutes: 390,
    choiceId: choiceHistory[chapter] ?? getDefaultChoiceId(chapter),
    preparationId: preparationHistory[chapter] ?? "side-lamp",
    completedAt: `2026-07-${String(10 + chapter).padStart(2, "0")}T05:28:00.000Z`,
  })]));
}

function createLegacySocietyHistory(
  completedReports: number[],
  choiceHistory: Partial<Record<number, string>>,
  growthHistory: Partial<Record<number, NightGrowthRecord>>,
): Partial<Record<number, SocietyMemoryRecord>> {
  const history: Partial<Record<number, SocietyMemoryRecord>> = {};
  for (const chapter of [...completedReports].sort((a, b) => a - b)) {
    const choiceId = choiceHistory[chapter] ?? getDefaultChoiceId(chapter);
    const completedAt = growthHistory[chapter]?.completedAt ?? `2026-07-${String(10 + chapter).padStart(2, "0")}T05:28:00.000Z`;
    history[chapter] = createSocietyMemory(chapter, choiceId, history, completedAt);
  }
  return history;
}

function createDemoCorrespondenceHistory(
  completedReports: number[],
  societyHistory: Partial<Record<number, SocietyMemoryRecord>>,
): Partial<Record<number, CorrespondenceRecord>> {
  return Object.fromEntries(completedReports.flatMap((chapter) => {
    const memory = societyHistory[chapter];
    if (!memory) return [];
    const prompt = getCorrespondencePrompt(memory);
    return [[chapter, createCorrespondenceRecord(memory, prompt.replies[0].id, `2026-07-${String(10 + chapter).padStart(2, "0")}T06:02:00.000Z`)]];
  }));
}

function createLegacySouvenirHistory(
  completedReports: number[],
  preparationHistory: Partial<Record<number, PreparationId>>,
  choiceHistory: Partial<Record<number, string>>,
  journeySeed: number,
  growthHistory: Partial<Record<number, NightGrowthRecord>>,
): Partial<Record<number, SouvenirRecord>> {
  const history: Partial<Record<number, SouvenirRecord>> = {};
  for (const chapter of [...completedReports].sort((a, b) => a - b)) {
    const choiceId = choiceHistory[chapter] ?? getDefaultChoiceId(chapter);
    const preparationId = preparationHistory[chapter] ?? "side-lamp";
    const foundAt = growthHistory[chapter]?.completedAt ?? `2026-07-${String(10 + chapter).padStart(2, "0")}T05:28:00.000Z`;
    history[chapter] = createSouvenirRecord(chapter, choiceId, preparationId, journeySeed, history, foundAt);
  }
  return history;
}

function createJourneySeed(): number {
  const random = globalThis.crypto?.getRandomValues?.(new Uint32Array(1))[0];
  const seed = random && Number.isSafeInteger(random) ? random : Math.max(1, Date.now() % 4_294_967_295);
  return seed === DEMO_JOURNEY_SEED ? seed + 1 : seed;
}

function createDemoOpportunityHistory(completedReports: number[], journeySeed: number): Partial<Record<number, OpportunityRecord>> {
  const history: Partial<Record<number, OpportunityRecord>> = {};
  for (const chapter of completedReports.filter((number) => number >= 2).sort((a, b) => a - b)) {
    const notice = getOpportunityCandidates(chapter, journeySeed, history)[0];
    history[chapter] = createOpportunityRecord(chapter, journeySeed, history, notice.id, notice.responses[0].id, `2026-07-${String(10 + chapter).padStart(2, "0")}T13:00:00.000Z`);
  }
  return history;
}
