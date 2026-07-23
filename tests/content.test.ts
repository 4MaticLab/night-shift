import { describe, expect, it } from "vitest";
import { nightShiftCase } from "@/src/content/case";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import { preparations } from "@/src/content/preparations";
import { getAsset, getNightSealAsset, getPostcardAsset } from "@/src/content/assets";
import { getJourneyPostcard, getPostcardPreparationNote, journeyPostcards } from "@/src/content/postcards";
import {
  finishSleepSession,
  nightSealProgress,
  qualityFromDuration,
  startSleepSession,
} from "@/src/lib/game-engine/sleep-session";
import { evidenceRelations, matchEvidenceRelation } from "@/src/content/relations";
import { getDefaultChoiceId, getRouteDirection, routeDirections } from "@/src/content/routes";
import { getNightBotanical, growthStageFromProgress, nightBotanicals } from "@/src/content/botany";
import { citySocieties, createSocietyMemory, getCitySociety, getSocietyLetter, getSocietyTitle } from "@/src/content/societies";
import { correspondencePostures, correspondencePrompts, createCorrespondenceRecord, getCorrespondencePrompt, getCorrespondenceReply, getDominantCorrespondenceStance, getLatestSocietyReply } from "@/src/content/correspondence";
import { createSouvenirRecord, DEMO_JOURNEY_SEED, getSouvenir, selectSouvenir, souvenirs } from "@/src/content/souvenirs";
import { createOpportunityRecord, getOpportunityCandidates, getOpportunityResponse, opportunityNotices } from "@/src/content/opportunities";
import { caseCharacters, getChapterCharacter, isCharacterRevealed } from "@/src/content/characters";
import { cityDistricts, getCityDistrict } from "@/src/content/districts";
import { endingEpilogues, getEndingEpilogue } from "@/src/content/endings";

describe("Night Shift case content", () => {
  it("contains the complete five-night mystery", () => {
    expect(nightShiftCase.chapters).toHaveLength(5);
    expect(nightShiftCase.clues).toHaveLength(12);
    expect(nightShiftCase.collectibles).toHaveLength(8);
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
      expect(resolveNight(chapter, "interrupted").clueIds.length).toBeGreaterThan(0);
      expect(resolveNight(chapter, "regular").clueIds.length).toBeGreaterThan(0);
      expect(resolveNight(chapter, "restful").clueIds.length).toBeGreaterThan(0);
    }
  });

  it("gives restful nights a route at least as rich as interrupted nights", () => {
    expect(resolveNight(1, "restful").route.length).toBeGreaterThanOrEqual(resolveNight(1, "interrupted").route.length);
    expect(resolveNight(1, "restful").observation).toBeTruthy();
    expect(resolveNight(1, "interrupted").echo).toBeTruthy();
  });

  it("lets preparation change atmosphere without changing fixed clues", () => {
    const results = preparations.map((item) => resolveNight(1, "regular", item.id));
    expect(new Set(results.map((result) => result.preparationEcho)).size).toBe(3);
    expect(results.map((result) => result.clueIds)).toEqual([
      results[0].clueIds,
      results[0].clueIds,
      results[0].clueIds,
    ]);
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
      const results = chapter.choices.map((choice) => resolveNight(chapter.number, "regular", "side-lamp", choice.id));
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
    expect(resolveNight(1, "regular").choiceId).toBe(getDefaultChoiceId(1));
    expect(() => resolveNight(1, "regular", "", "not-a-route")).toThrow(/Unknown choice/);
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

  it("settles a real night from its persisted start time", () => {
    const startedAt = new Date("2026-07-22T22:00:00.000Z");
    const session = startSleepSession("real", "regular", startedAt);
    const completed = finishSleepSession(session, new Date("2026-07-23T04:30:00.000Z"));

    expect(completed.durationMinutes).toBe(390);
    expect(completed.quality).toBe("regular");
    expect(completed.endedAt).toBe("2026-07-23T04:30:00.000Z");
    expect(resolveNight(1, completed.quality).clueIds.length).toBeGreaterThan(0);
  });

  it("keeps demo quality deterministic and compresses seal progress", () => {
    const session = startSleepSession("demo", "restful", new Date("2026-07-22T22:00:00.000Z"));
    const completed = finishSleepSession(session, new Date("2026-07-22T22:00:12.000Z"));

    expect(completed.durationMinutes).toBe(484);
    expect(completed.quality).toBe("restful");
    expect(nightSealProgress(session, new Date("2026-07-22T22:00:01.000Z"))).toBe(3);
  });

  it("restores real-night seal progress from elapsed wall time", () => {
    const session = startSleepSession("real", "regular", new Date("2026-07-22T22:00:00.000Z"));

    expect(nightSealProgress(session, new Date("2026-07-23T02:00:00.000Z"))).toBe(50);
    expect(nightSealProgress(session, new Date("2026-07-23T08:00:00.000Z"))).toBe(100);
  });

  it("defines three evidence relations using real case clues", () => {
    const clueIds = new Set(nightShiftCase.clues.map((clue) => clue.id));
    expect(evidenceRelations).toHaveLength(3);
    for (const relation of evidenceRelations) {
      expect(relation.clueIds.every((clueId) => clueIds.has(clueId))).toBe(true);
    }
  });

  it("matches evidence pairs in either order and rejects false links", () => {
    expect(matchEvidenceRelation("flower-cycle", "postcard")?.id).toBe("mina-evelyn");
    expect(matchEvidenceRelation("postcard", "flower-cycle")?.id).toBe("mina-evelyn");
    expect(matchEvidenceRelation("ticket-date", "postcard")).toBeUndefined();
    expect(matchEvidenceRelation("postcard", "postcard")).toBeUndefined();
  });
});
