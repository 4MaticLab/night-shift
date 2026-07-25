import type { SleepQuality } from "@/src/lib/game-engine/schema";

export type SleepHardwareMode = "off" | "virtual" | "bridge";
export type VirtualDeviceId = "night-ring" | "watch-17" | "under-mattress" | "quiet-pillow";
export type SleepBridgeId = "apple-health" | "health-connect" | "oura-cloud" | "fitbit-web";
export type NativeSleepBridgeId = Extract<SleepBridgeId, "apple-health" | "health-connect">;
export type SleepSourceId = VirtualDeviceId | NativeSleepBridgeId;
export type SleepSourceKind = "virtual" | "native";
export type SleepPermissionId = "sleep-window" | "sleep-stages" | "heart-rate" | "movement" | "respiration";

export interface VirtualSleepDevice {
  id: VirtualDeviceId;
  kind: "ring" | "watch" | "mattress" | "pillow";
  name: string;
  archiveName: string;
  shortDescription: string;
  fieldNote: string;
  assetId: string;
  permissions: SleepPermissionId[];
  confidence: number;
}

export interface SleepBridge {
  id: SleepBridgeId;
  name: string;
  ecosystem: string;
  note: string;
  permissions: SleepPermissionId[];
}

export interface SleepHardwareConsent {
  sourceId: SleepSourceId;
  sourceKind: SleepSourceKind;
  permissions: SleepPermissionId[];
  grantedAt: string;
  localOnly: true;
}

export interface ActiveSleepCapture {
  sessionId: string;
  sourceId: SleepSourceId;
  sourceKind: SleepSourceKind;
  startedAt: string;
  quality: SleepQuality;
  permissions: SleepPermissionId[];
}

export interface SleepSignalSummary {
  sessionId: string;
  sourceId: SleepSourceId;
  sourceKind: SleepSourceKind;
  sourceName?: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  derivedQuality: SleepQuality;
  confidence: number;
  averageHeartRate?: number;
  hrvMs?: number;
  respirationRate?: number;
  restlessnessIndex?: number;
  deepSleepMinutes?: number;
  wakeEvents?: number;
  narrative: string;
}

export interface LiveSleepSignals {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  tertiaryLabel: string;
  tertiaryValue: string;
}
