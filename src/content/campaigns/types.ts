import type {
  CaseCharacter,
  CaseContent,
  CityDistrict,
  CityWatchEcho,
  EndingEpilogue,
  EvidenceRelation,
  JourneyPostcard,
  NightBotanical,
  RouteDirection,
  WakeEcho,
} from "@/src/lib/game-engine/schema";
import type { EndingId } from "@/src/lib/game-engine/ending";
import { assertSandboxCampaign } from "@/src/lib/sandbox/engine";
import type { SandboxCampaignContent } from "@/src/lib/sandbox/types";

export interface CampaignRules {
  trueEndingId: EndingId;
  requiredClueCount: number;
  requiredCollectibleCount: number;
  requiredRelationCount: number;
}

export interface CampaignPresentation {
  archiveNumber: string;
  teaser: string;
  description: string;
  cityName: string;
  detectiveName: string;
  heroAssetId: string;
  nightAssetId: string;
  morningAssetId: string;
  endingAssetId: string;
  nightSealAssetIds: string[];
  endingQuestion: string;
  endingPrompt: string;
  closingRefrain: string;
}

export interface CampaignManifest {
  id: string;
  version: number;
  format?: "linear-night" | "sandbox-expedition";
  sandbox?: SandboxCampaignContent;
  case: CaseContent;
  routes: RouteDirection[];
  relations: EvidenceRelation[];
  endings: EndingEpilogue[];
  postcards: JourneyPostcard[];
  botanicals: NightBotanical[];
  watchEchoes: CityWatchEcho[];
  wakeEchoes: WakeEcho[];
  characters: CaseCharacter[];
  districts: CityDistrict[];
  rules: CampaignRules;
  presentation: CampaignPresentation;
}

export function defineCampaign<const T extends CampaignManifest>(manifest: T): T {
  if (manifest.id !== manifest.case.id) throw new Error(`Campaign id ${manifest.id} must match case id ${manifest.case.id}`);
  if (!Number.isInteger(manifest.version) || manifest.version < 1) throw new Error(`Campaign ${manifest.id} has an invalid version`);
  if (manifest.format === "sandbox-expedition") {
    if (!manifest.sandbox) throw new Error(`Campaign ${manifest.id} is missing sandbox content`);
    assertSandboxCampaign(manifest.sandbox);
  } else if (manifest.sandbox) {
    throw new Error(`Linear campaign ${manifest.id} cannot include sandbox content`);
  }

  const chapterNumbers = new Set(manifest.case.chapters.map((chapter) => chapter.number));
  const clueIds = new Set(manifest.case.clues.map((clue) => clue.id));
  const collectibleIds = new Set(manifest.case.collectibles.map((item) => item.id));
  if (chapterNumbers.size !== manifest.case.chapters.length) throw new Error(`Campaign ${manifest.id} has duplicate chapter numbers`);
  if (manifest.case.chapters.some((chapter, index) => chapter.number !== index + 1)) {
    throw new Error(`Campaign ${manifest.id} chapters must be ordered consecutively from 1`);
  }
  if (manifest.presentation.nightSealAssetIds.length !== manifest.case.chapters.length) {
    throw new Error(`Campaign ${manifest.id} needs one night-seal asset for every chapter`);
  }
  if (clueIds.size !== manifest.case.clues.length) throw new Error(`Campaign ${manifest.id} has duplicate clue ids`);
  if (collectibleIds.size !== manifest.case.collectibles.length) throw new Error(`Campaign ${manifest.id} has duplicate collectible ids`);

  for (const chapter of manifest.case.chapters) {
    const choiceIds = new Set(chapter.choices.map((choice) => choice.id));
    const routes = manifest.routes.filter((route) => route.chapter === chapter.number);
    if (routes.length !== choiceIds.size || routes.some((route) => !choiceIds.has(route.choiceId))) {
      throw new Error(`Campaign ${manifest.id} does not cover every choice in chapter ${chapter.number}`);
    }
    if (manifest.postcards.filter((item) => item.chapter === chapter.number).length !== 1) {
      throw new Error(`Campaign ${manifest.id} needs one postcard for chapter ${chapter.number}`);
    }
    if (manifest.botanicals.filter((item) => item.chapter === chapter.number).length !== 1) {
      throw new Error(`Campaign ${manifest.id} needs one botanical for chapter ${chapter.number}`);
    }
    if (manifest.wakeEchoes.filter((item) => item.chapter === chapter.number).length !== 1) {
      throw new Error(`Campaign ${manifest.id} needs one wake echo for chapter ${chapter.number}`);
    }
    if (manifest.watchEchoes.filter((item) => item.chapter === chapter.number).length !== 4) {
      throw new Error(`Campaign ${manifest.id} needs four watch echoes for chapter ${chapter.number}`);
    }
  }

  for (const relation of manifest.relations) {
    if (relation.clueIds.some((clueId) => !clueIds.has(clueId))) {
      throw new Error(`Campaign ${manifest.id} relation ${relation.id} references an unknown clue`);
    }
  }
  for (const character of manifest.characters) {
    if (character.revealClueIds.some((clueId) => !clueIds.has(clueId))) {
      throw new Error(`Campaign ${manifest.id} character ${character.id} references an unknown clue`);
    }
  }
  if (!manifest.endings.some((ending) => ending.id === manifest.rules.trueEndingId)) {
    throw new Error(`Campaign ${manifest.id} is missing its true ending`);
  }
  if (manifest.rules.requiredClueCount > manifest.case.clues.length
    || manifest.rules.requiredCollectibleCount > manifest.case.collectibles.length
    || manifest.rules.requiredRelationCount > manifest.relations.length) {
    throw new Error(`Campaign ${manifest.id} has unreachable ending requirements`);
  }
  return manifest;
}

