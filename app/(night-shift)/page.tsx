"use client";

import { useCallback } from "react";
import { Hero } from "@/src/components/game/landing";
import { useGameApp } from "@/src/components/game/app-runtime";
import { CASE_INTRO_PATH, getResumeGamePath } from "@/src/lib/game-routes";
import { useGameStore } from "@/src/stores/game-store";

export default function CaseLibraryPage() {
  const started = useGameStore((state) => state.started);
  const phase = useGameStore((state) => state.phase);
  const { hydrated, navigate, openDemo } = useGameApp();
  const openCase = useCallback(() => {
    navigate(started ? getResumeGamePath({ started, phase }) : CASE_INTRO_PATH);
  }, [navigate, phase, started]);

  return <Hero interactive={hydrated} onStart={openCase} onDemo={openDemo} />;
}
