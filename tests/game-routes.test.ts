import { describe, expect, it } from "vitest";
import {
  CASE_INTRO_PATH,
  CASE_LIBRARY_PATH,
  ENDING_PATH,
  GAME_VIEW_PATHS,
  getGameViewFromPath,
  getResumeGamePath,
  NIGHT_RUN_PATH,
  resolveGamePath,
} from "@/src/lib/game-routes";

describe("game surface routes", () => {
  it("maps every bottom navigation surface to a stable path", () => {
    expect(GAME_VIEW_PATHS).toEqual({
      tonight: "/game/tonight",
      report: "/game/report",
      board: "/game/board",
      collection: "/game/collection",
      archive: "/game/archive",
    });
    expect(getGameViewFromPath(GAME_VIEW_PATHS.board)).toBe("board");
    expect(getGameViewFromPath(NIGHT_RUN_PATH)).toBeUndefined();
  });

  it("keeps a fresh save in the library or intake and rejects game surfaces", () => {
    const fresh = { started: false, phase: "day" as const };
    expect(resolveGamePath(fresh, CASE_LIBRARY_PATH)).toBeNull();
    expect(resolveGamePath(fresh, CASE_INTRO_PATH)).toBeNull();
    expect(resolveGamePath(fresh, GAME_VIEW_PATHS.board)).toBe(CASE_LIBRARY_PATH);
    expect(resolveGamePath(fresh, NIGHT_RUN_PATH)).toBe(CASE_LIBRARY_PATH);
  });

  it("uses the persisted phase as the canonical resume surface", () => {
    expect(getResumeGamePath({ started: true, phase: "day" })).toBe(GAME_VIEW_PATHS.tonight);
    expect(getResumeGamePath({ started: true, phase: "ready" })).toBe(GAME_VIEW_PATHS.tonight);
    expect(getResumeGamePath({ started: true, phase: "morning" })).toBe(GAME_VIEW_PATHS.report);
    expect(getResumeGamePath({ started: true, phase: "night" })).toBe(NIGHT_RUN_PATH);
    expect(getResumeGamePath({ started: true, phase: "ending" })).toBe(ENDING_PATH);
  });

  it("forces active night sessions onto the night route, including from the library", () => {
    const night = { started: true, phase: "night" as const };
    expect(resolveGamePath(night, NIGHT_RUN_PATH)).toBeNull();
    expect(resolveGamePath(night, GAME_VIEW_PATHS.board)).toBe(NIGHT_RUN_PATH);
    expect(resolveGamePath(night, CASE_LIBRARY_PATH)).toBe(NIGHT_RUN_PATH);
  });

  it("keeps the library available after a case ends but canonicalizes other game routes", () => {
    const ending = { started: true, phase: "ending" as const };
    expect(resolveGamePath(ending, ENDING_PATH)).toBeNull();
    expect(resolveGamePath(ending, CASE_LIBRARY_PATH)).toBeNull();
    expect(resolveGamePath(ending, GAME_VIEW_PATHS.archive)).toBe(ENDING_PATH);
  });

  it("preserves legal daytime surfaces and redirects a current morning from tonight to its report", () => {
    const day = { started: true, phase: "day" as const };
    const morning = { started: true, phase: "morning" as const };
    expect(resolveGamePath(day, GAME_VIEW_PATHS.board)).toBeNull();
    expect(resolveGamePath(day, CASE_INTRO_PATH)).toBe(GAME_VIEW_PATHS.tonight);
    expect(resolveGamePath(morning, GAME_VIEW_PATHS.board)).toBeNull();
    expect(resolveGamePath(morning, GAME_VIEW_PATHS.tonight)).toBe(GAME_VIEW_PATHS.report);
  });
});
