"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getVirtualSleepDevice } from "@/src/content/sleep-devices";
import type { SleepSession } from "@/src/lib/game-engine/schema";
import { readNativeSleepSummary } from "@/src/lib/sleep-hardware/native-health";
import { createSleepSignalSummary } from "@/src/lib/sleep-hardware/simulator";
import type {
  ActiveSleepCapture,
  NativeSleepBridgeId,
  SleepBridgeId,
  SleepHardwareConsent,
  SleepHardwareMode,
  SleepPermissionId,
  SleepSignalSummary,
  VirtualDeviceId,
} from "@/src/lib/sleep-hardware/types";

interface SleepHardwareStore {
  mode: SleepHardwareMode;
  selectedDeviceId: VirtualDeviceId;
  selectedBridgeId: SleepBridgeId;
  consent: SleepHardwareConsent | null;
  activeCapture: ActiveSleepCapture | null;
  history: Record<string, SleepSignalSummary>;
  selectVirtualDevice: (deviceId: VirtualDeviceId) => void;
  authorizeVirtualDevice: (deviceId: VirtualDeviceId, permissions: SleepPermissionId[]) => boolean;
  selectBridge: (bridgeId: SleepBridgeId) => void;
  authorizeNativeBridge: (bridgeId: NativeSleepBridgeId) => boolean;
  grantConsent: (permissions: SleepPermissionId[]) => boolean;
  revokeConsent: () => void;
  beginCapture: (session: SleepSession) => boolean;
  finishCapture: (session: SleepSession) => Promise<SleepSignalSummary | null>;
  refreshNativeSummary: (session: SleepSession) => Promise<SleepSignalSummary | null>;
  reset: () => void;
}

const virtualDeviceIds = new Set<VirtualDeviceId>(["night-ring", "watch-17", "under-mattress", "quiet-pillow"]);

function isNativeSleepBridge(bridgeId: string): bridgeId is NativeSleepBridgeId {
  return bridgeId === "apple-health" || bridgeId === "health-connect";
}

function appendSummary(
  history: Record<string, SleepSignalSummary>,
  summary: SleepSignalSummary,
): Record<string, SleepSignalSummary> {
  return Object.fromEntries(Object.entries({ ...history, [summary.sessionId]: summary })
    .sort(([, first], [, second]) => second.endedAt.localeCompare(first.endedAt))
    .slice(0, 8));
}

const initialHardwareState = {
  mode: "off" as SleepHardwareMode,
  selectedDeviceId: "night-ring" as VirtualDeviceId,
  selectedBridgeId: "apple-health" as SleepBridgeId,
  consent: null as SleepHardwareConsent | null,
  activeCapture: null as ActiveSleepCapture | null,
  history: {} as Record<string, SleepSignalSummary>,
};

