"use client";

import { useCallback } from "react";
import { useGameApp } from "@/src/components/game/app-runtime";
import { CasePrologue } from "@/src/components/game/case-prologue";
import { CASE_LIBRARY_PATH, GAME_VIEW_PATHS } from "@/src/lib/game-routes";
import { useGameStore } from "@/src/stores/game-store";

export default function CaseIntroPage() {
  const begin = useGameStore((state) => state.begin);
  const { navigate } = useGameApp();
  const acceptCase = useCallback(() => {
    begin();
    navigate(GAME_VIEW_PATHS.tonight, { replace: true });
  }, [begin, navigate]);

  return (
    <CasePrologue
      onBack={() => navigate(CASE_LIBRARY_PATH)}
      onDone={acceptCase}
    />
  );
}
