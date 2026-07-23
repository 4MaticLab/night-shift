import { BLACKWATER_CREEK_CAMPAIGN_ID, blackwaterCreekCampaign } from "./blackwater-creek";
import { LAST_TRAM_CAMPAIGN_ID, lastTramCampaign } from "./last-tram";
import { RAIN_RADIO_CAMPAIGN_ID, rainRadioCampaign } from "./rain-radio";
import type { CampaignManifest } from "./types";

export const DEFAULT_CAMPAIGN_ID = LAST_TRAM_CAMPAIGN_ID;

export const campaignRegistry = [lastTramCampaign, rainRadioCampaign, blackwaterCreekCampaign] as const satisfies readonly CampaignManifest[];
export const campaignShelf = [lastTramCampaign, blackwaterCreekCampaign] as const satisfies readonly CampaignManifest[];

export type CampaignId = (typeof campaignRegistry)[number]["id"];

export function getCampaign(campaignId: string | null | undefined): CampaignManifest {
  return campaignRegistry.find((campaign) => campaign.id === campaignId) ?? lastTramCampaign;
}

export function isCampaignId(value: unknown): value is CampaignId {
  return typeof value === "string" && campaignRegistry.some((campaign) => campaign.id === value);
}

export { BLACKWATER_CREEK_CAMPAIGN_ID, LAST_TRAM_CAMPAIGN_ID, RAIN_RADIO_CAMPAIGN_ID };
export type { CampaignManifest } from "./types";
