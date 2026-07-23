"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardPositionSchema, cityWatchIdSchema, correspondenceRecordSchema, nightGrowthRecordSchema, opportunityRecordSchema, sleepModeSchema, sleepQualitySchema, wakeEchoIdSchema, wakeEchoRecordSchema, type BoardPosition, type CorrespondenceRecord, type NightGrowthRecord, type OpportunityRecord, type SleepMode, type SleepQuality, type SleepSession, type SocietyMemoryRecord, type SouvenirRecord } from "@/src/lib/game-engine/schema";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import { preparations, type PreparationId } from "@/src/content/preparations";
import { finishSleepSession, recordWakeEcho, startSleepSession } from "@/src/lib/game-engine/sleep-session";
import { canChooseEnding, type EndingId } from "@/src/lib/game-engine/ending";
import { createSocietyMemory } from "@/src/content/societies";
import { createCorrespondenceRecord, getCorrespondencePrompt } from "@/src/content/correspondence";
import { createSouvenirRecord, DEMO_JOURNEY_SEED } from "@/src/content/souvenirs";
import { createOpportunityRecord, getOpportunityCandidates } from "@/src/content/opportunities";
import { DEMO_CITY_WATCH_ID, getCityWatchId } from "@/src/content/watches";
import { DEFAULT_CAMPAIGN_ID, getCampaign, isCampaignId, type CampaignId } from "@/src/content/campaigns/registry";
import { getCampaignRouteDirection, getCampaignWakeEcho, matchCampaignEvidenceRelation, type CampaignManifest } from "@/src/content/campaigns/types";
import { useSleepHardwareStore } from "@/src/stores/sleep-hardware-store";

export type Phase = "day" | "ready" | "night" | "morning" | "ending";

export interface GameState {
  campaignId: CampaignId;
  campaignSaves: Partial<Record<CampaignId, CampaignProgress>>;
  started: boolean;
  chapter: number;
  phase: Phase;
  selectedChoice: string;
  selectedPreparationId: PreparationId | "";
  quality: SleepQuality;
  sleepMode: SleepMode;
  activeSleepSession: SleepSession | null;
  lastSleepSession: SleepSession | null;
  preparationHistory: Partial<Record<number, PreparationId>>;
  choiceHistory: Partial<Record<number, string>>;
  growthHistory: Partial<Record<number, NightGrowthRecord>>;
  societyHistory: Partial<Record<number, SocietyMemoryRecord>>;
  correspondenceHistory: Partial<Record<number, CorrespondenceRecord>>;
  journeySeed: number;
  souvenirHistory: Partial<Record<number, SouvenirRecord>>;
  opportunityHistory: Partial<Record<number, OpportunityRecord>>;
  unlockedClueIds: string[];
  receivedClueIds: string[];
  unlockedCollectibleIds: string[];
  completedReports: number[];
  confirmedRelations: string[];
  boardPositions: Record<string, BoardPosition>;
  nightSealIds: number[];
  endingId?: string;
  begin: () => void;
  selectChoice: (choice: string) => void;
  startNight: (quality: SleepQuality, preparationId: PreparationId, mode: SleepMode) => void;
  finishNight: () => void;
  recordWakeEcho: () => boolean;
  answerCorrespondence: (chapter: number, replyId: string) => boolean;
  resolveOpportunity: (noticeId: string, responseId: string) => boolean;
  dismissOpportunities: () => boolean;
  continueDay: () => void;
  connectClues: (firstClueId: string, secondClueId: string) => string | null;
  receiveSharedClue: (clueId: string) => "received" | "already-received" | "already-owned" | "invalid";
  switchCampaign: (campaignId: CampaignId) => boolean;
  setBoardPosition: (clueId: string, position: BoardPosition) => boolean;
  resetBoardPositions: () => void;
  jumpToChapter: (chapter: number) => void;
  unlockBoard: (confirmRelations?: boolean) => void;
  chooseEnding: (endingId: EndingId) => void;
  reset: () => void;
}

