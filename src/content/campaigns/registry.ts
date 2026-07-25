import { LAST_TRAM_CAMPAIGN_ID, lastTramCampaign } from "./last-tram";
import { RAIN_RADIO_CAMPAIGN_ID, rainRadioCampaign } from "./rain-radio";
import { THIRTEENTH_LOAF_CAMPAIGN_ID, thirteenthLoafCampaign } from "./thirteenth-loaf";
import { CHIHAYA_NOA_CAMPAIGN_ID, chihayaNoaCampaign } from "./chihaya-noa";
import { FOG_WITHOUT_WOLVES_CAMPAIGN_ID, fogWithoutWolvesCampaign } from "./fog-without-wolves";
import type { CampaignManifest } from "./types";

export const DEFAULT_CAMPAIGN_ID = LAST_TRAM_CAMPAIGN_ID;

export const campaignRegistry = [
  lastTramCampaign,
  rainRadioCampaign,
  thirteenthLoafCampaign,
  chihayaNoaCampaign,
  fogWithoutWolvesCampaign,
] as const satisfies readonly CampaignManifest[];

export type CampaignId = (typeof campaignRegistry)[number]["id"];

export function getCampaign(campaignId: string | null | undefined): CampaignManifest {
  return campaignRegistry.find((campaign) => campaign.id === campaignId) ?? lastTramCampaign;
}

export function isCampaignId(value: unknown): value is CampaignId {
  return typeof value === "string" && campaignRegistry.some((campaign) => campaign.id === value);
}

export {
  CHIHAYA_NOA_CAMPAIGN_ID,
  FOG_WITHOUT_WOLVES_CAMPAIGN_ID,
  LAST_TRAM_CAMPAIGN_ID,
  RAIN_RADIO_CAMPAIGN_ID,
  THIRTEENTH_LOAF_CAMPAIGN_ID,
};
export type { CampaignManifest } from "./types";