export const useSleepHardwareStore = create<SleepHardwareStore>()(persist((set, get) => ({
  ...initialHardwareState,
  selectVirtualDevice: (selectedDeviceId) => {
    const state = get();
    const keepConsent = state.mode === "virtual" && state.consent?.sourceId === selectedDeviceId;
    set({
      mode: "virtual",
      selectedDeviceId,
      consent: keepConsent ? state.consent : null,
      activeCapture: keepConsent ? state.activeCapture : null,
    });
  },
  authorizeVirtualDevice: (selectedDeviceId, requestedPermissions) => {
    const state = get();
    if (state.activeCapture) return false;
    const device = getVirtualSleepDevice(selectedDeviceId);
    if (!device) return false;
    const permissions = Array.from(new Set([
      "sleep-window" as const,
      ...requestedPermissions.filter((permission) => device.permissions.includes(permission)),
    ]));
    set({
      mode: "virtual",
      selectedDeviceId,
      consent: {
        sourceId: device.id,
        sourceKind: "virtual",
        permissions,
        grantedAt: new Date().toISOString(),
        localOnly: true,
      },
      activeCapture: null,
    });
    return true;
  },
  selectBridge: (selectedBridgeId) => {
    const state = get();
    const keepConsent = state.mode === "bridge"
      && state.consent?.sourceKind === "native"
      && state.consent.sourceId === selectedBridgeId;
    set({
      mode: "bridge",
      selectedBridgeId,
      consent: keepConsent ? state.consent : null,
      activeCapture: keepConsent ? state.activeCapture : null,
    });
  },
  authorizeNativeBridge: (selectedBridgeId) => {
    const state = get();
    if (state.activeCapture || !isNativeSleepBridge(selectedBridgeId)) return false;
    set({
      mode: "bridge",
      selectedBridgeId,
      consent: {
        sourceId: selectedBridgeId,
        sourceKind: "native",
        permissions: ["sleep-window", "sleep-stages"],
        grantedAt: new Date().toISOString(),
        localOnly: true,
      },
      activeCapture: null,
    });
    return true;
  },
  grantConsent: (requestedPermissions) => {
    const state = get();
    if (state.mode !== "virtual") return false;
    const device = getVirtualSleepDevice(state.selectedDeviceId);
    if (!device) return false;
    const permissions = Array.from(new Set([
      "sleep-window" as const,
      ...requestedPermissions.filter((permission) => device.permissions.includes(permission)),
    ]));
    set({
      consent: {
        sourceId: device.id,
        sourceKind: "virtual",
        permissions,
        grantedAt: new Date().toISOString(),
        localOnly: true,
      },
    });
    return true;
  },
  revokeConsent: () => set({ mode: "off", consent: null, activeCapture: null }),
  beginCapture: (session) => {
    const state = get();
    const consent = state.consent;
    const virtualReady = state.mode === "virtual"
      && consent?.sourceKind === "virtual"
      && consent.sourceId === state.selectedDeviceId;
    const nativeReady = state.mode === "bridge"
      && isNativeSleepBridge(state.selectedBridgeId)
      && consent?.sourceKind === "native"
      && consent.sourceId === state.selectedBridgeId;
    if ((!virtualReady && !nativeReady) || !consent) return false;
    set({
      activeCapture: {
        sessionId: session.id,
        sourceId: consent.sourceId,
        sourceKind: consent.sourceKind,
        startedAt: session.startedAt,
        quality: session.quality,
        permissions: consent.permissions,
      },
    });
    return true;
  },
  finishCapture: async (session) => {
    const state = get();
    if (!state.activeCapture || state.activeCapture.sessionId !== session.id) return null;
    const capture = state.activeCapture;
    set({ activeCapture: null });

    if (capture.sourceKind === "virtual") {
      const summary = createSleepSignalSummary(capture, session);
      set((current) => ({ history: appendSummary(current.history, summary) }));
      return summary;
    }

    return get().refreshNativeSummary(session);
  },
  refreshNativeSummary: async (session) => {
    const state = get();
    const sourceId = state.consent?.sourceKind === "native" ? state.consent.sourceId : undefined;
    if (!sourceId || !isNativeSleepBridge(sourceId)) return null;
    try {
      const summary = await readNativeSleepSummary(session, sourceId);
      if (!summary || get().consent?.sourceId !== sourceId) return null;
      set((current) => ({ history: appendSummary(current.history, summary) }));
      return summary;
    } catch {
      return null;
    }
  },
  reset: () => set({ ...initialHardwareState, history: {} }),
}), {
  name: "night-shift-sleep-hardware-v1",
  version: 2,
  partialize: ({ mode, selectedDeviceId, selectedBridgeId, consent, activeCapture, history }) => ({
    mode,
    selectedDeviceId,
    selectedBridgeId,
    consent,
    activeCapture,
    history,
  }),
  migrate: (persisted, version) => {
    if (version >= 2 || !persisted || typeof persisted !== "object") return persisted as SleepHardwareStore;
    const state = persisted as Partial<SleepHardwareStore>;
    const consent = state.consent
      ? {
        ...state.consent,
        sourceKind: virtualDeviceIds.has(state.consent.sourceId as VirtualDeviceId) ? "virtual" as const : "native" as const,
      }
      : null;
    const activeCapture = state.activeCapture
      ? {
        ...state.activeCapture,
        sourceKind: virtualDeviceIds.has(state.activeCapture.sourceId as VirtualDeviceId) ? "virtual" as const : "native" as const,
      }
      : null;
    const history = Object.fromEntries(Object.entries(state.history ?? {}).map(([sessionId, summary]) => [
      sessionId,
      {
        ...summary,
        sourceKind: virtualDeviceIds.has(summary.sourceId as VirtualDeviceId) ? "virtual" as const : "native" as const,
      },
    ]));
    return { ...state, consent, activeCapture, history } as SleepHardwareStore;
  },
}));
