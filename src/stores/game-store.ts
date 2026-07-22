"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nightGrowthRecordSchema, type CorrespondenceRecord, type NightGrowthRecord, type SleepMode, type SleepQuality, type SleepSession, type SocietyMemoryRecord } from "@/src/lib/game-engine/schema";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import type { PreparationId } from "@/src/content/preparations";
import { finishSleepSession, startSleepSession } from "@/src/lib/game-engine/sleep-session";
import { matchEvidenceRelation } from "@/src/content/relations";
import { canChooseEnding, type EndingId } from "@/src/lib/game-engine/ending";
import { getDefaultChoiceId } from "@/src/content/routes";
import { createSocietyMemory } from "@/src/content/societies";
import { createCorrespondenceRecord, getCorrespondencePrompt } from "@/src/content/correspondence";

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
  startNight: (quality, selectedPreparationId, sleepMode) => set({
    quality,
    selectedPreparationId,
    sleepMode,
    activeSleepSession: startSleepSession(sleepMode, quality),
    phase: "night",
  }),
  finishNight: () => {
    const state = get();
    const activeSession = state.activeSleepSession ?? startSleepSession(state.sleepMode, state.quality);
    const completedSession = finishSleepSession(activeSession);
    const result = resolveNight(state.chapter, completedSession.quality, state.selectedPreparationId, state.selectedChoice);
    const completedAt = completedSession.endedAt ?? new Date().toISOString();
    const societyMemory = createSocietyMemory(state.chapter, result.choiceId, state.societyHistory, completedAt);
    set({
      phase: "morning",
      quality: completedSession.quality,
      activeSleepSession: null,
      lastSleepSession: completedSession,
      preparationHistory: {
        ...state.preparationHistory,
        [state.chapter]: state.selectedPreparationId || "side-lamp",
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
          preparationId: state.selectedPreparationId || "side-lamp",
          completedAt,
        }),
      },
      societyHistory: {
        ...state.societyHistory,
        [state.chapter]: societyMemory,
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
    set({ ...initial, started: true, chapter, phase: "day", nightSealIds: priorChapters, completedReports: priorChapters, preparationHistory, choiceHistory, growthHistory, societyHistory, correspondenceHistory: createDemoCorrespondenceHistory(priorChapters, societyHistory), unlockedClueIds: chapter === 1 ? [] : Array.from({ length: Math.min(12, (chapter - 1) * 3) }, (_, i) => ["ticket-date", "ticket-paper", "matchbox", "flower-cycle", "postcard", "missing-log", "room-307", "transport-photo", "scratched-map", "museum-tag", "ledger-clasp", "evelyn-message"][i]), unlockedCollectibleIds: Array.from({ length: Math.min(8, (chapter - 1) * 2) }, (_, i) => ["torn-ticket", "matchbox-item", "pressed-flower", "postcard-item", "hotel-key", "driver-badge", "museum-tag-item", "ledger-clasp-item"][i]) });
  },
  unlockBoard: (confirmRelations = false) => set({ unlockedClueIds: ["ticket-date", "ticket-paper", "matchbox", "flower-cycle", "postcard", "missing-log", "scratched-map", "room-307", "transport-photo", "museum-tag", "ledger-clasp", "evelyn-message"], unlockedCollectibleIds: ["torn-ticket", "matchbox-item", "pressed-flower", "postcard-item", "hotel-key", "driver-badge", "museum-tag-item", "ledger-clasp-item"], confirmedRelations: confirmRelations ? ["line-institution", "mina-evelyn", "gideon-escape"] : [] }),
  chooseEnding: (endingId) => {
    const state = get();
    if (canChooseEnding(endingId, state)) set({ endingId, phase: "ending" });
  },
  reset: () => set({ ...initial, endingId: undefined }),
}), {
  name: "night-shift-save-v1",
  version: 7,
  migrate: migrateGameState,
}));

export function migrateGameState(persistedState: unknown): GameState {
  const persisted = persistedState && typeof persistedState === "object" ? persistedState as Partial<GameState> : {};
  const preparationHistory = persisted.preparationHistory ?? {};
  const choiceHistory = persisted.choiceHistory ?? {};
  const completedReports = persisted.completedReports ?? [];
  const growthHistory = persisted.growthHistory ?? createLegacyGrowthHistory(completedReports, preparationHistory, choiceHistory);
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
