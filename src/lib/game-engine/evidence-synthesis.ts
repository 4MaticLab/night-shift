import type { Clue, EvidenceSynthesis } from "./schema";

export interface EvidenceArchiveItem {
  id: string;
  title: string;
  summary: string;
  detail: string;
  kind: "clue" | "inference";
  chapter: number;
  type: Clue["type"] | "inference";
  inputIds: string[];
  searchText: string;
}

export function getEvidenceInventoryIds(
  unlockedClueIds: string[],
  synthesizedEvidenceIds: string[],
): Set<string> {
  return new Set([...unlockedClueIds, ...synthesizedEvidenceIds]);
}

export function getReadyEvidenceSyntheses({
  syntheses,
  unlockedClueIds,
  synthesizedEvidenceIds,
}: {
  syntheses: EvidenceSynthesis[];
  unlockedClueIds: string[];
  synthesizedEvidenceIds: string[];
}): EvidenceSynthesis[] {
  const inventory = getEvidenceInventoryIds(unlockedClueIds, synthesizedEvidenceIds);
  const completed = new Set(synthesizedEvidenceIds);
  return syntheses.filter((synthesis) =>
    !completed.has(synthesis.id)
    && synthesis.inputIds.every((inputId) => inventory.has(inputId)),
  );
}

export function canSynthesizeEvidence({
  synthesis,
  unlockedClueIds,
  synthesizedEvidenceIds,
}: {
  synthesis: EvidenceSynthesis;
  unlockedClueIds: string[];
  synthesizedEvidenceIds: string[];
}): boolean {
  if (synthesizedEvidenceIds.includes(synthesis.id)) return false;
  const inventory = getEvidenceInventoryIds(unlockedClueIds, synthesizedEvidenceIds);
  return synthesis.inputIds.every((inputId) => inventory.has(inputId));
}

export function getEvidenceArchiveItems({
  clues,
  syntheses,
  unlockedClueIds,
  synthesizedEvidenceIds,
}: {
  clues: Clue[];
  syntheses: EvidenceSynthesis[];
  unlockedClueIds: string[];
  synthesizedEvidenceIds: string[];
}): EvidenceArchiveItem[] {
  const unlocked = new Set(unlockedClueIds);
  const synthesized = new Set(synthesizedEvidenceIds);
  const chapters = deriveEvidenceChapters(clues, syntheses);
  const rawItems: EvidenceArchiveItem[] = clues
    .filter((clue) => unlocked.has(clue.id))
    .map((clue) => ({
      id: clue.id,
      title: clue.title,
      summary: clue.summary,
      detail: clue.detail,
      kind: "clue",
      chapter: clue.chapter,
      type: clue.type,
      inputIds: [],
      searchText: [clue.title, clue.summary, clue.detail, clue.cityObjection, clue.marginNote].join(" "),
    }));
  const inferenceItems: EvidenceArchiveItem[] = syntheses
    .filter((synthesis) => synthesized.has(synthesis.id))
    .map((synthesis) => ({
      id: synthesis.id,
      title: synthesis.title,
      summary: synthesis.explanation,
      detail: synthesis.explanation,
      kind: "inference",
      chapter: chapters.get(synthesis.id) ?? 1,
      type: "inference",
      inputIds: synthesis.inputIds,
      searchText: [synthesis.title, synthesis.explanation].join(" "),
    }));
  return [...rawItems, ...inferenceItems].sort((first, second) =>
    first.chapter - second.chapter || (first.kind === second.kind ? 0 : first.kind === "clue" ? -1 : 1),
  );
}

export function deriveEvidenceChapters(
  clues: Clue[],
  syntheses: EvidenceSynthesis[],
): Map<string, number> {
  const chapters = new Map(clues.map((clue) => [clue.id, clue.chapter]));
  const remaining = new Map(syntheses.map((synthesis) => [synthesis.id, synthesis]));

  while (remaining.size > 0) {
    let progressed = false;
    for (const [id, synthesis] of remaining) {
      const inputChapters = synthesis.inputIds.map((inputId) => chapters.get(inputId));
      if (inputChapters.some((chapter) => chapter === undefined)) continue;
      chapters.set(id, Math.max(...inputChapters as number[]));
      remaining.delete(id);
      progressed = true;
    }
    if (!progressed) break;
  }

  return chapters;
}

export function validateEvidenceSynthesisGraph(
  clues: Clue[],
  syntheses: EvidenceSynthesis[],
): string | null {
  const rawIds = new Set(clues.map((clue) => clue.id));
  const outputIds = new Set<string>();
  for (const synthesis of syntheses) {
    if (rawIds.has(synthesis.id) || outputIds.has(synthesis.id)) {
      return `duplicate evidence output ${synthesis.id}`;
    }
    outputIds.add(synthesis.id);
    if (new Set(synthesis.inputIds).size !== synthesis.inputIds.length) {
      return `synthesis ${synthesis.id} repeats an input`;
    }
  }

  const allIds = new Set([...rawIds, ...outputIds]);
  for (const synthesis of syntheses) {
    const unknown = synthesis.inputIds.find((inputId) => !allIds.has(inputId));
    if (unknown) return `synthesis ${synthesis.id} references unknown evidence ${unknown}`;
    if (synthesis.inputIds.includes(synthesis.id)) return `synthesis ${synthesis.id} references itself`;
  }

  const reachable = new Set(rawIds);
  const remaining = new Map(syntheses.map((synthesis) => [synthesis.id, synthesis]));
  while (remaining.size > 0) {
    let progressed = false;
    for (const [id, synthesis] of remaining) {
      if (!synthesis.inputIds.every((inputId) => reachable.has(inputId))) continue;
      reachable.add(id);
      remaining.delete(id);
      progressed = true;
    }
    if (!progressed) {
      return `evidence synthesis graph contains an unreachable cycle: ${[...remaining.keys()].join(", ")}`;
    }
  }
  return null;
}