export type CampaignProgress = Pick<GameState,
  "started" | "chapter" | "phase" | "selectedChoice" | "selectedPreparationId" | "quality" | "sleepMode"
  | "activeSleepSession" | "lastSleepSession" | "preparationHistory" | "choiceHistory" | "growthHistory"
  | "societyHistory" | "correspondenceHistory" | "journeySeed" | "souvenirHistory" | "opportunityHistory"
  | "unlockedClueIds" | "receivedClueIds" | "unlockedCollectibleIds" | "completedReports"
  | "confirmedRelations" | "boardPositions" | "nightSealIds" | "endingId"
>;

const initialProgress: CampaignProgress = {
  started: false,
  chapter: 1,
  phase: "day" as Phase,
  selectedChoice: "",
  selectedPreparationId: "" as const,
  quality: "regular" as SleepQuality,
  sleepMode: "demo" as SleepMode,
  activeSleepSession: null as SleepSession | null,
  lastSleepSession: null as SleepSession | null,
  preparationHistory: {} as Partial<Record<number, PreparationId>>,
  choiceHistory: {} as Partial<Record<number, string>>,
  growthHistory: {} as Partial<Record<number, NightGrowthRecord>>,
  societyHistory: {} as Partial<Record<number, SocietyMemoryRecord>>,
  correspondenceHistory: {} as Partial<Record<number, CorrespondenceRecord>>,
  journeySeed: 0,
  souvenirHistory: {} as Partial<Record<number, SouvenirRecord>>,
  opportunityHistory: {} as Partial<Record<number, OpportunityRecord>>,
  unlockedClueIds: [] as string[],
  receivedClueIds: [] as string[],
  unlockedCollectibleIds: [] as string[],
  completedReports: [] as number[],
  confirmedRelations: [] as string[],
  boardPositions: {} as Record<string, BoardPosition>,
  nightSealIds: [] as number[],
};

const initial: Pick<GameState, "campaignId" | "campaignSaves"> & CampaignProgress = {
  campaignId: DEFAULT_CAMPAIGN_ID,
  campaignSaves: {} as Partial<Record<CampaignId, CampaignProgress>>,
  ...initialProgress,
};

function createInitialProgress(): CampaignProgress {
  return {
    ...initialProgress,
    preparationHistory: {},
    choiceHistory: {},
    growthHistory: {},
    societyHistory: {},
    correspondenceHistory: {},
    souvenirHistory: {},
    opportunityHistory: {},
    unlockedClueIds: [],
    receivedClueIds: [],
    unlockedCollectibleIds: [],
    completedReports: [],
    confirmedRelations: [],
    boardPositions: {},
    nightSealIds: [],
    endingId: undefined,
  };
}

function snapshotCampaignProgress(state: GameState): CampaignProgress {
  return {
    started: state.started,
    chapter: state.chapter,
    phase: state.phase,
    selectedChoice: state.selectedChoice,
    selectedPreparationId: state.selectedPreparationId,
    quality: state.quality,
    sleepMode: state.sleepMode,
    activeSleepSession: state.activeSleepSession,
    lastSleepSession: state.lastSleepSession,
    preparationHistory: state.preparationHistory,
    choiceHistory: state.choiceHistory,
    growthHistory: state.growthHistory,
    societyHistory: state.societyHistory,
    correspondenceHistory: state.correspondenceHistory,
    journeySeed: state.journeySeed,
    souvenirHistory: state.souvenirHistory,
    opportunityHistory: state.opportunityHistory,
    unlockedClueIds: state.unlockedClueIds,
    receivedClueIds: state.receivedClueIds,
    unlockedCollectibleIds: state.unlockedCollectibleIds,
    completedReports: state.completedReports,
    confirmedRelations: state.confirmedRelations,
    boardPositions: state.boardPositions,
    nightSealIds: state.nightSealIds,
    endingId: state.endingId,
  };
}

