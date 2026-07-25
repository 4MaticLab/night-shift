"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CIPHER_NOTEBOOK_STORAGE_KEY = "night-shift-cipher-notes-v1";
export const CIPHER_NOTEBOOK_MAX_LENGTH = 1200;

export function sanitizeCipherNote(value: unknown): string {
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").slice(0, CIPHER_NOTEBOOK_MAX_LENGTH) : "";
}

export function sanitizeCipherNotes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).flatMap(([campaignId, note]) => {
    if (!/^case-\d{3}$/.test(campaignId)) return [];
    const sanitized = sanitizeCipherNote(note);
    return sanitized ? [[campaignId, sanitized]] : [];
  }));
}

interface CipherNotebookStore {
  notes: Record<string, string>;
  hydrated: boolean;
  setNote: (campaignId: string, note: string) => void;
  clearNote: (campaignId: string) => void;
  markHydrated: () => void;
}

export const useCipherNotebookStore = create<CipherNotebookStore>()(persist((set) => ({
  notes: {},
  hydrated: false,
  setNote: (campaignId, note) => set((state) => ({ notes: { ...state.notes, [campaignId]: sanitizeCipherNote(note) } })),
  clearNote: (campaignId) => set((state) => {
    const notes = { ...state.notes };
    delete notes[campaignId];
    return { notes };
  }),
  markHydrated: () => set({ hydrated: true }),
}), {
  name: CIPHER_NOTEBOOK_STORAGE_KEY,
  version: 1,
  partialize: (state) => ({ notes: state.notes }),
  migrate: (persisted) => {
    const state = persisted && typeof persisted === "object" ? persisted as { notes?: unknown } : {};
    return { notes: sanitizeCipherNotes(state.notes), hydrated: false };
  },
  onRehydrateStorage: () => (state) => state?.markHydrated(),
}));
