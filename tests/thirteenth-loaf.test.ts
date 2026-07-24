import { describe, expect, it } from "vitest";
import { assetManifest, getAsset } from "@/src/content/assets";
import {
  getCampaignCipherChallenges,
  getCampaignCipherDesk,
  getCampaignCipherRelay,
  getCampaignCipherProgressIds,
  isCipherRelayUnlocked,
  matchesCipherAnswer,
  matchesCipherRelay,
} from "@/src/content/ciphers";
import { THIRTEENTH_LOAF_CAMPAIGN_ID, thirteenthLoafCampaign } from "@/src/content/campaigns/thirteenth-loaf";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";

describe("The Thirteenth Loaf Before Dawn", () => {
  it("ships a complete five-night campaign with isolated fixed facts", () => {
    expect(thirteenthLoafCampaign.id).toBe("case-004");
    expect(thirteenthLoafCampaign.presentation.archiveNumber).toBe("003");
    expect(thirteenthLoafCampaign.case.chapters).toHaveLength(5);
    expect(thirteenthLoafCampaign.case.clues).toHaveLength(12);
    expect(thirteenthLoafCampaign.case.collectibles).toHaveLength(8);
    expect(thirteenthLoafCampaign.routes).toHaveLength(15);
    expect(thirteenthLoafCampaign.syntheses).toHaveLength(3);
    expect(thirteenthLoafCampaign.endings).toHaveLength(3);
    expect(thirteenthLoafCampaign.characters).toHaveLength(4);
    expect(thirteenthLoafCampaign.districts).toHaveLength(3);
    expect(thirteenthLoafCampaign.rules).toEqual({
      trueEndingId: "return",
      requiredClueCount: 12,
      requiredCollectibleCount: 7,
      requiredSynthesisCount: 3,
    });
    expect(thirteenthLoafCampaign.case.clues.find((clue) => clue.id === "twelve-name-roster")?.detail).toMatch(/没有被刮去的第十三行/);
    expect(thirteenthLoafCampaign.case.clues.find((clue) => clue.id === "conduit-scorch")?.marginNote).toMatch(/公共管道进店/);
    expect(thirteenthLoafCampaign.case.clues.find((clue) => clue.id === "commons-charter")?.summary).toMatch(/不可出售/);
  });

  it("advances every night for every sleep quality without changing fixed rewards by route", () => {
    for (const chapter of thirteenthLoafCampaign.case.chapters) {
      const qualities = ["interrupted", "regular", "restful"] as const;
      const qualityResults = qualities.map((quality) => resolveNight(thirteenthLoafCampaign, chapter.number, quality));
      expect(qualityResults.every((result) => result.clueIds.length > 0)).toBe(true);

      const routeResults = chapter.choices.map((choice) =>
        resolveNight(thirteenthLoafCampaign, chapter.number, "regular", "side-lamp", choice.id),
      );
      expect(routeResults.map((result) => result.clueIds)).toEqual([routeResults[0].clueIds, routeResults[0].clueIds, routeResults[0].clueIds]);
      expect(routeResults.map((result) => result.collectibleIds)).toEqual([
        routeResults[0].collectibleIds,
        routeResults[0].collectibleIds,
        routeResults[0].collectibleIds,
      ]);
      expect(new Set(routeResults.map((result) => result.returnLetter))).toHaveLength(3);
    }
  });

  it("consumes all 34 dedicated assets without borrowing campaign-one art", () => {
    const usedAssetIds = new Set([
      thirteenthLoafCampaign.presentation.heroAssetId,
      thirteenthLoafCampaign.presentation.nightAssetId,
      thirteenthLoafCampaign.presentation.morningAssetId,
      thirteenthLoafCampaign.presentation.endingAssetId,
      ...thirteenthLoafCampaign.presentation.nightSealAssetIds,
      ...thirteenthLoafCampaign.case.collectibles.map((item) => item.assetId),
      ...thirteenthLoafCampaign.postcards.map((item) => item.assetId),
      ...thirteenthLoafCampaign.botanicals.map((item) => item.assetId),
      ...thirteenthLoafCampaign.characters.map((item) => item.assetId),
      ...thirteenthLoafCampaign.districts.map((item) => item.assetId),
    ]);
    const registered = assetManifest.filter((asset) =>
      asset.id.startsWith("case.thirteenth-loaf.") || asset.id.startsWith("collectible.thirteenth-loaf."),
    );

    expect(usedAssetIds).toHaveLength(34);
    expect(registered).toHaveLength(34);
    expect(new Set(registered.map((asset) => asset.id))).toEqual(usedAssetIds);
    expect(registered.every((asset) => asset.src.startsWith("/art/cases/thirteenth-loaf/"))).toBe(true);
    expect(registered.every((asset) => getAsset(asset.id).status === "complete")).toBe(true);
  });

  it("provides three deterministic ciphers and a non-scoring final charter relay", () => {
    const desk = getCampaignCipherDesk(THIRTEENTH_LOAF_CAMPAIGN_ID);
    const challenges = getCampaignCipherChallenges(THIRTEENTH_LOAF_CAMPAIGN_ID);
    expect(desk?.title).toMatch(/所有权、火灾方向与共同劳动/);
    expect(challenges).toHaveLength(3);
    expect(challenges.map((challenge) => challenge.requiredClueIds.every((id) =>
      thirteenthLoafCampaign.case.clues.some((clue) => clue.id === id),
    ))).toEqual([true, true, true]);
    expect(matchesCipherAnswer(challenges[0], "十三")).toBe(true);
    expect(matchesCipherAnswer(challenges[1], "市政热力主管")).toBe(true);
    expect(matchesCipherAnswer(challenges[2], "common")).toBe(true);
    expect(matchesCipherAnswer(challenges[2], "PRIVATE")).toBe(false);

    const relay = getCampaignCipherRelay(THIRTEENTH_LOAF_CAMPAIGN_ID, "thirteenth-loaf-final-relay");
    expect(relay).toBeDefined();
    expect(isCipherRelayUnlocked(THIRTEENTH_LOAF_CAMPAIGN_ID, challenges.map((challenge) => challenge.id))).toBe(true);
    expect(matchesCipherRelay(relay!, ["loaf-cause", "loaf-owners", "loaf-right"])).toBe(true);
    expect(matchesCipherRelay(relay!, ["loaf-owners", "loaf-cause", "loaf-right"])).toBe(false);
    expect(getCampaignCipherProgressIds(THIRTEENTH_LOAF_CAMPAIGN_ID)).toEqual([
      "loaf-thirteen-count",
      "loaf-fire-direction",
      "loaf-common-code",
      "thirteenth-loaf-final-relay",
    ]);
    expect(challenges.every((challenge) => challenge.dial === undefined)).toBe(true);
  });
});