export function getCampaignRouteDirection(campaign: CampaignManifest, chapterNumber: number, choiceId = ""): RouteDirection {
  const chapter = campaign.case.chapters.find((item) => item.number === chapterNumber);
  if (!chapter) throw new Error(`Unknown chapter ${chapterNumber} in ${campaign.id}`);
  const resolvedChoiceId = choiceId || chapter.choices[0].id;
  if (!chapter.choices.some((choice) => choice.id === resolvedChoiceId)) {
    throw new Error(`Unknown choice ${resolvedChoiceId} for chapter ${chapterNumber} in ${campaign.id}`);
  }
  const direction = campaign.routes.find((item) => item.chapter === chapterNumber && item.choiceId === resolvedChoiceId);
  if (!direction) throw new Error(`Missing route for chapter ${chapterNumber}, choice ${resolvedChoiceId} in ${campaign.id}`);
  return direction;
}

export function getCampaignPostcard(campaign: CampaignManifest, chapter: number): JourneyPostcard {
  const item = campaign.postcards.find((postcard) => postcard.chapter === chapter);
  if (!item) throw new Error(`Missing postcard for chapter ${chapter} in ${campaign.id}`);
  return item;
}

export function getCampaignNightSealAssetId(campaign: CampaignManifest, chapter: number): string {
  const chapterIndex = campaign.case.chapters.findIndex((item) => item.number === chapter);
  const assetId = chapterIndex >= 0 ? campaign.presentation.nightSealAssetIds[chapterIndex] : undefined;
  if (!assetId) throw new Error(`Missing night-seal asset for chapter ${chapter} in ${campaign.id}`);
  return assetId;
}

export function getCampaignBotanical(campaign: CampaignManifest, chapter: number): NightBotanical {
  const item = campaign.botanicals.find((botanical) => botanical.chapter === chapter);
  if (!item) throw new Error(`Missing botanical for chapter ${chapter} in ${campaign.id}`);
  return item;
}

export function getCampaignWatchEcho(campaign: CampaignManifest, chapter: number, watchId: string): CityWatchEcho {
  const item = campaign.watchEchoes.find((echo) => echo.chapter === chapter && echo.watchId === watchId);
  if (!item) throw new Error(`Missing watch echo for chapter ${chapter}, watch ${watchId} in ${campaign.id}`);
  return item;
}

export function getCampaignWakeEcho(campaign: CampaignManifest, chapter: number): WakeEcho {
  const item = campaign.wakeEchoes.find((echo) => echo.chapter === chapter);
  if (!item) throw new Error(`Missing wake echo for chapter ${chapter} in ${campaign.id}`);
  return item;
}

export function getCampaignWakeEchoById(campaign: CampaignManifest, echoId: string): WakeEcho {
  const item = campaign.wakeEchoes.find((echo) => echo.id === echoId);
  if (!item) throw new Error(`Unknown wake echo ${echoId} in ${campaign.id}`);
  return item;
}

export function matchCampaignEvidenceRelation(campaign: CampaignManifest, firstClueId: string, secondClueId: string): EvidenceRelation | undefined {
  const selected = new Set([firstClueId, secondClueId]);
  if (selected.size !== 2) return undefined;
  return campaign.relations.find((relation) => relation.clueIds.every((clueId) => selected.has(clueId)));
}
