"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  chooseSandboxEnding,
  createSandboxProgress,
  resolveSandboxAction,
  startSandboxCampaign,
} from "@/src/lib/sandbox/engine";
import type { SandboxCampaignContent, SandboxProgress } from "@/src/lib/sandbox/types";

interface SandboxStore {
  saves: Record<string, SandboxProgress>;
  start: (campaignId: string, content: SandboxCampaignContent, originId: string) => boolean;
  resolveAction: (campaignId: string, content: SandboxCampaignContent, actionId: string) => boolean;
  chooseEnding: (campaignId: string, content: SandboxCampaignContent, endingId: string) => boolean;
  toggleReducedHorror: (campaignId: string, content: SandboxCampaignContent) => void;
  reset: (campaignId: string, content: SandboxCampaignContent) => void;
}

export const useSandboxStore = create<SandboxStore>()(persist((set, get) => ({
  saves: {},
  start: (campaignId, content, originId) => {
    const progress = startSandboxCampaign(content, originId, getSandboxProgress(get(), campaignId, content).reducedHorror);
    if (!progress.started) return false;
    set((state) => ({ saves: { ...state.saves, [campaignId]: progress } }));
    return true;
  },
  resolveAction: (campaignId, content, actionId) => {
    const current = getSandboxProgress(get(), campaignId, content);
    const resolution = resolveSandboxAction(content, current, actionId);
    if (!resolution.ok) return false;
    set((state) => ({ saves: { ...state.saves, [campaignId]: resolution.progress } }));
    return true;
  },
  chooseEnding: (campaignId, content, endingId) => {
    const current = getSandboxProgress(get(), campaignId, content);
    const progress = chooseSandboxEnding(content, current, endingId);
    if (progress === current) return false;
    set((state) => ({ saves: { ...state.saves, [campaignId]: progress } }));
    return true;
  },
  toggleReducedHorror: (campaignId, content) => {
    const current = getSandboxProgress(get(), campaignId, content);
    set((state) => ({
      saves: {
        ...state.saves,
        [campaignId]: { ...current, reducedHorror: !current.reducedHorror },
      },
    }));
  },
  reset: (campaignId, content) => {
    const current = getSandboxProgress(get(), campaignId, content);
    set((state) => ({
      saves: {
        ...state.saves,
        [campaignId]: createSandboxProgress(content, current.reducedHorror),
      },
    }));
  },
}), {
  name: "night-shift-sandbox-v1",
  version: 1,
  partialize: (state) => ({ saves: state.saves }),
}));

export function getSandboxProgress(
  state: Pick<SandboxStore, "saves">,
  campaignId: string,
  content: SandboxCampaignContent,
): SandboxProgress {
  return state.saves[campaignId] ?? createSandboxProgress(content);
}
