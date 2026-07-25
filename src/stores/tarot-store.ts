"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getLocalDateKey, getTarotRecordKey, selectDailyTarot, type TarotDrawRecord } from "@/src/content/tarot";

export const TAROT_STORAGE_KEY = "night-shift-tarot-v1";

interface TarotStore {
  localSeed: number;
  records: Record<string, TarotDrawRecord>;
  hydrated: boolean;
  drawDaily: (campaignId: string, date?: Date) => TarotDrawRecord;
  markHydrated: () => void;
}

export const useTarotStore = create<TarotStore>()(persist((set, get) => ({
  localSeed: 0,
  records: {},
  hydrated: false,
  drawDaily: (campaignId, date = new Date()) => {
    const dateKey = getLocalDateKey(date);
    const key = getTarotRecordKey(campaignId, dateKey);
    const existing = get().records[key];
    if (existing) return existing;

    const localSeed = get().localSeed || createLocalSeed();
    const record = selectDailyTarot(campaignId, dateKey, localSeed, date.toISOString());
    set((state) => ({
      localSeed,
      records: { ...state.records, [key]: record },
    }));
    return record;
  },
  markHydrated: () => set({ hydrated: true }),
}), {
  name: TAROT_STORAGE_KEY,
  version: 1,
  partialize: (state) => ({ localSeed: state.localSeed, records: state.records }),
  onRehydrateStorage: () => (state) => state?.markHydrated(),
}));

function createLocalSeed(): number {
  if (typeof globalThis.crypto !== "undefined") {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0 || 1;
}
