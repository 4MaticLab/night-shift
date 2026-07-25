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
import { CHIHAYA_NOA_CAMPAIGN_ID, chihayaNoaCampaign } from "@/src/content/campaigns/chihaya-noa";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";

describe("Chihaya Noa's Thirteenth Journey", () => {
  it("ships as a complete five-night Night Shift campaign", () => {
    expect(chihayaNoaCampaign.id).toBe("case-005");
    expect(chihayaNoaCampaign.presentation.archiveNumber).toBe("004");
    expect(chihayaNoaCampaign.case.chapters).toHaveLength(5);
    expect(chihayaNoaCampaign.case.clues).toHaveLength(12);
    expect(chihayaNoaCampaign.case.collectibles).toHaveLength(8);
    expect(chihayaNoaCampaign.routes).toHaveLength(15);
    expect(chihayaNoaCampaign.syntheses).toHaveLength(3);
    expect(chihayaNoaCampaign.endings).toHaveLength(3);
    expect(chihayaNoaCampaign.characters).toHaveLength(4);
    expect(chihayaNoaCampaign.districts).toHaveLength(3);
    expect(chihayaNoaCampaign.rules).toEqual({
      trueEndingId: "return",
      requiredClueCount: 12,
      requiredCollectibleCount: 7,
      requiredSynthesisCount: 3,
    });
    expect(chihayaNoaCampaign.case.clues.find((clue) => clue.id === "twelve-entry-stamps")?.detail).toMatch(/都真实/);
    expect(chihayaNoaCampaign.case.clues.find((clue) => clue.id === "unmade-address-book")?.summary).toMatch(/连续生活/);
    expect(chihayaNoaCampaign.case.clues.find((clue) => clue.id === "observer-chair-log")?.marginNote).toMatch(/判断伪装/);
    expect(chihayaNoaCampaign.endings.find((ending) => ending.id === "return")?.closingLine).toMatch(/不真实/);
  });

  it("advances every sleep quality while route choice changes prose, never fixed rewards", () => {
    for (const chapter of chihayaNoaCampaign.case.chapters) {
      for (const quality of ["interrupted", "regular", "restful"] as const) {
        expect(resolveNight(chihayaNoaCampaign, chapter.number, quality).clueIds.length).toBeGreaterThan(0);
      }

      const routeResults = chapter.choices.map((choice) =>
        resolveNight(chihayaNoaCampaign, chapter.number, "regular", "side-lamp", choice.id),
      );
      expect(routeResults.map((result) => result.clueIds)).toEqual([
        routeResults[0].clueIds,
        routeResults[0].clueIds,
        routeResults[0].clueIds,
      ]);
      expect(routeResults.map((result) => result.collectibleIds)).toEqual([
        routeResults[0].collectibleIds,
        routeResults[0].collectibleIds,
        routeResults[0].collectibleIds,
      ]);
      expect(new Set(routeResults.map((result) => result.returnLetter))).toHaveLength(3);
    }
  });

  it("consumes all 34 dedicated assets without borrowing earlier case art", () => {
    const usedAssetIds = new Set([
      chihayaNoaCampaign.presentation.heroAssetId,
      chihayaNoaCampaign.presentation.nightAssetId,
      chihayaNoaCampaign.presentation.morningAssetId,
      chihayaNoaCampaign.presentation.endingAssetId,
      ...chihayaNoaCampaign.presentation.nightSealAssetIds,
      ...chihayaNoaCampaign.case.collectibles.map((item) => item.assetId),
      ...chihayaNoaCampaign.postcards.map((item) => item.assetId),
      ...chihayaNoaCampaign.botanicals.map((item) => item.assetId),
      ...chihayaNoaCampaign.characters.map((item) => item.assetId),
      ...chihayaNoaCampaign.districts.map((item) => item.assetId),
    ]);
    const registered = assetManifest.filter((asset) =>
      asset.id.startsWith("case.chihaya-noa.") || asset.id.startsWith("collectible.chihaya-noa."),
    );

    expect(usedAssetIds).toHaveLength(34);
    expect(registered).toHaveLength(34);
    expect(new Set(registered.map((asset) => asset.id))).toEqual(usedAssetIds);
    expect(registered.every((asset) => asset.src.startsWith("/art/cases/chihaya-noa/"))).toBe(true);
    expect(registered.every((asset) => getAsset(asset.id).status === "complete")).toBe(true);
  });

  it("adds the optional returning-mirror specialty without gating story progression", () => {
    const desk = getCampaignCipherDesk(CHIHAYA_NOA_CAMPAIGN_ID);
    const challenges = getCampaignCipherChallenges(CHIHAYA_NOA_CAMPAIGN_ID);
    expect(desk?.archiveLabel).toMatch(/返照镜台/);
    expect(challenges).toHaveLength(3);
    expect(challenges[0].dial?.mode).toBe("count");
    expect(matchesCipherAnswer(challenges[0], "13份")).toBe(true);
    expect(matchesCipherAnswer(challenges[1], "LIVES")).toBe(true);
    expect(matchesCipherAnswer(challenges[2], "观察者")).toBe(true);
    expect(challenges.every((challenge) => challenge.requiredClueIds.every((id) =>
      chihayaNoaCampaign.case.clues.some((clue) => clue.id === id),
    ))).toBe(true);

    const relay = getCampaignCipherRelay(CHIHAYA_NOA_CAMPAIGN_ID, "chihaya-noa-final-relay");
    expect(relay).toBeDefined();
    expect(isCipherRelayUnlocked(CHIHAYA_NOA_CAMPAIGN_ID, challenges.map((challenge) => challenge.id))).toBe(true);
    expect(matchesCipherRelay(relay!, ["noa-arrivals", "noa-lives", "noa-right"])).toBe(true);
    expect(matchesCipherRelay(relay!, ["noa-lives", "noa-arrivals", "noa-right"])).toBe(false);
    expect(getCampaignCipherProgressIds(CHIHAYA_NOA_CAMPAIGN_ID)).toEqual([
      "noa-arrival-count",
      "noa-life-continuity",
      "noa-observer-switch",
      "chihaya-noa-final-relay",
    ]);

    expect(chihayaNoaCampaign.routes.some((route) => route.id.includes("cipher"))).toBe(false);
    expect(chihayaNoaCampaign.endings.some((ending) => ending.id.includes("cipher"))).toBe(false);
  });
});
