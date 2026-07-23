export const endingIds = ["public", "protect", "return"] as const;
export type EndingId = (typeof endingIds)[number];

export interface EndingProgress {
  unlockedClueIds: string[];
  unlockedCollectibleIds: string[];
  confirmedRelations: string[];
}

export interface EndingRequirements {
  trueEndingId: EndingId;
  requiredClueCount: number;
  requiredCollectibleCount: number;
  requiredRelationCount: number;
}

export const defaultEndingRequirements: EndingRequirements = {
  trueEndingId: "return",
  requiredClueCount: 12,
  requiredCollectibleCount: 7,
  requiredRelationCount: 3,
};

export function canUnlockTrueEnding(progress: EndingProgress, requirements: EndingRequirements = defaultEndingRequirements): boolean {
  return progress.unlockedClueIds.length >= requirements.requiredClueCount
    && progress.unlockedCollectibleIds.length >= requirements.requiredCollectibleCount
    && progress.confirmedRelations.length >= requirements.requiredRelationCount;
}

export function canChooseEnding(endingId: string, progress: EndingProgress, requirements: EndingRequirements = defaultEndingRequirements): endingId is EndingId {
  if (!endingIds.includes(endingId as EndingId)) return false;
  return endingId !== requirements.trueEndingId || canUnlockTrueEnding(progress, requirements);
}
