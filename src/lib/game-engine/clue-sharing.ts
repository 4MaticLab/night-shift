import { DEFAULT_CAMPAIGN_ID, getCampaign, isCampaignId, type CampaignId } from "@/src/content/campaigns/registry";
import type { Clue } from "@/src/lib/game-engine/schema";

export const SHARED_CLUE_QUERY_KEY = "clue";
export const SHARED_CAMPAIGN_QUERY_KEY = "case";

export function getShareableClue(campaignId: unknown, clueId: unknown): Clue | undefined {
  if (!isCampaignId(campaignId)) return undefined;
  if (typeof clueId !== "string") return undefined;
  return getCampaign(campaignId).case.clues.find((clue) => clue.id === clueId);
}

export function createClueShareUrl(baseUrl: string | URL, campaignId: CampaignId, clueId: string): string {
  if (!getShareableClue(campaignId, clueId)) throw new Error("Unknown campaign clue");
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARED_CAMPAIGN_QUERY_KEY, campaignId);
  url.searchParams.set(SHARED_CLUE_QUERY_KEY, clueId);
  return url.toString();
}

export function readSharedClueQuery(search: string): { present: boolean; campaignId?: CampaignId; clue?: Clue } {
  const params = new URLSearchParams(search);
  if (!params.has(SHARED_CLUE_QUERY_KEY)) return { present: false };
  const rawCampaignId = params.get(SHARED_CAMPAIGN_QUERY_KEY) ?? DEFAULT_CAMPAIGN_ID;
  if (!isCampaignId(rawCampaignId)) return { present: true };
  return { present: true, campaignId: rawCampaignId, clue: getShareableClue(rawCampaignId, params.get(SHARED_CLUE_QUERY_KEY)) };
}

export function removeSharedClueQuery(urlValue: string | URL): string {
  const url = new URL(urlValue);
  url.searchParams.delete(SHARED_CAMPAIGN_QUERY_KEY);
  url.searchParams.delete(SHARED_CLUE_QUERY_KEY);
  return `${url.pathname}${url.search}${url.hash}`;
}
