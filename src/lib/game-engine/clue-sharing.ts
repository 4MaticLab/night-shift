import { nightShiftCase } from "@/src/content/case";
import type { Clue } from "@/src/lib/game-engine/schema";

export const SHARED_CLUE_QUERY_KEY = "clue";

export function getShareableClue(clueId: unknown): Clue | undefined {
  if (typeof clueId !== "string") return undefined;
  return nightShiftCase.clues.find((clue) => clue.id === clueId);
}

export function createClueShareUrl(baseUrl: string | URL, clueId: string): string {
  if (!getShareableClue(clueId)) throw new Error("Unknown clue");
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARED_CLUE_QUERY_KEY, clueId);
  return url.toString();
}

export function readSharedClueQuery(search: string): { present: boolean; clue?: Clue } {
  const params = new URLSearchParams(search);
  if (!params.has(SHARED_CLUE_QUERY_KEY)) return { present: false };
  return { present: true, clue: getShareableClue(params.get(SHARED_CLUE_QUERY_KEY)) };
}

export function removeSharedClueQuery(urlValue: string | URL): string {
  const url = new URL(urlValue);
  url.searchParams.delete(SHARED_CLUE_QUERY_KEY);
  return `${url.pathname}${url.search}${url.hash}`;
}
