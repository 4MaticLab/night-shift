import { describe, expect, test } from "vitest";
import type { Clue, EvidenceSynthesis } from "@/src/lib/game-engine/schema";
import {
  canSynthesizeEvidence,
  deriveEvidenceChapters,
  getEvidenceArchiveItems,
  getReadyEvidenceSyntheses,
  validateEvidenceSynthesisGraph,
} from "@/src/lib/game-engine/evidence-synthesis";

const clues: Clue[] = [
  {
    id: "a",
    title: "A",
    summary: "First clue",
    detail: "The first clue in full.",
    cityObjection: "The city supplies a sufficiently long objection to clue A.",
    marginNote: "A sufficiently long note.",
    type: "object",
    chapter: 1,
    relatedIds: [],
  },
  {
    id: "b",
    title: "B",
    summary: "Second clue",
    detail: "The second clue in full.",
    cityObjection: "The city supplies a sufficiently long objection to clue B.",
    marginNote: "Another long note.",
    type: "event",
    chapter: 2,
    relatedIds: [],
  },
  {
    id: "c",
    title: "C",
    summary: "Third clue",
    detail: "The third clue in full.",
    cityObjection: "The city supplies a sufficiently long objection to clue C.",
    marginNote: "A third long note.",
    type: "place",
    chapter: 3,
    relatedIds: [],
  },
];

const syntheses: EvidenceSynthesis[] = [
  {
    id: "ab",
    inputIds: ["a", "b"],
    title: "A and B agree",
    explanation: "The first inference combines A and B.",
  },
  {
    id: "abc",
    inputIds: ["ab", "c"],
    title: "The chain is complete",
    explanation: "The second inference consumes the first inference and C.",
  },
];

describe("evidence synthesis graph", () => {
  test("only exposes recipes after every input has entered the evidence inventory", () => {
    expect(getReadyEvidenceSyntheses({
      syntheses,
      unlockedClueIds: ["a"],
      synthesizedEvidenceIds: [],
    })).toEqual([]);
    expect(getReadyEvidenceSyntheses({
      syntheses,
      unlockedClueIds: ["a", "b"],
      synthesizedEvidenceIds: [],
    }).map((item) => item.id)).toEqual(["ab"]);
  });

  test("allows a synthesized inference to unlock a later recipe", () => {
    expect(canSynthesizeEvidence({
      synthesis: syntheses[1],
      unlockedClueIds: ["a", "b", "c"],
      synthesizedEvidenceIds: [],
    })).toBe(false);
    expect(getReadyEvidenceSyntheses({
      syntheses,
      unlockedClueIds: ["a", "b", "c"],
      synthesizedEvidenceIds: ["ab"],
    }).map((item) => item.id)).toEqual(["abc"]);
  });

  test("projects raw clues and completed inferences into one searchable archive", () => {
    const items = getEvidenceArchiveItems({
      clues,
      syntheses,
      unlockedClueIds: ["a", "b", "c"],
      synthesizedEvidenceIds: ["ab"],
    });
    expect(items.map(({ id, kind, chapter }) => ({ id, kind, chapter }))).toEqual([
      { id: "a", kind: "clue", chapter: 1 },
      { id: "b", kind: "clue", chapter: 2 },
      { id: "ab", kind: "inference", chapter: 2 },
      { id: "c", kind: "clue", chapter: 3 },
    ]);
    expect(items.find((item) => item.id === "a")?.searchText).toContain("sufficiently long note");
    expect(deriveEvidenceChapters(clues, syntheses).get("abc")).toBe(3);
  });

  test("rejects unknown inputs, duplicate outputs, and unreachable cycles", () => {
    expect(validateEvidenceSynthesisGraph(clues, syntheses)).toBeNull();
    expect(validateEvidenceSynthesisGraph(clues, [{
      ...syntheses[0],
      inputIds: ["a", "missing"],
    }])).toContain("unknown evidence missing");
    expect(validateEvidenceSynthesisGraph(clues, [
      { ...syntheses[0], id: "a" },
    ])).toContain("duplicate evidence output a");
    expect(validateEvidenceSynthesisGraph(clues, [
      { ...syntheses[0], id: "one", inputIds: ["two", "a"] },
      { ...syntheses[1], id: "two", inputIds: ["one", "b"] },
    ])).toContain("unreachable cycle");
  });
});
