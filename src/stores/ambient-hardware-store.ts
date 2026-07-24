"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  pairAmbientBridge,
  readAmbientBindings,
  readAmbientBridgeStatus,
  readAmbientEntities,
  restoreAmbientScene,
  sendAmbientCue,
  testAmbientEntity,
  writeAmbientBindings,
} from "@/src/lib/ambient-hardware/bridge-client";
import type {
  AmbientBindings,
  AmbientBridgeEvent,
  AmbientBridgeStatus,
  AmbientCue,
  AmbientEntity,
} from "@/src/lib/ambient-hardware/types";

export type AmbientConnectionState =
  | "idle"
  | "checking"
  | "unavailable"
  | "unpaired"
  | "connecting"
  | "offline"
  | "auth-error"
  | "online";

interface AmbientHardwareStore {
  enabled: boolean;
  connection: AmbientConnectionState;
  bridgeStatus: AmbientBridgeStatus | null;
  entities: Record<string, AmbientEntity>;
  bindings: AmbientBindings;
  lastError: string | null;
  setEnabled: (enabled: boolean) => void;
  checkBridge: () => Promise<boolean>;
  pair: (code: string) => Promise<boolean>;
  refreshEntities: () => Promise<boolean>;
  setBinding: (cue: AmbientCue, entityId: string | null) => Promise<boolean>;
  testEntity: (entityId: string) => Promise<boolean>;
  restore: () => Promise<boolean>;
  emitCue: (cue: AmbientCue, requestId: string) => Promise<boolean>;
  applyBridgeEvent: (event: AmbientBridgeEvent) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  enabled: false,
  connection: "idle" as AmbientConnectionState,
  bridgeStatus: null as AmbientBridgeStatus | null,
  entities: {} as Record<string, AmbientEntity>,
  bindings: {} as AmbientBindings,
  lastError: null as string | null,
};

function connectionFromStatus(status: AmbientBridgeStatus): AmbientConnectionState {
  if (!status.paired) return "unpaired";
  return status.homeAssistant === "disabled" ? "offline" : status.homeAssistant;
}

export const useAmbientHardwareStore = create<AmbientHardwareStore>()(persist((set, get) => ({
  ...initialState,
  setEnabled: (enabled) => set({ enabled }),
  checkBridge: async () => {
    set({ connection: "checking", lastError: null });
    try {
      const status = await readAmbientBridgeStatus();
      set({ bridgeStatus: status, connection: connectionFromStatus(status) });
      if (!status.paired) return false;
      if (status.homeAssistant === "disabled") return false;
      await get().refreshEntities();
      const localBindings = get().bindings;
      const remoteBindings = await readAmbientBindings();
      if (Object.keys(localBindings).length) {
        const bindings = await writeAmbientBindings(localBindings);
        set({ bindings });
      } else {
        set({ bindings: remoteBindings });
      }
      return status.homeAssistant === "online";
    } catch (error) {
      set({
        connection: "unavailable",
        bridgeStatus: null,
        entities: {},
        lastError: message(error),
      });
      return false;
    }
  },
  pair: async (code) => {
    set({ lastError: null });
    try {
      await pairAmbientBridge(code);
      return await get().checkBridge();
    } catch (error) {
      set({ connection: "unpaired", lastError: message(error) });
      return false;
    }
  },
  refreshEntities: async () => {
    try {
      const entities = await readAmbientEntities();
      set({
        entities: Object.fromEntries(entities.map((entity) => [entity.id, entity])),
        lastError: null,
      });
      return true;
    } catch (error) {
      set({ lastError: message(error) });
      return false;
    }
  },
  setBinding: async (cue, entityId) => {
    const next = { ...get().bindings, [cue]: entityId };
    set({ lastError: null });
    try {
      const bindings = await writeAmbientBindings(next);
      set({ bindings });
      return true;
    } catch (error) {
      set({ lastError: message(error) });
      return false;
    }
  },
  testEntity: async (entityId) => {
    set({ lastError: null });
    try {
      await testAmbientEntity(entityId);
      return true;
    } catch (error) {
      set({ lastError: message(error) });
      return false;
    }
  },
  restore: async () => {
    set({ lastError: null });
    try {
      await restoreAmbientScene();
      return true;
    } catch (error) {
      set({ lastError: message(error) });
      return false;
    }
  },
  emitCue: async (cue, requestId) => {
    const state = get();
    if (!state.enabled || state.connection !== "online" || !state.bindings[cue]) return false;
    try {
      await sendAmbientCue({ cue, requestId });
      return true;
    } catch (error) {
      set({ connection: "offline", lastError: message(error) });
      return false;
    }
  },
  applyBridgeEvent: (event) => {
    if (event.type === "status") {
      set({
        bridgeStatus: event.status,
        connection: connectionFromStatus(event.status),
        lastError: event.status.lastError ?? null,
      });
      return;
    }
    if (event.type === "bindings") {
      set({ bindings: event.bindings });
      return;
    }
    set((state) => ({
      entities: { ...state.entities, [event.entity.id]: event.entity },
    }));
  },
  clearError: () => set({ lastError: null }),
  reset: () => {
    set(initialState);
  },
}), {
  name: "night-shift-ambient-hardware-v1",
  version: 1,
  partialize: ({ enabled, bindings }) => ({ enabled, bindings }),
}));

function message(error: unknown): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "本地桥响应超时。";
  }
  return error instanceof Error ? error.message : "本地桥请求失败。";
}