export const useGameStore = create<GameState>()(persist((set, get) => ({
  ...initial,
  begin: () => set({ started: true, phase: "day" }),
  selectChoice: (selectedChoice) => set({ selectedChoice, phase: "ready" }),
  startNight: (quality, selectedPreparationId, sleepMode) => {
    const state = get();
    const campaign = getCampaign(state.campaignId);
    const session = startSleepSession(sleepMode, quality);
    const activeSleepSession = sleepMode === "demo" && quality === "interrupted"
      ? recordWakeEcho(session, getCampaignWakeEcho(campaign, state.chapter).id, new Date(session.startedAt))
      : session;
    useSleepHardwareStore.getState().beginCapture(activeSleepSession);
    set({
      quality,
      selectedPreparationId,
      sleepMode,
      journeySeed: state.journeySeed || (sleepMode === "demo" ? DEMO_JOURNEY_SEED : createJourneySeed()),
      activeSleepSession,
      phase: "night",
    });
  },
  recordWakeEcho: () => {
    const state = get();
    if (state.phase !== "night" || state.activeSleepSession?.mode !== "real" || state.activeSleepSession.wakeEcho) return false;
    const campaign = getCampaign(state.campaignId);
    set({ activeSleepSession: recordWakeEcho(state.activeSleepSession, getCampaignWakeEcho(campaign, state.chapter).id) });
    return true;
  },
  finishNight: () => {
    const state = get();
    const campaign = getCampaign(state.campaignId);
    const activeSession = state.activeSleepSession ?? startSleepSession(state.sleepMode, state.quality);
    const completedSession = finishSleepSession(activeSession);
    useSleepHardwareStore.getState().finishCapture(completedSession);
    const result = resolveNight(campaign, state.chapter, completedSession.quality, state.selectedPreparationId, state.selectedChoice);
    const completedAt = completedSession.endedAt ?? new Date().toISOString();
    const societyMemory = createSocietyMemory(state.chapter, result.choiceId, state.societyHistory, completedAt, result.direction);
    const preparationId = state.selectedPreparationId || "side-lamp";
    const journeySeed = state.journeySeed || (state.sleepMode === "demo" ? DEMO_JOURNEY_SEED : createJourneySeed());
    const souvenirRecord = createSouvenirRecord(state.chapter, result.choiceId, preparationId, journeySeed, state.souvenirHistory, completedAt, result.direction.societyId);
    set({
      phase: "morning",
      quality: completedSession.quality,
      activeSleepSession: null,
      lastSleepSession: completedSession,
      preparationHistory: {
        ...state.preparationHistory,
        [state.chapter]: preparationId,
      },
      choiceHistory: {
        ...state.choiceHistory,
        [state.chapter]: result.choiceId,
      },
      growthHistory: {
        ...state.growthHistory,
        [state.chapter]: nightGrowthRecordSchema.parse({
          chapter: state.chapter,
          quality: completedSession.quality,
          durationMinutes: completedSession.durationMinutes ?? 0,
          choiceId: result.choiceId,
          preparationId,
          watchId: completedSession.watchId,
          wakeEchoId: completedSession.wakeEcho?.echoId,
          completedAt,
        }),
      },
      societyHistory: {
        ...state.societyHistory,
        [state.chapter]: societyMemory,
      },
      journeySeed,
      souvenirHistory: {
        ...state.souvenirHistory,
        [state.chapter]: souvenirRecord,
      },
      unlockedClueIds: Array.from(new Set([...state.unlockedClueIds, ...result.clueIds])),
      receivedClueIds: state.receivedClueIds.filter((clueId) => !result.clueIds.includes(clueId)),
      unlockedCollectibleIds: Array.from(new Set([...state.unlockedCollectibleIds, ...result.collectibleIds])),
      completedReports: Array.from(new Set([...state.completedReports, state.chapter])),
      nightSealIds: Array.from(new Set([...state.nightSealIds, state.chapter])),
    });
  },
  answerCorrespondence: (chapter, replyId) => {
    const state = get();
    if (state.correspondenceHistory[chapter]) return false;
    const memory = state.societyHistory[chapter];
    if (!memory) return false;
    try {
      const record = createCorrespondenceRecord(memory, replyId, new Date().toISOString());
      set({ correspondenceHistory: { ...state.correspondenceHistory, [chapter]: record } });
      return true;
    } catch {
      return false;
    }
  },
  resolveOpportunity: (noticeId, responseId) => {
    const state = get();
    if (state.chapter < 2 || state.opportunityHistory[state.chapter]) return false;
    try {
      const record = createOpportunityRecord(state.chapter, state.journeySeed || DEMO_JOURNEY_SEED, state.opportunityHistory, noticeId, responseId, new Date().toISOString());
      set({ opportunityHistory: { ...state.opportunityHistory, [state.chapter]: record } });
      return true;
    } catch {
      return false;
    }
  },
  dismissOpportunities: () => {
    const state = get();
    if (state.chapter < 2 || state.opportunityHistory[state.chapter]) return false;
    try {
      const record = createOpportunityRecord(state.chapter, state.journeySeed || DEMO_JOURNEY_SEED, state.opportunityHistory, undefined, undefined, new Date().toISOString());
      set({ opportunityHistory: { ...state.opportunityHistory, [state.chapter]: record } });
      return true;
    } catch {
      return false;
    }
  },
  continueDay: () => {
    const state = get();
    const finalChapter = getCampaign(state.campaignId).case.chapters.at(-1)?.number ?? 1;
    if (state.chapter >= finalChapter) set({ phase: "ending" });
    else set({ chapter: state.chapter + 1, phase: "day", selectedChoice: "", selectedPreparationId: "" });
  },
  connectClues: (firstClueId, secondClueId) => {
    const state = get();
    if (!state.unlockedClueIds.includes(firstClueId) || !state.unlockedClueIds.includes(secondClueId)) return null;
    const relation = matchCampaignEvidenceRelation(getCampaign(state.campaignId), firstClueId, secondClueId);
    if (!relation) return null;
    set({ confirmedRelations: Array.from(new Set([...state.confirmedRelations, relation.id])) });
    return relation.id;
  },
  receiveSharedClue: (clueId) => {
    const clue = getCampaign(get().campaignId).case.clues.find((item) => item.id === clueId);
    if (!clue) return "invalid";
    const state = get();
    if (state.receivedClueIds.includes(clue.id)) return "already-received";
    if (state.unlockedClueIds.includes(clue.id)) return "already-owned";
    set({
      started: true,
      unlockedClueIds: [...state.unlockedClueIds, clue.id],
      receivedClueIds: [...state.receivedClueIds, clue.id],
    });
    return "received";
  },
  switchCampaign: (campaignId) => {
    if (!isCampaignId(campaignId)) return false;
    const state = get();
    if (state.campaignId === campaignId) return true;
    const campaignSaves = {
      ...state.campaignSaves,
      [state.campaignId]: snapshotCampaignProgress(state),
    };
    const restored = campaignSaves[campaignId] ?? createInitialProgress();
    set({
      ...createInitialProgress(),
      ...restored,
      campaignId,
      campaignSaves,
    });
    return true;
  },
  setBoardPosition: (clueId, position) => {
    const state = get();
    const parsed = boardPositionSchema.safeParse(position);
    if (!parsed.success || !state.unlockedClueIds.includes(clueId)) return false;
    set({ boardPositions: { ...state.boardPositions, [clueId]: parsed.data } });
    return true;
  },
  resetBoardPositions: () => set({ boardPositions: {} }),
  jumpToChapter: (chapter) => {
    const campaign = getCampaign(get().campaignId);
    if (!campaign.case.chapters.some((item) => item.number === chapter)) return;
    const priorChapters = Array.from({ length: Math.max(0, chapter - 1) }, (_, index) => index + 1);
    const preparationHistory = Object.fromEntries(priorChapters.map((number) => [number, "side-lamp" as PreparationId]));
    const choiceHistory = Object.fromEntries(priorChapters.map((number) => [number, getCampaignRouteDirection(campaign, number).choiceId]));
    const growthHistory = createLegacyGrowthHistory(campaign, priorChapters, preparationHistory, choiceHistory);
    const societyHistory = createLegacySocietyHistory(campaign, priorChapters, choiceHistory, growthHistory);
    const state = get();
    set({ ...createInitialProgress(), campaignId: state.campaignId, campaignSaves: state.campaignSaves, started: true, chapter, phase: "day", journeySeed: DEMO_JOURNEY_SEED, souvenirHistory: createLegacySouvenirHistory(campaign, priorChapters, preparationHistory, choiceHistory, DEMO_JOURNEY_SEED, growthHistory), opportunityHistory: createDemoOpportunityHistory(priorChapters, DEMO_JOURNEY_SEED), nightSealIds: priorChapters, completedReports: priorChapters, preparationHistory, choiceHistory, growthHistory, societyHistory, correspondenceHistory: createDemoCorrespondenceHistory(priorChapters, societyHistory), unlockedClueIds: campaign.case.clues.filter((clue) => clue.chapter < chapter).map((clue) => clue.id), unlockedCollectibleIds: campaign.case.collectibles.filter((item) => item.chapter < chapter).map((item) => item.id) });
  },
  unlockBoard: (confirmRelations = false) => {
    const campaign = getCampaign(get().campaignId);
    set({ unlockedClueIds: campaign.case.clues.map((clue) => clue.id), receivedClueIds: [], unlockedCollectibleIds: campaign.case.collectibles.map((item) => item.id), confirmedRelations: confirmRelations ? campaign.relations.map((relation) => relation.id) : [] });
  },
  chooseEnding: (endingId) => {
    const state = get();
    const campaign = getCampaign(state.campaignId);
    const earnedClueIds = state.unlockedClueIds.filter((clueId) => !state.receivedClueIds.includes(clueId));
    if (canChooseEnding(endingId, { ...state, unlockedClueIds: earnedClueIds }, campaign.rules)) set({ endingId, phase: "ending" });
  },
  reset: () => {
    const state = get();
    set({ ...createInitialProgress(), campaignId: state.campaignId, campaignSaves: state.campaignSaves, endingId: undefined });
  },
}), {
  name: "night-shift-save-v1",
  version: 14,
  migrate: migrateGameState,
}));

