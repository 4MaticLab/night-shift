"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getVirtualSleepDevice } from "@/src/content/sleep-devices";
import type { SleepSession } from "@/src/lib/game-engine/schema";
import { createSleepSignalSummary } from "@/src/lib/sleep-hardware/simulator";
import type {
  ActiveSleepCapture,
  SleepBridgeId,
  SleepHardwareConsent,
  SleepHardwareMode,
  SleepPermissionId,
  SleepSignalSummary,
  VirtualDeviceId,
} from "@/src/lib/sleep-hardware/types";
import { ensureCurrentSaveEpoch } from "@/src/stores/save-epoch";

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
  grantConsent: (permissions: SleepPermissionId[]) => boolean;
  revokeConsent: () => void;
  beginCapture: (session: SleepSession) => boolean;
  finishCapture: (session: SleepSession) => SleepSignalSummary | null;
  reset: () => void;
}

const initialHardwareState = {
  mode: "off" as SleepHardwareMode,
  selectedDeviceId: "night-ring" as VirtualDeviceId,
  selectedBridgeId: "apple-health" as SleepBridgeId,
  consent: null as SleepHardwareConsent | null,
  activeCapture: null as ActiveSleepCapture | null,
  history: {} as Record<string, SleepSignalSummary>,
};

ensureCurrentSaveEpoch();

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
        permissions,
        grantedAt: new Date().toISOString(),
        localOnly: true,
      },
      activeCapture: null,
    });
    return true;
  },
  selectBridge: (selectedBridgeId) => set({
    mode: "bridge",
    selectedBridgeId,
    consent: null,
    activeCapture: null,
  }),
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
    if (state.mode !== "virtual" || state.consent?.sourceId !== state.selectedDeviceId) return false;
    set({
      activeCapture: {
        sessionId: session.id,
        sourceId: state.selectedDeviceId,
        startedAt: session.startedAt,
        quality: session.quality,
        permissions: state.consent.permissions,
      },
    });
    return true;
  },
  finishCapture: (session) => {
    const state = get();
    if (!state.activeCapture || state.activeCapture.sessionId !== session.id) return null;
    const summary = createSleepSignalSummary(state.activeCapture, session);
    const entries = Object.entries({ ...state.history, [session.id]: summary })
      .sort(([, first], [, second]) => second.endedAt.localeCompare(first.endedAt))
      .slice(0, 8);
    set({ activeCapture: null, history: Object.fromEntries(entries) });
    return summary;
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
  migrate: () => initialHardwareState,
}));
