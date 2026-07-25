"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useGameApp } from "@/src/components/game/app-runtime";
import { BottomNav, TopBar } from "@/src/components/game/shell";
import { ENDING_PATH, getGameViewFromPath, NIGHT_RUN_PATH } from "@/src/lib/game-routes";
import { useGameStore } from "@/src/stores/game-store";

export function GameLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chapter = useGameStore((state) => state.chapter);
  const { openHardware } = useGameApp();

  if (pathname === NIGHT_RUN_PATH || pathname === ENDING_PATH) return children;

  const view = getGameViewFromPath(pathname) ?? "tonight";
  return (
    <div className="app-shell">
      <TopBar
        chapter={chapter}
        onHardware={openHardware}
      />
      <main className="app-content">{children}</main>
      <BottomNav view={view} />
    </div>
  );
}
