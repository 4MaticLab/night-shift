import type { SleepMode, SleepQuality, SleepSession } from "@/src/lib/game-engine/schema";

export type SandboxOriginId = string;
export type SandboxRisk = "quiet" | "exposed" | "dangerous" | "terminal";
export type SandboxNpcState = "unknown" | "wary" | "helpful" | "hostile" | "rescued" | "lost" | "transformed";
export type SandboxPhase = "day" | "night" | "morning";

export interface SandboxOrigin {
  id: SandboxOriginId;
  title: string;
  subtitle: string;
  briefing: string;
  objective: string;
  startingLocationIds: string[];
  startingItemIds: string[];
  startingClueIds: string[];
  trait: string;
}

export interface SandboxClue {
  id: string;
  title: string;
  category: "testimony" | "document" | "place" | "substance" | "contradiction";
  summary: string;
  detail: string;
  relatedIds: string[];
}

export interface SandboxHandout {
  id: string;
  number: number;
  title: string;
  source: string;
  summary: string;
  archiveText: string[];
}

export interface SandboxItem {
  id: string;
  name: string;
  description: string;
}

export interface SandboxNpc {
  id: string;
  assetId?: string;
  name: string;
  role: string;
  faction: string;
  publicFace: string;
  privateDrive: string;
}

export interface SandboxRequirement {
  origins?: SandboxOriginId[];
  allClueIds?: string[];
  anyClueIds?: string[];
  allItemIds?: string[];
  allActionIds?: string[];
  anyActionIds?: string[];
  noneActionIds?: string[];
  minThreat?: number;
  maxThreat?: number;
}

export interface SandboxNpcEffect {
  npcId: string;
  state: SandboxNpcState;
}

export interface SandboxActionEffects {
  clueIds?: string[];
  handoutIds?: string[];
  itemIds?: string[];
  unlockLocationIds?: string[];
  corruption?: number;
  threat?: number;
  npc?: SandboxNpcEffect[];
}

export interface SandboxAction {
  id: string;
  title: string;
  intent: string;
  risk: SandboxRisk;
  requirementHint?: string;
  requires?: SandboxRequirement;
  scene: string;
  result: string;
  reducedResult?: string;
  effects: SandboxActionEffects;
}

export interface SandboxLocation {
  id: string;
  assetId?: string;
  order: number;
  name: string;
  archiveName: string;
  subtitle: string;
  atmosphere: string;
  coordinates: { x: number; y: number };
  actions: SandboxAction[];
}

export interface SandboxEnding {
  id: string;
  title: string;
  archiveLabel: string;
  theme: string;
  terminal?: boolean;
  requires: SandboxRequirement;
  result: string;
  coda: string;
}

export interface SandboxCorruptionStage {
  stage: number;
  name: string;
  benefit: string;
  cost: string;
}

export interface SandboxCredits {
  attribution: string;
  adaptation: string;
  usage: string;
  notice: string;
}

export interface SandboxPresentation {
  caseNumber: string;
  caseTypeLabel: string;
  loadingTitle: string;
  entryEyebrow: string;
  entryCta: string;
  navigationLabel: string;
  mapTitle: string;
  mapDescription: string;
  mapAriaLabel: string;
  mapCaption: string;
  conditionLabel: string;
  conditionAdvanceHint: string;
  threatLabel: string;
  handoffModeLabel: string;
  sleepEthic: string;
  nightTitle: string;
  nightClosingLine: string;
  morningTitle: string;
  noNewEvidence: string;
  noEndingTitle: string;
  noEndingDescription: string;
  resetTitle: string;
  resetDescription: string;
  endingEyebrow: string;
  handoutKicker: string;
  handoutFooter: string;
  briefingHeading: string;
  creditsHeading: string;
  heroAssetId?: string;
  npcStateLabels: Record<SandboxNpcState, string>;
}

export interface SandboxCampaignContent {
  title: string;
  englishTitle: string;
  year: string;
  place: string;
  premise: string;
  contentWarnings: string[];
  origins: SandboxOrigin[];
  locations: SandboxLocation[];
  clues: SandboxClue[];
  handouts: SandboxHandout[];
  items: SandboxItem[];
  npcs: SandboxNpc[];
  corruptionStages: SandboxCorruptionStage[];
  endings: SandboxEnding[];
  presentation: SandboxPresentation;
  credits: SandboxCredits;
}

export interface SandboxLogEntry {
  id: string;
  actionId: string;
  locationId: string;
  title: string;
  result: string;
  corruptionDelta: number;
  threatDelta: number;
}

export interface SandboxExpeditionReport {
  actionId: string;
  locationId: string;
  entryId: string;
  carriedItemId?: string;
  session: SleepSession;
  clueIds: string[];
  handoutIds: string[];
  itemIds: string[];
  unlockedLocationIds: string[];
  npcEffects: SandboxNpcEffect[];
  corruptionDelta: number;
  threatDelta: number;
}

export interface SandboxProgress {
  started: boolean;
  originId?: SandboxOriginId;
  phase: SandboxPhase;
  unlockedLocationIds: string[];
  visitedLocationIds: string[];
  completedActionIds: string[];
  clueIds: string[];
  handoutIds: string[];
  itemIds: string[];
  corruption: number;
  threat: number;
  npcStates: Record<string, SandboxNpcState>;
  log: SandboxLogEntry[];
  endingId?: string;
  reducedHorror: boolean;
  pendingActionId?: string;
  selectedItemId?: string;
  sleepMode: SleepMode;
  selectedQuality: SleepQuality;
  activeSleepSession?: SleepSession;
  latestReport?: SandboxExpeditionReport;
}

export interface SandboxResolution {
  ok: boolean;
  reason?: string;
  progress: SandboxProgress;
  entry?: SandboxLogEntry;
}
