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

describe("Night Shift case content", () => {
  it("contains the complete five-night mystery", () => {
    expect(nightShiftCase.chapters).toHaveLength(5);
    expect(nightShiftCase.clues).toHaveLength(12);
    expect(nightShiftCase.collectibles).toHaveLength(8);
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
