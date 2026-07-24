import { describe, expect, it } from "vitest";
import { assetManifest, getAsset } from "@/src/content/assets";
import {
  getCampaignCipherChallenges,
  getCampaignCipherDesk,
  getCampaignCipherProgressIds,
  getCampaignCipherRelay,
  isCipherRelayUnlocked,
  matchesCipherAnswer,
  matchesCipherRelay,
} from "@/src/content/ciphers";
import {
  FOG_WITHOUT_WOLVES_CAMPAIGN_ID,
  fogWithoutWolvesCampaign,
} from "@/src/content/campaigns/fog-without-wolves";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";

describe("No Wolves in the Fog", () => {
  it("ships as a complete five-night Night Shift campaign", () => {
    expect(fogWithoutWolvesCampaign.id).toBe("case-006");
    expect(fogWithoutWolvesCampaign.presentation.archiveNumber).toBe("005");
    expect(fogWithoutWolvesCampaign.case.chapters).toHaveLength(5);
    expect(fogWithoutWolvesCampaign.case.clues).toHaveLength(12);
    expect(fogWithoutWolvesCampaign.case.collectibles).toHaveLength(8);
    expect(fogWithoutWolvesCampaign.routes).toHaveLength(15);
    expect(fogWithoutWolvesCampaign.syntheses).toHaveLength(5);
    expect(fogWithoutWolvesCampaign.endings).toHaveLength(3);
    expect(fogWithoutWolvesCampaign.characters).toHaveLength(4);
    expect(fogWithoutWolvesCampaign.districts).toHaveLength(3);
    expect(fogWithoutWolvesCampaign.rules).toEqual({
      trueEndingId: "return",
      requiredClueCount: 12,
      requiredCollectibleCount: 7,
      requiredSynthesisCount: 5,
    });
  });

  it("keeps the chained inference graph explicit", () => {
    const split = fogWithoutWolvesCampaign.syntheses.find((item) => item.id === "fog-one-bell-split-event");
    const witness = fogWithoutWolvesCampaign.syntheses.find((item) => item.id === "fog-third-witness-is-trigger");
    const roles = fogWithoutWolvesCampaign.syntheses.find((item) => item.id === "fog-roles-can-be-exchanged");
    expect(split?.inputIds).toEqual(["laplace-cylinder", "theresa-cylinder"]);
    expect(witness?.inputIds).toContain("fog-one-bell-split-event");
    expect(roles?.inputIds).toEqual(["hunter-pair-protocol", "mismatched-gloves"]);
  });

  it("uses the shared lifecycle for every route and sleep quality", () => {
    for (const chapter of fogWithoutWolvesCampaign.case.chapters) {
      const routes = chapter.choices.map((choice) =>
        resolveNight(fogWithoutWolvesCampaign, chapter.number, "regular", "side-lamp", choice.id),
      );
      for (const quality of ["interrupted", "regular", "restful"] as const) {
        expect(resolveNight(
          fogWithoutWolvesCampaign,
          chapter.number,
          quality,
          "side-lamp",
          chapter.choices[0].id,
        ).clueIds.length).toBeGreaterThan(0);
      }
      expect(routes.map((result) => result.clueIds)).toEqual([
        routes[0].clueIds,
        routes[0].clueIds,
        routes[0].clueIds,
      ]);
      expect(routes.map((result) => result.collectibleIds)).toEqual([
        routes[0].collectibleIds,
        routes[0].collectibleIds,
        routes[0].collectibleIds,
      ]);
      expect(new Set(routes.map((result) => result.returnLetter))).toHaveLength(3);
    }
    expect(JSON.stringify(fogWithoutWolvesCampaign)).not.toMatch(/好感|共鸣值|裂隙值|即时战斗|实时同行/);
  });

  it("consumes all 34 dedicated assets without borrowing another case", () => {
    const usedAssetIds = new Set([
      fogWithoutWolvesCampaign.presentation.heroAssetId,
      fogWithoutWolvesCampaign.presentation.nightAssetId,
      fogWithoutWolvesCampaign.presentation.morningAssetId,
      fogWithoutWolvesCampaign.presentation.endingAssetId,
      ...fogWithoutWolvesCampaign.presentation.nightSealAssetIds,
      ...fogWithoutWolvesCampaign.case.collectibles.map((item) => item.assetId),
      ...fogWithoutWolvesCampaign.postcards.map((item) => item.assetId),
      ...fogWithoutWolvesCampaign.botanicals.map((item) => item.assetId),
      ...fogWithoutWolvesCampaign.characters.map((item) => item.assetId),
      ...fogWithoutWolvesCampaign.districts.map((item) => item.assetId),
    ]);
    const registered = assetManifest.filter((asset) =>
      asset.id.startsWith("case.fog-without-wolves.")
      || asset.id.startsWith("collectible.fog-without-wolves."),
    );
    expect(usedAssetIds).toHaveLength(34);
    expect(registered).toHaveLength(34);
    expect(new Set(registered.map((asset) => asset.id))).toEqual(usedAssetIds);
    expect(registered.every((asset) => asset.src.startsWith("/art/cases/fog-without-wolves/"))).toBe(true);
    expect(registered.every((asset) => getAsset(asset.id).status === "complete")).toBe(true);
  });

  it("keeps echo tuning optional and outside ending eligibility", () => {
    const desk = getCampaignCipherDesk(FOG_WITHOUT_WOLVES_CAMPAIGN_ID);
    const challenges = getCampaignCipherChallenges(FOG_WITHOUT_WOLVES_CAMPAIGN_ID);
    expect(desk?.archiveLabel).toMatch(/回声调谐台/);
    expect(challenges).toHaveLength(3);
    expect(challenges[0].dial?.mode).toBe("frequency");
    expect(matchesCipherAnswer(challenges[0], "23.43 kHz")).toBe(true);
    expect(matchesCipherAnswer(challenges[1], "一分钟")).toBe(true);
    expect(matchesCipherAnswer(challenges[2], "交换角色")).toBe(true);
    const relay = getCampaignCipherRelay(FOG_WITHOUT_WOLVES_CAMPAIGN_ID, "fog-without-wolves-final-relay");
    expect(relay).toBeDefined();
    expect(isCipherRelayUnlocked(
      FOG_WITHOUT_WOLVES_CAMPAIGN_ID,
      challenges.map((challenge) => challenge.id),
    )).toBe(true);
    expect(matchesCipherRelay(relay!, ["fog-event", "fog-trigger", "fog-exit"])).toBe(true);
    expect(getCampaignCipherProgressIds(FOG_WITHOUT_WOLVES_CAMPAIGN_ID)).toEqual([
      "fog-split-waveform",
      "fog-missing-minute",
      "fog-role-exchange",
      "fog-without-wolves-final-relay",
    ]);
  });
});
