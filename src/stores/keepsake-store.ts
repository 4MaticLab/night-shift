"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sanitizeKeepsakeIds } from "@/src/lib/game-engine/keepsake-sharing";

export const KEEPSAKE_STORAGE_KEY = "night-shift-keepsakes-v1";

export type ReceiveKeepsakeResult = "received" | "already-received" | "invalid";

interface KeepsakeStore {
  receivedIds: string[];
  hydrated: boolean;
  receive: (keepsakeId: string) => ReceiveKeepsakeResult;
  has: (keepsakeId: string) => boolean;
  markHydrated: () => void;
}

export const useKeepsakeStore = create<KeepsakeStore>()(persist((set, get) => ({
  receivedIds: [],
  hydrated: false,
  receive: (keepsakeId) => {
    const valid = sanitizeKeepsakeIds([keepsakeId]);
    if (valid.length === 0) return "invalid";
    const id = valid[0];
    if (get().receivedIds.includes(id)) return "already-received";
    set((state) => ({ receivedIds: sanitizeKeepsakeIds([...state.receivedIds, id]) }));
    return "received";
  },
  has: (keepsakeId) => get().receivedIds.includes(keepsakeId),
  markHydrated: () => set({ hydrated: true }),
}), {
  name: KEEPSAKE_STORAGE_KEY,
  version: 1,
  partialize: (state) => ({ receivedIds: state.receivedIds }),
  migrate: (persisted) => {
    const state = persisted && typeof persisted === "object" ? persisted as { receivedIds?: unknown } : {};
    return { receivedIds: sanitizeKeepsakeIds(state.receivedIds), hydrated: false };
  },
  onRehydrateStorage: () => (state) => state?.markHydrated(),
}));
