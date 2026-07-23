"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  chooseSandboxEnding,
  createSandboxProgress,
  findSandboxAction,
  requirementMet,
  resolveSandboxAction,
  startSandboxCampaign,
} from "@/src/lib/sandbox/engine";
import type { SandboxCampaignContent, SandboxProgress } from "@/src/lib/sandbox/types";
import { finishSleepSession, startSleepSession } from "@/src/lib/game-engine/sleep-session";
import type { SleepMode, SleepQuality } from "@/src/lib/game-engine/schema";
import { useSleepHardwareStore } from "@/src/stores/sleep-hardware-store";
import { ensureCurrentSaveEpoch } from "@/src/stores/save-epoch";

interface SandboxStore {
  saves: Record<string, SandboxProgress>;
  start: (campaignId: string, content: SandboxCampaignContent, originId: string) => boolean;
  selectAction: (campaignId: string, content: SandboxCampaignContent, actionId: string) => boolean;
  clearSelection: (campaignId: string, content: SandboxCampaignContent) => void;
  selectItem: (campaignId: string, content: SandboxCampaignContent, itemId?: string) => boolean;
  setSleepMode: (campaignId: string, content: SandboxCampaignContent, mode: SleepMode) => void;
  setQuality: (campaignId: string, content: SandboxCampaignContent, quality: SleepQuality) => void;
  startExpedition: (campaignId: string, content: SandboxCampaignContent, startedAt?: Date) => boolean;
  finishExpedition: (campaignId: string, content: SandboxCampaignContent, endedAt?: Date) => boolean;
  archiveReport: (campaignId: string, content: SandboxCampaignContent) => boolean;
  chooseEnding: (campaignId: string, content: SandboxCampaignContent, endingId: string) => boolean;
  toggleReducedHorror: (campaignId: string, content: SandboxCampaignContent) => void;
  reset: (campaignId: string, content: SandboxCampaignContent) => void;
}

ensureCurrentSaveEpoch();

