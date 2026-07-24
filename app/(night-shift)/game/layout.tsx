import type { ReactNode } from "react";
import { GameLayout } from "@/src/components/game/game-layout";

export default function RoutedGameLayout({ children }: { children: ReactNode }) {
  return <GameLayout>{children}</GameLayout>;
}
