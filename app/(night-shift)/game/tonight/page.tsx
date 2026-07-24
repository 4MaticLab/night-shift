"use client";

import { useCallback } from "react";
import { useGameApp } from "@/src/components/game/app-runtime";
import { Tonight } from "@/src/components/game/night-cycle";
import { NIGHT_RUN_PATH } from "@/src/lib/game-routes";
import { useGameStore } from "@/src/stores/game-store";
import type { PreparationId } from "@/src/content/preparations";
import type { SleepMode, SleepQuality } from "@/src/lib/game-engine/schema";
import type { RestRitualInput } from "@/src/lib/rest-ritual";

export default function TonightPage() {
  const startNight = useGameStore((state) => state.startNight);
  const { navigate, openHardware } = useGameApp();
  const launch = useCallback((
    quality: SleepQuality,
    preparationId: PreparationId,
    mode: SleepMode,
    restRitual?: RestRitualInput,
  ) => {
    startNight(quality, preparationId, mode, restRitual);
    navigate(NIGHT_RUN_PATH, { replace: true });
  }, [navigate, startNight]);

  return <Tonight onLaunch={launch} onHardware={openHardware} />;
}