export function migrateGameState(persistedState: unknown): GameState {
  const persisted = persistedState && typeof persistedState === "object" ? persistedState as Partial<GameState> : {};
  const campaignId = isCampaignId(persisted.campaignId) ? persisted.campaignId : DEFAULT_CAMPAIGN_ID;
  const campaign = getCampaign(campaignId);
  const activeProgress = migrateCampaignProgress(persisted, campaign);
  const rawSaves = persisted.campaignSaves && typeof persisted.campaignSaves === "object" ? persisted.campaignSaves : {};
  const campaignSaves = Object.fromEntries(Object.entries(rawSaves).flatMap(([savedId, progress]) => {
    if (!isCampaignId(savedId)) return [];
    return [[savedId, migrateCampaignProgress(progress, getCampaign(savedId))]];
  })) as Partial<Record<CampaignId, CampaignProgress>>;
  return {
    ...persisted,
    ...activeProgress,
    campaignId,
    campaignSaves,
  } as GameState;
}

function migrateCampaignProgress(value: unknown, campaign: CampaignManifest): CampaignProgress {
  const persisted = value && typeof value === "object" ? value as Partial<CampaignProgress> : {};
  const validChapters = new Set(campaign.case.chapters.map((chapter) => chapter.number));
  const validClueIds = new Set(campaign.case.clues.map((clue) => clue.id));
  const validCollectibleIds = new Set(campaign.case.collectibles.map((item) => item.id));
  const validRelationIds = new Set(campaign.relations.map((relation) => relation.id));
  const completedReports = Array.from(new Set((persisted.completedReports ?? []).filter((chapter) => validChapters.has(chapter))));
  const preparationHistory = sanitizePreparationHistory(persisted.preparationHistory, validChapters);
  const choiceHistory = sanitizeChoiceHistory(persisted.choiceHistory, campaign);
  const growthHistory = migrateGrowthHistory(campaign, persisted.growthHistory, completedReports, preparationHistory, choiceHistory);
  const journeySeed = persisted.journeySeed || DEMO_JOURNEY_SEED;
  const receivedClueIds = sanitizeReceivedClueIds(persisted.receivedClueIds, campaign);
  const unlockedClueIds = Array.from(new Set([
    ...(persisted.unlockedClueIds ?? []).filter((clueId) => validClueIds.has(clueId)),
    ...receivedClueIds,
  ]));
  const chapter = validChapters.has(persisted.chapter ?? 1) ? persisted.chapter ?? 1 : campaign.case.chapters[0].number;
  const selectedChoice = campaign.case.chapters.find((item) => item.number === chapter)?.choices.some((choice) => choice.id === persisted.selectedChoice)
    ? persisted.selectedChoice ?? ""
    : "";
  const selectedPreparationId = preparations.some((item) => item.id === persisted.selectedPreparationId)
    ? persisted.selectedPreparationId ?? ""
    : "";
  const societyHistory = createLegacySocietyHistory(campaign, completedReports, choiceHistory, growthHistory);
  return {
    ...createInitialProgress(),
    ...persisted,
    chapter,
    selectedChoice,
    selectedPreparationId,
    quality: sleepQualitySchema.safeParse(persisted.quality).success ? persisted.quality! : "regular",
    sleepMode: sleepModeSchema.safeParse(persisted.sleepMode).success ? persisted.sleepMode! : "demo",
    activeSleepSession: migrateSleepSession(persisted.activeSleepSession),
    lastSleepSession: migrateSleepSession(persisted.lastSleepSession),
    preparationHistory,
    choiceHistory,
    completedReports,
    growthHistory,
    societyHistory,
    correspondenceHistory: sanitizeCorrespondenceHistory(persisted.correspondenceHistory, societyHistory),
    journeySeed,
    souvenirHistory: createLegacySouvenirHistory(campaign, completedReports, preparationHistory, choiceHistory, journeySeed, growthHistory),
    opportunityHistory: sanitizeOpportunityHistory(persisted.opportunityHistory, validChapters),
    unlockedClueIds,
    receivedClueIds,
    unlockedCollectibleIds: (persisted.unlockedCollectibleIds ?? []).filter((itemId) => validCollectibleIds.has(itemId)),
    confirmedRelations: (persisted.confirmedRelations ?? []).filter((relationId) => validRelationIds.has(relationId)),
    boardPositions: sanitizeBoardPositions(persisted.boardPositions, validClueIds),
    nightSealIds: (persisted.nightSealIds ?? []).filter((item) => validChapters.has(item)),
    endingId: campaign.endings.some((ending) => ending.id === persisted.endingId) ? persisted.endingId : undefined,
  };
}

