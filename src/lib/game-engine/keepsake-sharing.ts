import { getSouvenir, souvenirs } from "@/src/content/souvenirs";
import type { Souvenir } from "@/src/lib/game-engine/schema";

export const SHARED_KEEPSAKE_QUERY_KEY = "keepsake";

/** The canonical local-first path that receives a shared keepsake. */
export const KEEPSAKE_PATH = "/keepsake";

/** Returns the souvenir for a stable id, or undefined when the id is unknown. */
export function getShareableKeepsake(keepsakeId: unknown): Souvenir | undefined {
  if (typeof keepsakeId !== "string") return undefined;
  return souvenirs.find((souvenir) => souvenir.id === keepsakeId);
}

/**
 * Build the shareable URL/QR target for a keepsake. Only the stable souvenir id
 * is encoded — no accounts, progress, or personal data travel with the link.
 */
export function createKeepsakeShareUrl(baseUrl: string | URL, keepsakeId: string): string {
  if (!getShareableKeepsake(keepsakeId)) throw new Error("Unknown keepsake");
  const url = new URL(KEEPSAKE_PATH, baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARED_KEEPSAKE_QUERY_KEY, keepsakeId);
  return url.toString();
}

/** Parse a location search string for a shared keepsake reference. */
export function readSharedKeepsakeQuery(search: string): { present: boolean; keepsake?: Souvenir } {
  const params = new URLSearchParams(search);
  if (!params.has(SHARED_KEEPSAKE_QUERY_KEY)) return { present: false };
  return { present: true, keepsake: getShareableKeepsake(params.get(SHARED_KEEPSAKE_QUERY_KEY)) };
}

/** Strip the shared-keepsake query so the URL can be replaced after receiving. */
export function removeSharedKeepsakeQuery(urlValue: string | URL): string {
  const url = new URL(urlValue);
  url.searchParams.delete(SHARED_KEEPSAKE_QUERY_KEY);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Keep only known souvenir ids, de-duplicated and content-ordered. */
export function sanitizeKeepsakeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(value.filter((id): id is string => typeof id === "string" && Boolean(getShareableKeepsake(id))));
  return souvenirs.filter((souvenir) => known.has(souvenir.id)).map((souvenir) => souvenir.id);
}

export { getSouvenir, souvenirs };