export const useSandboxStore = create<SandboxStore>()(persist((set, get) => ({
  saves: {},
  start: (campaignId, content, originId) => {
    const progress = startSandboxCampaign(content, originId, getSandboxProgress(get(), campaignId, content).reducedHorror);
    if (!progress.started) return false;
    set((state) => ({ saves: { ...state.saves, [campaignId]: progress } }));
    return true;
  },
  selectAction: (campaignId, content, actionId) => {
    const current = getSandboxProgress(get(), campaignId, content);
    const found = findSandboxAction(content, actionId);
    if (!found || current.phase !== "day" || current.completedActionIds.includes(actionId)) return false;
    if (!current.unlockedLocationIds.includes(found.locationId) || !requirementMet(current, found.action.requires)) return false;
    set((state) => ({
      saves: {
        ...state.saves,
        [campaignId]: {
          ...current,
          pendingActionId: actionId,
          selectedItemId: current.selectedItemId && current.itemIds.includes(current.selectedItemId)
            ? current.selectedItemId
            : current.itemIds[0],
        },
      },
    }));
    return true;
  },
  clearSelection: (campaignId, content) => {
    const current = getSandboxProgress(get(), campaignId, content);
    if (current.phase === "day") {
      set((state) => ({
        saves: {
          ...state.saves,
          [campaignId]: { ...current, pendingActionId: undefined, selectedItemId: undefined },
        },
      }));
    }
  },
  selectItem: (campaignId, content, itemId) => {
    const current = getSandboxProgress(get(), campaignId, content);
    if (current.phase !== "day" || (itemId && !current.itemIds.includes(itemId))) return false;
    set((state) => ({ saves: { ...state.saves, [campaignId]: { ...current, selectedItemId: itemId } } }));
    return true;
  },
  setSleepMode: (campaignId, content, sleepMode) => {
    const current = getSandboxProgress(get(), campaignId, content);
    if (current.phase === "day") set((state) => ({ saves: { ...state.saves, [campaignId]: { ...current, sleepMode } } }));
  },
  setQuality: (campaignId, content, selectedQuality) => {
    const current = getSandboxProgress(get(), campaignId, content);
    if (current.phase === "day") set((state) => ({ saves: { ...state.saves, [campaignId]: { ...current, selectedQuality } } }));
  },
  startExpedition: (campaignId, content, startedAt = new Date()) => {
    const current = getSandboxProgress(get(), campaignId, content);
    if (current.phase !== "day" || !current.pendingActionId) return false;
    const found = findSandboxAction(content, current.pendingActionId);
    if (!found || current.completedActionIds.includes(found.action.id)
      || !current.unlockedLocationIds.includes(found.locationId)
      || !requirementMet(current, found.action.requires)) return false;
    const activeSleepSession = startSleepSession(current.sleepMode, current.selectedQuality, startedAt);
    useSleepHardwareStore.getState().beginCapture(activeSleepSession);
    set((state) => ({
      saves: {
        ...state.saves,
        [campaignId]: { ...current, phase: "night", activeSleepSession, latestReport: undefined },
      },
    }));
    return true;
  },
  finishExpedition: (campaignId, content, endedAt = new Date()) => {
    const current = getSandboxProgress(get(), campaignId, content);
    if (current.phase !== "night" || !current.pendingActionId || !current.activeSleepSession) return false;
    const found = findSandboxAction(content, current.pendingActionId);
    if (!found) return false;
    const resolution = resolveSandboxAction(content, current, current.pendingActionId);
    if (!resolution.ok || !resolution.entry) return false;
    const session = finishSleepSession(current.activeSleepSession, endedAt);
    useSleepHardwareStore.getState().finishCapture(session);
    const before = current;
    const after = resolution.progress;
    const latestReport = {
      actionId: found.action.id,
      locationId: found.locationId,
      entryId: resolution.entry.id,
      carriedItemId: current.selectedItemId,
      session,
      clueIds: after.clueIds.filter((id) => !before.clueIds.includes(id)),
      handoutIds: after.handoutIds.filter((id) => !before.handoutIds.includes(id)),
      itemIds: after.itemIds.filter((id) => !before.itemIds.includes(id)),
      unlockedLocationIds: after.unlockedLocationIds.filter((id) => !before.unlockedLocationIds.includes(id)),
      npcEffects: found.action.effects.npc ?? [],
      corruptionDelta: resolution.entry.corruptionDelta,
      threatDelta: resolution.entry.threatDelta,
    };
    set((state) => ({
      saves: {
        ...state.saves,
        [campaignId]: {
          ...after,
          phase: "morning",
          activeSleepSession: undefined,
          latestReport,
        },
      },
    }));
    return true;
  },
  archiveReport: (campaignId, content) => {
    const current = getSandboxProgress(get(), campaignId, content);
    if (current.phase !== "morning" || !current.latestReport) return false;
    set((state) => ({
      saves: {
        ...state.saves,
        [campaignId]: {
          ...current,
          phase: "day",
          pendingActionId: undefined,
          selectedItemId: undefined,
        },
      },
    }));
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
  version: 3,
  partialize: (state) => ({ saves: state.saves }),
  migrate: () => ({ saves: {} }),
}));

export function getSandboxProgress(
  state: Pick<SandboxStore, "saves">,
  campaignId: string,
  content: SandboxCampaignContent,
): SandboxProgress {
  const saved = state.saves[campaignId];
  if (!saved) return createSandboxProgress(content);
  const normalized = normalizeSandboxProgress(saved);
  return {
    ...normalized,
    npcStates: {
      ...Object.fromEntries(content.npcs.map((npc) => [npc.id, "unknown" as const])),
      ...normalized.npcStates,
    },
  };
}

export function normalizeSandboxProgress(progress: Partial<SandboxProgress>): SandboxProgress {
  return {
    started: progress.started ?? false,
    originId: progress.originId,
    phase: progress.phase === "night" && progress.activeSleepSession && progress.pendingActionId
      ? "night"
      : progress.phase === "morning" && progress.latestReport
        ? "morning"
        : "day",
    unlockedLocationIds: progress.unlockedLocationIds ?? [],
    visitedLocationIds: progress.visitedLocationIds ?? [],
    completedActionIds: progress.completedActionIds ?? [],
    clueIds: progress.clueIds ?? [],
    handoutIds: progress.handoutIds ?? [],
    itemIds: progress.itemIds ?? [],
    corruption: progress.corruption ?? 0,
    threat: progress.threat ?? 0,
    npcStates: progress.npcStates ?? {},
    log: progress.log ?? [],
    endingId: progress.endingId,
    reducedHorror: progress.reducedHorror ?? false,
    pendingActionId: progress.pendingActionId,
    selectedItemId: progress.selectedItemId,
    sleepMode: progress.sleepMode ?? "demo",
    selectedQuality: progress.selectedQuality ?? "regular",
    activeSleepSession: progress.activeSleepSession,
    latestReport: progress.latestReport,
  };
}
