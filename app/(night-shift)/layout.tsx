import type { ReactNode } from "react";
import { NightShiftRuntime } from "@/src/components/game/app-runtime";

export default function NightShiftLayout({ children }: { children: ReactNode }) {
  return <NightShiftRuntime>{children}</NightShiftRuntime>;
}
