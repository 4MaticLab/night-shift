import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { nightShiftCase } from "@/src/content/case";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import { preparations } from "@/src/content/preparations";
import { getAsset, getNightSealAsset, getPostcardAsset } from "@/src/content/assets";
import { getJourneyPostcard, getPostcardPreparationNote, journeyPostcards } from "@/src/content/postcards";
import {
  finishSleepSession,
  nightSealProgress,
  qualityFromDuration,
  recordWakeEcho,
  startSleepSession,
} from "@/src/lib/game-engine/sleep-session";
import { evidenceSyntheses } from "@/src/content/relations";
import { getDefaultChoiceId, getRouteDirection, routeDirections } from "@/src/content/routes";
import { getNightBotanical, growthStageFromProgress, nightBotanicals } from "@/src/content/botany";
import { citySocieties, createSocietyMemory, getCitySociety, getSocietyLetter, getSocietyTitle } from "@/src/content/societies";
import { correspondencePostures, correspondencePrompts, createCorrespondenceRecord, getCorrespondencePrompt, getCorrespondenceReply, getDominantCorrespondenceStance, getLatestSocietyReply } from "@/src/content/correspondence";
import { createSouvenirRecord, DEMO_JOURNEY_SEED, getSouvenir, selectSouvenir, souvenirs } from "@/src/content/souvenirs";
import { createOpportunityRecord, getOpportunityCandidates, getOpportunityResponse, opportunityNotices } from "@/src/content/opportunities";
import { caseCharacters, getChapterCharacter, isCharacterRevealed } from "@/src/content/characters";
import { cityDistricts, getCityDistrict } from "@/src/content/districts";
import { endingEpilogues, getEndingEpilogue } from "@/src/content/endings";
import { cityWatchEchoes, cityWatches, DEMO_CITY_WATCH_ID, getCityWatch, getCityWatchEcho, getCityWatchId } from "@/src/content/watches";
import { getWakeEcho, getWakeEchoById, wakeEchoes } from "@/src/content/wake-echoes";
import { createClueShareUrl, readSharedClueQuery, removeSharedClueQuery } from "@/src/lib/game-engine/clue-sharing";
import { campaignRegistry, DEFAULT_CAMPAIGN_ID, RAIN_RADIO_CAMPAIGN_ID, THIRTEENTH_LOAF_CAMPAIGN_ID } from "@/src/content/campaigns/registry";
import { chihayaNoaCampaign } from "@/src/content/campaigns/chihaya-noa";
import { lastTramCampaign } from "@/src/content/campaigns/last-tram";
import { rainRadioCampaign } from "@/src/content/campaigns/rain-radio";
import { thirteenthLoafCampaign } from "@/src/content/campaigns/thirteenth-loaf";
import { getCampaignEvidenceSynthesis, getCampaignRouteDirection } from "@/src/content/campaigns/types";
import { campaignSupportsLocale, localizeCampaign } from "@/src/i18n/core";

