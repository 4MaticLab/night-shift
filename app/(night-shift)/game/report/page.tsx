"use client";

import { useCallback } from "react";
import { useGameApp } from "@/src/components/game/app-runtime";
import { EmptyReport, MorningReport } from "@/src/components/game/night-cycle";
import { ENDING_PATH, GAME_VIEW_PATHS } from "@/src/lib/game-routes";
import { useGameStore } from "@/src/stores/game-store";

export default function ReportPage() {
  const chapter = useGameStore((state) => state.chapter);
  const phase = useGameStore((state) => state.phase);
  const completedReports = useGameStore((state) => state.completedReports);
  const continueDay = useGameStore((state) => state.continueDay);
  const { navigate, navigateView, openHardware } = useGameApp();
  const latestReportChapter = completedReports.length ? Math.max(...completedReports) : null;
  const reviewingCurrentMorning = phase === "morning" && latestReportChapter === chapter;

  const finishDay = useCallback(() => {
    continueDay();
    const nextPhase = useGameStore.getState().phase;
    navigate(nextPhase === "ending" ? ENDING_PATH : GAME_VIEW_PATHS.tonight, {
      replace: nextPhase === "ending",
    });
  }, [continueDay, navigate]);

  if (latestReportChapter === null) return <EmptyReport setView={navigateView} />;
  return (
    <MorningReport
      reportChapter={latestReportChapter}
      reviewingCurrentMorning={reviewingCurrentMorning}
      onReviewEvidence={() => navigateView("board")}
      onFinishDay={finishDay}
      onPrepareTonight={() => navigateView("tonight")}
      onHardware={openHardware}
    />
  );
}
