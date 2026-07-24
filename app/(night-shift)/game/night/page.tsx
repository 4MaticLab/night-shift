"use client";

import { useCallback } from "react";
import { useGameApp } from "@/src/components/game/app-runtime";
import { NightRun } from "@/src/components/game/night-cycle";
import { GAME_VIEW_PATHS } from "@/src/lib/game-routes";
import { useGameStore } from "@/src/stores/game-store";

export default function NightPage() {
  const finishNight = useGameStore((state) => state.finishNight);
  const { navigate, openHardware } = useGameApp();
  const finish = useCallback(() => {
    finishNight();
    navigate(GAME_VIEW_PATHS.report, { replace: true });
  }, [finishNight, navigate]);

  return <NightRun onFinish={finish} onHardware={openHardware} />;
}