function sanitizePreparationHistory(value: unknown, validChapters: Set<number>): Partial<Record<number, PreparationId>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const validIds = new Set(preparations.map((item) => item.id));
  return Object.fromEntries(Object.entries(value).flatMap(([rawChapter, preparationId]) => {
    const chapter = Number(rawChapter);
    return validChapters.has(chapter) && typeof preparationId === "string" && validIds.has(preparationId as PreparationId)
      ? [[chapter, preparationId as PreparationId]]
      : [];
  }));
}

function sanitizeChoiceHistory(value: unknown, campaign: CampaignManifest): Partial<Record<number, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([rawChapter, choiceId]) => {
    const chapter = Number(rawChapter);
    const chapterContent = campaign.case.chapters.find((item) => item.number === chapter);
    return chapterContent && typeof choiceId === "string" && chapterContent.choices.some((choice) => choice.id === choiceId)
      ? [[chapter, choiceId]]
      : [];
  }));
}

function sanitizeCorrespondenceHistory(value: unknown, societyHistory: Partial<Record<number, SocietyMemoryRecord>>): Partial<Record<number, CorrespondenceRecord>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([rawChapter, candidate]) => {
    const chapter = Number(rawChapter);
    const memory = societyHistory[chapter];
    const parsed = correspondenceRecordSchema.safeParse(candidate);
    if (!memory || !parsed.success || parsed.data.chapter !== chapter || parsed.data.societyId !== memory.societyId || parsed.data.standing !== memory.standing) return [];
    const prompt = getCorrespondencePrompt(memory);
    return parsed.data.promptId === prompt.id && prompt.replies.some((reply) => reply.id === parsed.data.replyId)
      ? [[chapter, parsed.data]]
      : [];
  }));
}

