import type { GameView } from "@/src/components/game/types";
import type { Phase } from "@/src/stores/game-store";

export const CASE_LIBRARY_PATH = "/";
export const CASE_INTRO_PATH = "/case-intro";
export const NIGHT_RUN_PATH = "/game/night";
export const ENDING_PATH = "/game/ending";

export const GAME_VIEW_PATHS: Record<GameView, string> = {
  tonight: "/game/tonight",
  report: "/game/report",
  board: "/game/board",
  collection: "/game/collection",
  archive: "/game/archive",
};

export interface GameRouteSnapshot {
  started: boolean;
  phase: Phase;
}

export function getGameViewPath(view: GameView): string {
  return GAME_VIEW_PATHS[view];
}

export function getGameViewFromPath(pathname: string): GameView | undefined {
  return (Object.entries(GAME_VIEW_PATHS) as [GameView, string][])
    .find(([, path]) => path === pathname)?.[0];
}

export function getResumeGamePath(snapshot: GameRouteSnapshot): string {
  if (snapshot.phase === "night") return NIGHT_RUN_PATH;
  if (snapshot.phase === "ending") return ENDING_PATH;
  if (snapshot.phase === "morning") return GAME_VIEW_PATHS.report;
  return GAME_VIEW_PATHS.tonight;
}

export function resolveGamePath(snapshot: GameRouteSnapshot, pathname: string): string | null {
  if (!snapshot.started) {
    return pathname === CASE_LIBRARY_PATH || pathname === CASE_INTRO_PATH
      ? null
      : CASE_LIBRARY_PATH;
  }

  if (snapshot.phase === "night") {
    return pathname === NIGHT_RUN_PATH ? null : NIGHT_RUN_PATH;
  }

  if (snapshot.phase === "ending") {
    if (pathname === CASE_LIBRARY_PATH || pathname === ENDING_PATH) return null;
    return ENDING_PATH;
  }

  if (pathname === CASE_INTRO_PATH || pathname === NIGHT_RUN_PATH || pathname === ENDING_PATH) {
    return getResumeGamePath(snapshot);
  }

  if (snapshot.phase === "morning" && pathname === GAME_VIEW_PATHS.tonight) {
    return GAME_VIEW_PATHS.report;
  }

  return null;
}
