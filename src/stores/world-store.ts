"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BLACKWATER_CREEK_CAMPAIGN_ID,
  DEFAULT_CAMPAIGN_ID,
  type CampaignId,
} from "@/src/content/campaigns/registry";
import { ensureCurrentSaveEpoch } from "@/src/stores/save-epoch";

interface WorldStore {
  campaignId: CampaignId;
  started: boolean;
  begin: () => void;
  switchCampaign: (campaignId: CampaignId) => void;
}

const publicCampaignIds = new Set<CampaignId>([
  DEFAULT_CAMPAIGN_ID,
  BLACKWATER_CREEK_CAMPAIGN_ID,
]);

const initialWorldState = {
  campaignId: DEFAULT_CAMPAIGN_ID,
  started: false,
} satisfies Pick<WorldStore, "campaignId" | "started">;

ensureCurrentSaveEpoch();

export const useWorldStore = create<WorldStore>()(persist((set) => ({
  ...initialWorldState,
  begin: () => set({ started: true }),
  switchCampaign: (campaignId) => {
    if (!publicCampaignIds.has(campaignId)) return;
    set({ campaignId, started: false });
  },
}), {
  name: "night-shift-world-v1",
  version: 1,
  partialize: ({ campaignId, started }) => ({ campaignId, started }),
  migrate: () => initialWorldState,
}));