function sanitizeOpportunityHistory(value: unknown, validChapters: Set<number>): Partial<Record<number, OpportunityRecord>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([rawChapter, candidate]) => {
    const chapter = Number(rawChapter);
    const parsed = opportunityRecordSchema.safeParse(candidate);
    return validChapters.has(chapter) && chapter >= 2 && parsed.success && parsed.data.chapter === chapter
      ? [[chapter, parsed.data]]
      : [];
  }));
}

function sanitizeReceivedClueIds(value: unknown, campaign: CampaignManifest): string[] {
  if (!Array.isArray(value)) return [];
  const validIds = new Set(campaign.case.clues.map((clue) => clue.id));
  return Array.from(new Set(value.filter((clueId): clueId is string => typeof clueId === "string" && validIds.has(clueId))));
}

function sanitizeBoardPositions(value: unknown, validClueIds?: Set<string>): Record<string, BoardPosition> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([clueId, position]) => {
    const parsed = boardPositionSchema.safeParse(position);
    return parsed.success && (!validClueIds || validClueIds.has(clueId)) ? [[clueId, parsed.data]] : [];
  }));
}

function migrateSleepSession(session: SleepSession | null | undefined): SleepSession | null {
  if (!session) return null;
  const legacy = session as SleepSession & { watchId?: unknown };
  const parsedWatch = cityWatchIdSchema.safeParse(legacy.watchId);
  const startedAt = new Date(legacy.startedAt);
  const wakeEcho = wakeEchoRecordSchema.safeParse(legacy.wakeEcho);
  const watchId = parsedWatch.success
    ? parsedWatch.data
    : legacy.mode === "demo" || Number.isNaN(startedAt.getTime())
      ? DEMO_CITY_WATCH_ID
      : getCityWatchId(startedAt);
  return { ...legacy, watchId, wakeEcho: wakeEcho.success ? wakeEcho.data : undefined };
}

