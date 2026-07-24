import { describe, expect, test } from "vitest";
import type { EvidenceRelation } from "@/src/lib/game-engine/schema";
import { deriveEvidenceBoardHints } from "@/src/lib/game-engine/evidence-board";

const relations: EvidenceRelation[] = [
  {
    id: "relation-ab",
    clueIds: ["a", "b"],
    statement: "A and B agree",
    explanation: "The first relation.",
  },
  {
    id: "relation-cd",
    clueIds: ["c", "d"],
    statement: "C and D agree",
    explanation: "The second relation.",
  },
];

describe("evidence board hints", () => {
  test("only exposes unconfirmed relations whose clues are both unlocked", () => {
    expect(deriveEvidenceBoardHints({
      relations,
      unlockedClueIds: ["a", "b", "c"],
      confirmedRelationIds: [],
      selectedClueIds: [],
    })).toEqual({
      openRelationIds: ["relation-ab"],
      checkableClueIds: ["a", "b"],
      compatibleClueIds: [],
    });
  });

  test("derives compatible candidates from one selected clue without changing relations", () => {
    expect(deriveEvidenceBoardHints({
      relations,
      unlockedClueIds: ["a", "b", "c", "d"],
      confirmedRelationIds: ["relation-cd"],
      selectedClueIds: ["a"],
    })).toEqual({
      openRelationIds: ["relation-ab"],
      checkableClueIds: ["a", "b"],
      compatibleClueIds: ["b"],
    });
  });

  test("does not suggest candidates when two clues are awaiting explicit confirmation", () => {
    expect(deriveEvidenceBoardHints({
      relations,
      unlockedClueIds: ["a", "b", "c", "d"],
      confirmedRelationIds: [],
      selectedClueIds: ["a", "b"],
    }).compatibleClueIds).toEqual([]);
  });
});
