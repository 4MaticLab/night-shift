// 极简 JSON 持久化：积分、上次在场时间、虚空摄像头剪辑。
// 存到 Electron userData 目录，删掉文件即重置，local-first。

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { SleepReport, VoidClip } from "../shared/contracts";

export interface PetState {
  points: number;
  lastSeenAt: string | null;
  voidClip: VoidClip | null;
  lastReport: SleepReport | null;
}

export const DEFAULT_STATE: Readonly<PetState> = Object.freeze({
  points: 0,
  lastSeenAt: null,
  voidClip: null,
  lastReport: null,
});

export function loadState(filePath: string): PetState {
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<PetState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(filePath: string, state: PetState): void {
  try {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    console.error("desk-pet: failed to persist state", error);
  }
}