function migrateGrowthHistory(
  campaign: CampaignManifest,
  value: Partial<Record<number, NightGrowthRecord>> | undefined,
  completedReports: number[],
  preparationHistory: Partial<Record<number, PreparationId>>,
  choiceHistory: Partial<Record<number, string>>,
): Partial<Record<number, NightGrowthRecord>> {
  const source = {
    ...createLegacyGrowthHistory(campaign, completedReports, preparationHistory, choiceHistory),
    ...(value ?? {}),
  };
  const validChapters = new Set(campaign.case.chapters.map((chapter) => chapter.number));
  const validPreparationIds = new Set(preparations.map((item) => item.id));
  return Object.fromEntries(Object.entries(source).flatMap(([chapter, record]) => {
    const chapterNumber = Number(chapter);
    if (!record || !validChapters.has(chapterNumber)) return [];
    const legacy = record as NightGrowthRecord & { watchId?: unknown };
    const parsedWatch = cityWatchIdSchema.safeParse(legacy.watchId);
    const parsedWakeEcho = wakeEchoIdSchema.safeParse(legacy.wakeEchoId);
    const validWakeEcho = parsedWakeEcho.success && campaign.wakeEchoes.some((echo) => echo.id === parsedWakeEcho.data);
    const chapterContent = campaign.case.chapters.find((item) => item.number === chapterNumber)!;
    const choiceId = chapterContent.choices.some((choice) => choice.id === legacy.choiceId)
      ? legacy.choiceId
      : choiceHistory[chapterNumber] ?? chapterContent.choices[0].id;
    const preparationId = validPreparationIds.has(legacy.preparationId)
      ? legacy.preparationId
      : preparationHistory[chapterNumber] ?? "side-lamp";
    const parsed = nightGrowthRecordSchema.safeParse({
      ...legacy,
      chapter: chapterNumber,
      choiceId,
      preparationId,
      watchId: parsedWatch.success ? parsedWatch.data : DEMO_CITY_WATCH_ID,
      wakeEchoId: validWakeEcho ? parsedWakeEcho.data : undefined,
    });
    return parsed.success ? [[chapterNumber, parsed.data]] : [];
  }));
}

