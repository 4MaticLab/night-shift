"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SleepMode, SleepQuality, SleepSession } from "@/src/lib/game-engine/schema";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import type { PreparationId } from "@/src/content/preparations";
import { finishSleepSession, startSleepSession } from "@/src/lib/game-engine/sleep-session";
import { matchEvidenceRelation } from "@/src/content/relations";

export type Phase = "day" | "ready" | "night" | "morning" | "ending";

interface GameState {
  started: boolean;
  chapter: number;
  phase: Phase;
  selectedChoice: string;
  selectedPreparationId: PreparationId | "";
  quality: SleepQuality;
  sleepMode: SleepMode;
  activeSleepSession: SleepSession | null;
  lastSleepSession: SleepSession | null;
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
  continueDay: () => void;
  connectClues: (firstClueId: string, secondClueId: string) => string | null;
  jumpToChapter: (chapter: number) => void;
  unlockBoard: (confirmRelations?: boolean) => void;
  chooseEnding: (endingId: string) => void;
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
    const result = resolveNight(state.chapter, completedSession.quality, state.selectedPreparationId);
    set({
      phase: "morning",
      quality: completedSession.quality,
      activeSleepSession: null,
      lastSleepSession: completedSession,
      unlockedClueIds: Array.from(new Set([...state.unlockedClueIds, ...result.clueIds])),
      unlockedCollectibleIds: Array.from(new Set([...state.unlockedCollectibleIds, ...result.collectibleIds])),
      completedReports: Array.from(new Set([...state.completedReports, state.chapter])),
      nightSealIds: Array.from(new Set([...state.nightSealIds, state.chapter])),
    });
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
  jumpToChapter: (chapter) => set({ ...initial, started: true, chapter, phase: "day", nightSealIds: Array.from({ length: Math.max(0, chapter - 1) }, (_, index) => index + 1), unlockedClueIds: chapter === 1 ? [] : Array.from({ length: Math.min(12, (chapter - 1) * 3) }, (_, i) => ["ticket-date", "ticket-paper", "matchbox", "flower-cycle", "postcard", "missing-log", "room-307", "transport-photo", "scratched-map", "museum-tag", "ledger-clasp", "evelyn-message"][i]), unlockedCollectibleIds: Array.from({ length: Math.min(8, (chapter - 1) * 2) }, (_, i) => ["torn-ticket", "matchbox-item", "pressed-flower", "postcard-item", "hotel-key", "driver-badge", "museum-tag-item", "ledger-clasp-item"][i]) }),
  unlockBoard: (confirmRelations = false) => set({ unlockedClueIds: ["ticket-date", "ticket-paper", "matchbox", "flower-cycle", "postcard", "missing-log", "scratched-map", "room-307", "transport-photo", "museum-tag", "ledger-clasp", "evelyn-message"], unlockedCollectibleIds: ["torn-ticket", "matchbox-item", "pressed-flower", "postcard-item", "hotel-key", "driver-badge", "museum-tag-item", "ledger-clasp-item"], confirmedRelations: confirmRelations ? ["line-institution", "mina-evelyn", "gideon-escape"] : [] }),
  chooseEnding: (endingId) => set({ endingId, phase: "ending" }),
  reset: () => set({ ...initial, endingId: undefined }),
}), {
  name: "night-shift-save-v1",
  version: 2,
  migrate: (persistedState) => {
    const persisted = persistedState as Partial<GameState>;
    return {
      ...persisted,
      sleepMode: persisted.sleepMode ?? "demo",
      activeSleepSession: persisted.activeSleepSession ?? null,
      lastSleepSession: persisted.lastSleepSession ?? null,
      nightSealIds: persisted.nightSealIds ?? [],
      selectedPreparationId: persisted.selectedPreparationId ?? "",
    } as GameState;
  },
}));