describe("Night Shift case content", () => {
  it("provides a complete English presentation of the first case without changing stable ids or rules", () => {
    const english = localizeCampaign(lastTramCampaign, "en");
    const collectStrings = (value: unknown): string[] => {
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return value.flatMap(collectStrings);
      if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
      return [];
    };
    const stableIds = (campaign: typeof lastTramCampaign) => ({
      campaign: campaign.id,
      chapters: campaign.case.chapters.map((chapter) => [chapter.number, ...chapter.choices.map((choice) => choice.id)]),
      clues: campaign.case.clues.map((clue) => clue.id),
      collectibles: campaign.case.collectibles.map((item) => item.id),
      routes: campaign.routes.map((route) => [route.id, route.choiceId, route.societyId]),
      syntheses: campaign.syntheses.map((synthesis) => [synthesis.id, ...synthesis.inputIds]),
      endings: campaign.endings.map((ending) => ending.id),
    });

    expect(english).not.toBe(lastTramCampaign);
    expect(english.case.title).toBe("The Last Tram at 00:43");
    expect(stableIds(english as typeof lastTramCampaign)).toEqual(stableIds(lastTramCampaign));
    expect(english.rules).toEqual(lastTramCampaign.rules);
    expect(collectStrings(english).filter((text) => /\p{Script=Han}/u.test(text))).toEqual([]);
    expect(campaignSupportsLocale(lastTramCampaign.id, "en")).toBe(true);
    expect(campaignSupportsLocale(rainRadioCampaign.id, "en")).toBe(true);
    expect(campaignSupportsLocale(thirteenthLoafCampaign.id, "en")).toBe(false);
    expect(campaignSupportsLocale(chihayaNoaCampaign.id, "en")).toBe(false);
  });

  it("contains the complete five-night mystery", () => {
    expect(nightShiftCase.chapters).toHaveLength(5);
    expect(nightShiftCase.clues).toHaveLength(12);
    expect(nightShiftCase.collectibles).toHaveLength(8);
  });

  it("registers four complete Night Shift campaigns", () => {
    expect(campaignRegistry.map((campaign) => campaign.id)).toEqual(["case-001", "case-002", "case-004", "case-005"]);
    expect(new Set(campaignRegistry.map((campaign) => campaign.case.title))).toHaveLength(4);
    expect(new Set(campaignRegistry.flatMap((campaign) => campaign.case.clues.map((clue) => clue.id))).size)
      .toBe(campaignRegistry.reduce((total, campaign) => total + campaign.case.clues.length, 0));

    for (const campaign of campaignRegistry) {
      expect(campaign.case.chapters).toHaveLength(5);
      expect(campaign.routes).toHaveLength(15);
      expect(campaign.endings).toHaveLength(3);
      expect(campaign.postcards).toHaveLength(campaign.case.chapters.length);
      expect(campaign.botanicals).toHaveLength(campaign.case.chapters.length);
      expect(campaign.wakeEchoes).toHaveLength(campaign.case.chapters.length);
      expect(campaign.presentation.nightSealAssetIds).toHaveLength(campaign.case.chapters.length);
      expect(campaign.presentation.prologue.scenes.map((scene) => scene.stage)).toEqual(["incident", "evidence", "handoff"]);
      expect(campaign.presentation.prologue.acceptLabel.length).toBeGreaterThan(0);
      for (const scene of campaign.presentation.prologue.scenes) {
        expect(scene.title.length).toBeGreaterThan(0);
        expect(scene.body.length).toBeGreaterThanOrEqual(30);
        expect(scene.aside.length).toBeGreaterThanOrEqual(12);
        expect(getAsset(scene.assetId).status).toBe("complete");
      }
      for (const chapter of campaign.case.chapters) {
        for (const quality of ["interrupted", "regular", "restful"] as const) {
          expect(resolveNight(campaign, chapter.number, quality).clueIds.length).toBeGreaterThan(0);
        }
        for (const choice of chapter.choices) {
          expect(getCampaignRouteDirection(campaign, chapter.number, choice.id).choiceId).toBe(choice.id);
        }
      }
    }
    expect(rainRadioCampaign.case.title).toBe("只在雨中播出的电台");
    expect(thirteenthLoafCampaign.case.title).toBe("黎明前出炉的第十三个面包");
    expect(thirteenthLoafCampaign.presentation.archiveNumber).toBe("003");
    expect(chihayaNoaCampaign.case.title).toBe("千早诺亚的第十三次旅行");
    expect(chihayaNoaCampaign.presentation.archiveNumber).toBe("004");
    expect(lastTramCampaign.case.clues.some((clue) => rainRadioCampaign.case.clues.some((other) => other.id === clue.id))).toBe(false);
    expect(campaignRegistry.flatMap((campaign) => campaign.case.clues).filter((clue) => clue.id === "commons-charter")).toHaveLength(1);
  });

  it("gives every clue a literary dossier without changing fixed facts", () => {
    for (const clue of nightShiftCase.clues) {
      expect(clue.cityObjection.length).toBeGreaterThanOrEqual(20);
      expect(clue.marginNote.length).toBeGreaterThanOrEqual(12);
      expect(clue.cityObjection).not.toMatch(/积分|奖励|好感/);
    }
  });

  it("defines three distinct literary epilogues without reward language", () => {
    expect(endingEpilogues.map((ending) => ending.id)).toEqual(["public", "protect", "return"]);
    expect(new Set(endingEpilogues.map((ending) => ending.detectiveLetter))).toHaveLength(3);
    expect(new Set(endingEpilogues.map((ending) => ending.closingLine))).toHaveLength(3);
    for (const ending of endingEpilogues) {
      expect(getEndingEpilogue(ending.id)).toEqual(ending);
      expect(ending.detectiveLetter.length).toBeGreaterThanOrEqual(80);
      expect(`${ending.result}${ending.detectiveLetter}${ending.closingLine}`).not.toMatch(/积分|奖励|分数|好感度/);
    }
  });

  it("always advances the main story without punishing short sleep", () => {
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      expect(resolveNight(lastTramCampaign, chapter, "interrupted").clueIds.length).toBeGreaterThan(0);
      expect(resolveNight(lastTramCampaign, chapter, "regular").clueIds.length).toBeGreaterThan(0);
      expect(resolveNight(lastTramCampaign, chapter, "restful").clueIds.length).toBeGreaterThan(0);
    }
  });

  it("gives restful nights a route at least as rich as interrupted nights", () => {
    expect(resolveNight(lastTramCampaign, 1, "restful").route.length).toBeGreaterThanOrEqual(resolveNight(lastTramCampaign, 1, "interrupted").route.length);
    expect(resolveNight(lastTramCampaign, 1, "restful").observation).toBeTruthy();
    expect(resolveNight(lastTramCampaign, 1, "interrupted").echo).toBeTruthy();
  });

  it("lets preparation change atmosphere without changing fixed clues", () => {
    const results = preparations.map((item) => resolveNight(lastTramCampaign, 1, "regular", item.id));
    expect(new Set(results.map((result) => result.preparationEcho)).size).toBe(3);
    expect(results.map((result) => result.clueIds)).toEqual([
      results[0].clueIds,
      results[0].clueIds,
      results[0].clueIds,
    ]);
  });

  it("serves preparation art locally as WebP", () => {
    expect(new Set(preparations.map((item) => item.imageSrc))).toHaveLength(preparations.length);
    for (const item of preparations) {
      expect(item.imageSrc).toMatch(/^\/art\/preparations\/.+\.webp$/);
      expect(existsSync(join(process.cwd(), "public", item.imageSrc.slice(1)))).toBe(true);
    }
  });

  it("defines three complete and distinct route directions for every night", () => {
    expect(routeDirections).toHaveLength(15);
    for (const chapter of nightShiftCase.chapters) {
      const directions = chapter.choices.map((choice) => getRouteDirection(chapter.number, choice.id));
      expect(directions.map((direction) => direction.choiceId)).toEqual(chapter.choices.map((choice) => choice.id));
      expect(new Set(directions.map((direction) => direction.returnLetter))).toHaveLength(3);
      expect(new Set(directions.map((direction) => direction.cityEncounter))).toHaveLength(3);
      expect(new Set(directions.map((direction) => direction.routeNodes.join(" → ")))).toHaveLength(3);
      expect(new Set(directions.map((direction) => direction.events.join(" | ")))).toHaveLength(3);
      expect(directions.every((direction) => direction.events.length === 5 && direction.routeNodes.length === 4)).toBe(true);
    }
  });

  it("lets direction change the journey without changing fixed rewards", () => {
    for (const chapter of nightShiftCase.chapters) {
      const results = chapter.choices.map((choice) => resolveNight(lastTramCampaign, chapter.number, "regular", "side-lamp", choice.id));
      expect(results.map((result) => result.clueIds)).toEqual([results[0].clueIds, results[0].clueIds, results[0].clueIds]);
      expect(results.map((result) => result.collectibleIds)).toEqual([results[0].collectibleIds, results[0].collectibleIds, results[0].collectibleIds]);
      expect(new Set(results.map((result) => result.returnLetter))).toHaveLength(3);
    }
  });

  it("maps all fifteen directions evenly to three original city societies", () => {
    expect(citySocieties).toHaveLength(3);
    expect(new Set(citySocieties.map((society) => society.name))).toHaveLength(3);
    for (const society of citySocieties) {
      const directions = routeDirections.filter((direction) => direction.societyId === society.id);
      expect(directions).toHaveLength(5);
      expect(directions.every((direction) => direction.societyNotice.length >= 15)).toBe(true);
      expect(getAsset(society.assetId).category).toBe("society-crest");
      expect(society.privateRule).toBeTruthy();
    }
  });

  it("turns repeated attention into deterministic names instead of reward gates", () => {
    const history = {};
    const first = createSocietyMemory(1, "source", history, "2026-07-11T05:28:00.000Z");
    const second = createSocietyMemory(2, "mina", { 1: first }, "2026-07-12T05:28:00.000Z");
    const third = createSocietyMemory(3, "hotel", { 1: first, 2: second }, "2026-07-13T05:28:00.000Z");

    expect([first.standing, second.standing, third.standing]).toEqual(["noticed", "known", "entrusted"]);
    expect(new Set([getSocietyTitle(first), getSocietyTitle(second), getSocietyTitle(third)])).toHaveLength(3);
    expect(new Set([getSocietyLetter(first), getSocietyLetter(second), getSocietyLetter(third)])).toHaveLength(3);
    expect(getCitySociety(first.societyId).name).toBe("错页登记处");
  });

  it("defines nine society questions and eighteen balanced, non-scoring replies", () => {
    expect(correspondencePrompts).toHaveLength(9);
    expect(new Set(correspondencePrompts.map((prompt) => `${prompt.societyId}/${prompt.standing}`))).toHaveLength(9);
    const replies = correspondencePrompts.flatMap((prompt) => prompt.replies);
    expect(replies).toHaveLength(18);
    expect(new Set(replies.map((reply) => reply.id))).toHaveLength(18);
    expect(replies.filter((reply) => reply.stance === "shelter")).toHaveLength(6);
    expect(replies.filter((reply) => reply.stance === "restore")).toHaveLength(6);
    expect(replies.filter((reply) => reply.stance === "witness")).toHaveLength(6);
    expect(Object.keys(correspondencePostures).sort()).toEqual(["restore", "shelter", "witness"]);
  });

  it("returns only the latest prior answer from the same society", () => {
    const firstMemory = createSocietyMemory(1, "source", {}, "2026-07-11T05:28:00.000Z");
    const secondMemory = createSocietyMemory(2, "mina", { 1: firstMemory }, "2026-07-12T05:28:00.000Z");
    const otherMemory = createSocietyMemory(3, "gideon", { 1: firstMemory, 2: secondMemory }, "2026-07-13T05:28:00.000Z");
    const firstPrompt = getCorrespondencePrompt(firstMemory);
    const secondPrompt = getCorrespondencePrompt(secondMemory);
    const first = createCorrespondenceRecord(firstMemory, firstPrompt.replies[0].id, "2026-07-11T06:02:00.000Z");
    const second = createCorrespondenceRecord(secondMemory, secondPrompt.replies[0].id, "2026-07-12T06:02:00.000Z");
    const otherPrompt = getCorrespondencePrompt(otherMemory);
    const other = createCorrespondenceRecord(otherMemory, otherPrompt.replies[1].id, "2026-07-13T06:02:00.000Z");
    const history = { 1: first, 2: second, 3: other };

    expect(getLatestSocietyReply(history, "misfiled-registry", 2)).toEqual(first);
    expect(getLatestSocietyReply(history, "misfiled-registry", 5)).toEqual(second);
    expect(getLatestSocietyReply(history, "mislaid-consulate", 3)).toBeUndefined();
    expect(getCorrespondenceReply(second).echo).toMatch(/申请|抽屉/);
    expect(getDominantCorrespondenceStance(history)).toBe(other.stance);
  });

  it("defaults legacy nights to the first direction and rejects invalid choices", () => {
    expect(resolveNight(lastTramCampaign, 1, "regular").choiceId).toBe(getDefaultChoiceId(1));
    expect(() => resolveNight(lastTramCampaign, 1, "regular", "", "not-a-route")).toThrow(/Unknown choice/);
  });

  it("resolves every collectible and night seal through the asset manifest", () => {
    for (const collectible of nightShiftCase.collectibles) {
      expect(getAsset(collectible.assetId).category).toBe("collectible");
    }
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      expect(getNightSealAsset(chapter).category).toBe("night-seal");
    }
  });

  it("uses three distinct manifest headers and one ending tableau", () => {
    const headers = [getAsset("header.night-shift.hero"), getAsset("header.night-expedition"), getAsset("header.morning-report")];
    expect(headers.every((asset) => asset.category === "header")).toBe(true);
    expect(new Set(headers.map((asset) => asset.src))).toHaveLength(3);
    expect(getAsset("ending.hidden-platform").category).toBe("ending");
    expect(getAsset("character.lin-du-handoff")).toMatchObject({ category: "character-portrait", status: "complete" });
  });

  it("defines one distinct journey postcard and three preparation notes per night", () => {
    expect(journeyPostcards.map((postcard) => postcard.chapter)).toEqual([1, 2, 3, 4, 5]);
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      const postcard = getJourneyPostcard(chapter);
      expect(getAsset(postcard.assetId)).toEqual(getPostcardAsset(chapter));
      expect(getPostcardAsset(chapter).category).toBe("postcard");
      const notes = preparations.map((preparation) => getPostcardPreparationNote(chapter, preparation.id));
      expect(notes.every(Boolean)).toBe(true);
      expect(new Set(notes)).toHaveLength(3);
    }
  });

  it("defines five botanical specimens with non-punitive quality notes", () => {
    expect(nightBotanicals).toHaveLength(5);
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      const botanical = getNightBotanical(chapter);
      expect(getAsset(botanical.assetId).category).toBe("botanical");
      expect(Object.values(botanical.growthStages).every(Boolean)).toBe(true);
      expect(Object.values(botanical.qualityNotes).every(Boolean)).toBe(true);
      expect(botanical.qualityNotes.interrupted).not.toMatch(/枯死|失败|失去线索/);
    }
  });

  it("defines nine original, non-scoring souvenirs with complete art", () => {
    expect(souvenirs).toHaveLength(9);
    expect(new Set(souvenirs.map((souvenir) => souvenir.id))).toHaveLength(9);
    for (const society of citySocieties) {
      expect(souvenirs.filter((souvenir) => souvenir.societyId === society.id)).toHaveLength(3);
    }
    for (const preparation of preparations) {
      expect(souvenirs.filter((souvenir) => souvenir.preparationAffinity === preparation.id)).toHaveLength(3);
    }
    for (const souvenir of souvenirs) {
      expect(getAsset(souvenir.assetId).category).toBe("souvenir");
      expect(souvenir).not.toHaveProperty("rarity");
      expect(souvenir).not.toHaveProperty("value");
    }
  });

  it("lets direction and preparation shape a deterministic souvenir without exposing rewards", () => {
    const registry = selectSouvenir(1, "source", "side-lamp", DEMO_JOURNEY_SEED, {});
    const consulate = selectSouvenir(1, "flower", "side-lamp", DEMO_JOURNEY_SEED, {});
    const cartographers = selectSouvenir(1, "track", "side-lamp", DEMO_JOURNEY_SEED, {});
    expect(registry.societyId).toBe("misfiled-registry");
    expect(consulate.societyId).toBe("mislaid-consulate");
    expect(cartographers.societyId).toBe("afterlight-cartographers");
    expect(registry.preparationAffinity).toBe("side-lamp");
    expect(selectSouvenir(1, "source", "side-lamp", DEMO_JOURNEY_SEED, {}).id).toBe(registry.id);
  });

  it("settles five stable souvenir records without duplicates", () => {
    const history = {} as Parameters<typeof createSouvenirRecord>[4];
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      const choiceId = getDefaultChoiceId(chapter);
      history[chapter] = createSouvenirRecord(chapter, choiceId, "side-lamp", DEMO_JOURNEY_SEED, history, `2026-07-${String(10 + chapter).padStart(2, "0")}T05:28:00.000Z`);
      expect(createSouvenirRecord(chapter, choiceId, "tram-fare", 99, history, "2026-07-23T05:28:00.000Z")).toEqual(history[chapter]);
      expect(getSouvenir(history[chapter]!.souvenirId)).toBeTruthy();
    }
    expect(new Set(Object.values(history).map((record) => record?.souvenirId))).toHaveLength(5);
  });

  it("defines twelve balanced city notices with two valid responses each", () => {
    expect(opportunityNotices).toHaveLength(12);
    expect(new Set(opportunityNotices.map((notice) => notice.id))).toHaveLength(12);
    for (const category of ["misfiled-registry", "mislaid-consulate", "afterlight-cartographers", "citizen"]) {
      expect(opportunityNotices.filter((notice) => notice.category === category)).toHaveLength(3);
    }
    expect(opportunityNotices.every((notice) => notice.responses.length === 2)).toBe(true);
    expect(new Set(opportunityNotices.flatMap((notice) => notice.responses.map((response) => response.id)))).toHaveLength(24);
  });

  it("offers four stable, non-repeating sets of three daytime notices", () => {
    const history = {} as Parameters<typeof getOpportunityCandidates>[2];
    const seen = new Set<string>();
    for (let chapter = 2; chapter <= 5; chapter += 1) {
      const candidates = getOpportunityCandidates(chapter, DEMO_JOURNEY_SEED, history);
      expect(getOpportunityCandidates(chapter, DEMO_JOURNEY_SEED, history).map((notice) => notice.id)).toEqual(candidates.map((notice) => notice.id));
      expect(candidates).toHaveLength(3);
      expect(candidates.every((notice) => !seen.has(notice.id))).toBe(true);
      candidates.forEach((notice) => seen.add(notice.id));
      history[chapter] = createOpportunityRecord(chapter, DEMO_JOURNEY_SEED, history, undefined, undefined, `2026-07-${String(10 + chapter).padStart(2, "0")}T13:00:00.000Z`);
    }
    expect(seen).toHaveLength(12);
  });

  it("settles one offered response once and preserves its later echo", () => {
    const candidate = getOpportunityCandidates(2, DEMO_JOURNEY_SEED, {})[0];
    const record = createOpportunityRecord(2, DEMO_JOURNEY_SEED, {}, candidate.id, candidate.responses[1].id, "2026-07-12T13:00:00.000Z");
    expect(record.dismissed).toBe(false);
    expect(getOpportunityResponse(record)?.result).toBe(candidate.responses[1].result);
    expect(getOpportunityResponse(record)?.echo).toBeTruthy();
    expect(createOpportunityRecord(2, 99, { 2: record }, undefined, undefined, "2026-07-13T13:00:00.000Z")).toEqual(record);
  });

  it("defines four manifest-backed witnesses with clue-gated dossiers", () => {
    expect(caseCharacters).toHaveLength(4);
    expect(caseCharacters.map((character) => character.encounterChapter)).toEqual([2, 3, 4, 5]);
    const clueIds = new Set(nightShiftCase.clues.map((clue) => clue.id));

    for (const character of caseCharacters) {
      expect(getAsset(character.assetId).category).toBe("character-portrait");
      expect(character.revealClueIds.every((clueId) => clueIds.has(clueId))).toBe(true);
      expect(isCharacterRevealed(character, [])).toBe(false);
      expect(isCharacterRevealed(character, character.revealClueIds)).toBe(true);
      expect(getChapterCharacter(character.encounterChapter)?.id).toBe(character.id);
    }

    expect(getChapterCharacter(1)).toBeUndefined();
  });

  it("defines three manifest-backed districts with stable atlas entries", () => {
    expect(cityDistricts).toHaveLength(3);
    expect(cityDistricts.map((district) => district.introducedChapter)).toEqual([1, 3, 4]);
    for (const district of cityDistricts) {
      expect(getAsset(district.assetId).category).toBe("district-illustration");
      expect(district.landmarks).toHaveLength(3);
      expect(getCityDistrict(district.id)).toEqual(district);
    }
  });

  it("derives four deterministic growth stages from restored progress", () => {
    expect(growthStageFromProgress(0)).toBe("seed");
    expect(growthStageFromProgress(24.99)).toBe("seed");
    expect(growthStageFromProgress(25)).toBe("sprout");
    expect(growthStageFromProgress(50)).toBe("leaf");
    expect(growthStageFromProgress(84.99)).toBe("leaf");
    expect(growthStageFromProgress(85)).toBe("bloom");
    expect(growthStageFromProgress(999)).toBe("bloom");
  });

  it("derives real-night quality from explicit duration boundaries", () => {
    expect(qualityFromDuration(299)).toBe("interrupted");
    expect(qualityFromDuration(300)).toBe("regular");
    expect(qualityFromDuration(419)).toBe("regular");
    expect(qualityFromDuration(420)).toBe("restful");
  });

  it("partitions the local clock into four complete city watches", () => {
    const at = (hour: number, minute = 0) => new Date(2026, 6, 23, hour, minute);
    expect(cityWatches.map((watch) => watch.id)).toEqual(["lamplighting", "midnight", "last-watch", "daylight"]);
    expect(getCityWatchId(at(18, 59))).toBe("daylight");
    expect(getCityWatchId(at(19))).toBe("lamplighting");
    expect(getCityWatchId(at(22, 59))).toBe("lamplighting");
    expect(getCityWatchId(at(23))).toBe("midnight");
    expect(getCityWatchId(at(1, 59))).toBe("midnight");
    expect(getCityWatchId(at(2))).toBe("last-watch");
    expect(getCityWatchId(at(5, 59))).toBe("last-watch");
    expect(getCityWatchId(at(6))).toBe("daylight");
  });

  it("defines twenty literary echoes without reward or punishment language", () => {
    expect(cityWatchEchoes).toHaveLength(20);
    expect(new Set(cityWatchEchoes.map((echo) => `${echo.chapter}/${echo.watchId}`))).toHaveLength(20);
    for (const watch of cityWatches) {
      expect(cityWatchEchoes.filter((echo) => echo.watchId === watch.id)).toHaveLength(5);
      expect(getCityWatch(watch.id)).toEqual(watch);
    }
    for (const echo of cityWatchEchoes) {
      expect(getCityWatchEcho(echo.chapter, echo.watchId)).toEqual(echo);
      expect(`${echo.scene}${echo.encounter}${echo.fieldNote}`).not.toMatch(/积分|奖励|分数|好感|失败/);
    }
  });

  it("defines one non-scoring sleep-gap echo for every night", () => {
    expect(wakeEchoes).toHaveLength(5);
    expect(wakeEchoes.map((echo) => echo.chapter)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(wakeEchoes.map((echo) => echo.id))).toHaveLength(5);
    for (const echo of wakeEchoes) {
      expect(getWakeEcho(echo.chapter)).toEqual(echo);
      expect(getWakeEchoById(echo.id)).toEqual(echo);
      expect(`${echo.title}${echo.sound}${echo.glimpse}${echo.fieldNote}`).not.toMatch(/积分|奖励|分数|好感|失败|惩罚/);
    }
  });

  it("records at most one sleep-gap echo without ending a session", () => {
    const session = startSleepSession("real", "regular", new Date("2026-07-22T22:00:00.000Z"));
    const first = recordWakeEcho(session, "sleep-gap-01", new Date("2026-07-23T00:43:00.000Z"));
    const second = recordWakeEcho(first, "sleep-gap-01", new Date("2026-07-23T01:18:00.000Z"));

    expect(first.wakeEcho).toEqual({ echoId: "sleep-gap-01", recordedAt: "2026-07-23T00:43:00.000Z" });
    expect(first.endedAt).toBeUndefined();
    expect(second).toBe(first);
  });

  it("settles a real night from its persisted start time", () => {
    const startedAt = new Date("2026-07-22T22:00:00.000Z");
    const session = startSleepSession("real", "regular", startedAt);
    const completed = finishSleepSession(session, new Date("2026-07-23T04:30:00.000Z"));

    expect(completed.durationMinutes).toBe(390);
    expect(completed.quality).toBe("regular");
    expect(completed.endedAt).toBe("2026-07-23T04:30:00.000Z");
    expect(session.watchId).toBe(getCityWatchId(startedAt));
    expect(resolveNight(lastTramCampaign, 1, completed.quality).clueIds.length).toBeGreaterThan(0);
  });

  it("keeps demo quality deterministic and compresses seal progress", () => {
    const session = startSleepSession("demo", "restful", new Date(2026, 6, 22, 12, 0));
    const completed = finishSleepSession(session, new Date("2026-07-22T22:00:12.000Z"));

    expect(completed.durationMinutes).toBe(484);
    expect(completed.quality).toBe("restful");
    expect(session.watchId).toBe(DEMO_CITY_WATCH_ID);
    expect(nightSealProgress(session, new Date("2026-07-22T22:00:01.000Z"))).toBe(3);
  });

  it("restores real-night seal progress from elapsed wall time", () => {
    const session = startSleepSession("real", "regular", new Date("2026-07-22T22:00:00.000Z"));

    expect(nightSealProgress(session, new Date("2026-07-23T02:00:00.000Z"))).toBe(50);
    expect(nightSealProgress(session, new Date("2026-07-23T08:00:00.000Z"))).toBe(100);
  });

  it("defines three evidence syntheses using real case clues", () => {
    const clueIds = new Set(nightShiftCase.clues.map((clue) => clue.id));
    expect(evidenceSyntheses).toHaveLength(3);
    for (const synthesis of evidenceSyntheses) {
      expect(synthesis.inputIds.every((clueId) => clueIds.has(clueId))).toBe(true);
    }
  });

  it("looks up deterministic synthesis recipes by stable output id", () => {
    expect(getCampaignEvidenceSynthesis(lastTramCampaign, "mina-evelyn")?.inputIds).toEqual(["flower-cycle", "postcard"]);
    expect(getCampaignEvidenceSynthesis(lastTramCampaign, "missing-synthesis")).toBeUndefined();
  });

  it("builds and validates a single-clue share link", () => {
    const shareUrl = createClueShareUrl("https://night-shift-zeta.vercel.app/?old=1#desk", DEFAULT_CAMPAIGN_ID, "flower-cycle");

    expect(shareUrl).toBe("https://night-shift-zeta.vercel.app/?case=case-001&clue=flower-cycle");
    expect(readSharedClueQuery("?clue=flower-cycle")).toEqual({ present: true, campaignId: DEFAULT_CAMPAIGN_ID, clue: nightShiftCase.clues.find((clue) => clue.id === "flower-cycle") });
    expect(readSharedClueQuery(`?case=${RAIN_RADIO_CAMPAIGN_ID}&clue=radio-warm-dial`)).toEqual({
      present: true,
      campaignId: RAIN_RADIO_CAMPAIGN_ID,
      clue: rainRadioCampaign.case.clues.find((clue) => clue.id === "radio-warm-dial"),
    });
    expect(readSharedClueQuery(`?case=${THIRTEENTH_LOAF_CAMPAIGN_ID}&clue=blank-guest-share`)).toEqual({
      present: true,
      campaignId: THIRTEENTH_LOAF_CAMPAIGN_ID,
      clue: thirteenthLoafCampaign.case.clues.find((clue) => clue.id === "blank-guest-share"),
    });
    expect(readSharedClueQuery("?clue=unknown")).toEqual({ present: true, campaignId: DEFAULT_CAMPAIGN_ID, clue: undefined });
    expect(readSharedClueQuery("?case=case-404&clue=flower-cycle")).toEqual({ present: true });
    expect(readSharedClueQuery("?chapter=2")).toEqual({ present: false });
    expect(removeSharedClueQuery("https://night-shift-zeta.vercel.app/?case=case-001&clue=flower-cycle&from=qr#desk")).toBe("/?from=qr#desk");
  });

  it("looks up evidence only inside the selected campaign", () => {
    const synthesis = rainRadioCampaign.syntheses[0];
    expect(getCampaignEvidenceSynthesis(rainRadioCampaign, synthesis.id)).toEqual(synthesis);
    expect(getCampaignEvidenceSynthesis(rainRadioCampaign, "mina-evelyn")).toBeUndefined();
  });
});