function createLegacyGrowthHistory(campaign: CampaignManifest, completedReports: number[], preparationHistory: Partial<Record<number, PreparationId>>, choiceHistory: Partial<Record<number, string>>): Partial<Record<number, NightGrowthRecord>> {
  return Object.fromEntries(completedReports.map((chapter) => [chapter, nightGrowthRecordSchema.parse({
    chapter,
    quality: "regular",
    durationMinutes: 390,
    choiceId: choiceHistory[chapter] ?? getCampaignRouteDirection(campaign, chapter).choiceId,
    preparationId: preparationHistory[chapter] ?? "side-lamp",
    watchId: DEMO_CITY_WATCH_ID,
    completedAt: `2026-07-${String(10 + chapter).padStart(2, "0")}T05:28:00.000Z`,
  })]));
}

function createLegacySocietyHistory(
  campaign: CampaignManifest,
  completedReports: number[],
  choiceHistory: Partial<Record<number, string>>,
  growthHistory: Partial<Record<number, NightGrowthRecord>>,
): Partial<Record<number, SocietyMemoryRecord>> {
  const history: Partial<Record<number, SocietyMemoryRecord>> = {};
  for (const chapter of [...completedReports].sort((a, b) => a - b)) {
    const direction = getCampaignRouteDirection(campaign, chapter, choiceHistory[chapter] ?? "");
    const choiceId = direction.choiceId;
    const completedAt = growthHistory[chapter]?.completedAt ?? `2026-07-${String(10 + chapter).padStart(2, "0")}T05:28:00.000Z`;
    history[chapter] = createSocietyMemory(chapter, choiceId, history, completedAt, direction);
  }
  return history;
}

function createDemoCorrespondenceHistory(
  completedReports: number[],
  societyHistory: Partial<Record<number, SocietyMemoryRecord>>,
): Partial<Record<number, CorrespondenceRecord>> {
  return Object.fromEntries(completedReports.flatMap((chapter) => {
    const memory = societyHistory[chapter];
    if (!memory) return [];
    const prompt = getCorrespondencePrompt(memory);
    return [[chapter, createCorrespondenceRecord(memory, prompt.replies[0].id, `2026-07-${String(10 + chapter).padStart(2, "0")}T06:02:00.000Z`)]];
  }));
}

function createLegacySouvenirHistory(
  campaign: CampaignManifest,
  completedReports: number[],
  preparationHistory: Partial<Record<number, PreparationId>>,
  choiceHistory: Partial<Record<number, string>>,
  journeySeed: number,
  growthHistory: Partial<Record<number, NightGrowthRecord>>,
): Partial<Record<number, SouvenirRecord>> {
  const history: Partial<Record<number, SouvenirRecord>> = {};
  for (const chapter of [...completedReports].sort((a, b) => a - b)) {
    const direction = getCampaignRouteDirection(campaign, chapter, choiceHistory[chapter] ?? "");
    const choiceId = direction.choiceId;
    const preparationId = preparationHistory[chapter] ?? "side-lamp";
    const foundAt = growthHistory[chapter]?.completedAt ?? `2026-07-${String(10 + chapter).padStart(2, "0")}T05:28:00.000Z`;
    history[chapter] = createSouvenirRecord(chapter, choiceId, preparationId, journeySeed, history, foundAt, direction.societyId);
  }
  return history;
}

function createJourneySeed(): number {
  const random = globalThis.crypto?.getRandomValues?.(new Uint32Array(1))[0];
  const seed = random && Number.isSafeInteger(random) ? random : Math.max(1, Date.now() % 4_294_967_295);
  return seed === DEMO_JOURNEY_SEED ? seed + 1 : seed;
}

function createDemoOpportunityHistory(completedReports: number[], journeySeed: number): Partial<Record<number, OpportunityRecord>> {
  const history: Partial<Record<number, OpportunityRecord>> = {};
  for (const chapter of completedReports.filter((number) => number >= 2).sort((a, b) => a - b)) {
    const notice = getOpportunityCandidates(chapter, journeySeed, history)[0];
    history[chapter] = createOpportunityRecord(chapter, journeySeed, history, notice.id, notice.responses[0].id, `2026-07-${String(10 + chapter).padStart(2, "0")}T13:00:00.000Z`);
  }
  return history;
}
