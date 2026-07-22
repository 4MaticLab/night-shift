export const endingIds = ["public", "protect", "return"] as const;
export type EndingId = (typeof endingIds)[number];

interface EndingProgress {
  unlockedClueIds: string[];
  unlockedCollectibleIds: string[];
  confirmedRelations: string[];
}

export function canUnlockTrueEnding(progress: EndingProgress): boolean {
  return progress.unlockedClueIds.length === 12
    && progress.unlockedCollectibleIds.length >= 7
    && progress.confirmedRelations.length >= 3;
}

export function canChooseEnding(endingId: string, progress: EndingProgress): endingId is EndingId {
  if (!endingIds.includes(endingId as EndingId)) return false;
  return endingId !== "return" || canUnlockTrueEnding(progress);
}
