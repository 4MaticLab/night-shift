import type { EvidenceRelation } from "./schema";

export interface EvidenceBoardHints {
  openRelationIds: string[];
  checkableClueIds: string[];
  compatibleClueIds: string[];
}

export function deriveEvidenceBoardHints({
  relations,
  unlockedClueIds,
  confirmedRelationIds,
  selectedClueIds,
}: {
  relations: EvidenceRelation[];
  unlockedClueIds: string[];
  confirmedRelationIds: string[];
  selectedClueIds: string[];
}): EvidenceBoardHints {
  const unlocked = new Set(unlockedClueIds);
  const confirmed = new Set(confirmedRelationIds);
  const selectedClueId = selectedClueIds.length === 1 ? selectedClueIds[0] : null;
  const openRelations = relations.filter((relation) =>
    !confirmed.has(relation.id)
    && relation.clueIds.every((clueId) => unlocked.has(clueId)),
  );
  const checkable = new Set(openRelations.flatMap((relation) => relation.clueIds));
  const compatible = new Set<string>();

  if (selectedClueId) {
    for (const relation of openRelations) {
      if (!relation.clueIds.includes(selectedClueId)) continue;
      for (const clueId of relation.clueIds) {
        if (clueId !== selectedClueId) compatible.add(clueId);
      }
    }
  }

  return {
    openRelationIds: openRelations.map((relation) => relation.id),
    checkableClueIds: [...checkable],
    compatibleClueIds: [...compatible],
  };
}
