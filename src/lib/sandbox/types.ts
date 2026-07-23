export type SandboxOriginId = "university" | "bootlegger";
export type SandboxRisk = "quiet" | "exposed" | "dangerous" | "terminal";
export type SandboxNpcState = "unknown" | "wary" | "helpful" | "hostile" | "rescued" | "lost" | "transformed";

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

export interface SandboxLicense {
  originalAuthor: string;
  translator: string;
  adaptation: string;
  usage: string;
  notice: string;
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
  license: SandboxLicense;
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

export interface SandboxProgress {
  started: boolean;
  originId?: SandboxOriginId;
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
}

export interface SandboxResolution {
  ok: boolean;
  reason?: string;
  progress: SandboxProgress;
  entry?: SandboxLogEntry;
}
