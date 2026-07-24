"use client";

import { useGameApp } from "@/src/components/game/app-runtime";
import { Ending } from "@/src/components/game/investigation";
import { CASE_LIBRARY_PATH } from "@/src/lib/game-routes";

export default function EndingPage() {
  const { navigate } = useGameApp();
  return <Ending onOpenLibrary={() => navigate(CASE_LIBRARY_PATH)} />;
}
