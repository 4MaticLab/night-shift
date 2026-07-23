import { getVirtualSleepDevice } from "@/src/content/sleep-devices";
import type { SleepSession } from "@/src/lib/game-engine/schema";
import type { ActiveSleepCapture, LiveSleepSignals, SleepSignalSummary } from "./types";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function variance(seed: number, range: number): number {
  return (seed % (range * 2 + 1)) - range;
}

function has(capture: ActiveSleepCapture, permission: ActiveSleepCapture["permissions"][number]): boolean {
  return capture.permissions.includes(permission);
}

export function createSleepSignalSummary(capture: ActiveSleepCapture, session: SleepSession): SleepSignalSummary {
  const device = getVirtualSleepDevice(capture.sourceId);
  if (!device) throw new Error(`Unknown virtual sleep device: ${capture.sourceId}`);
  const seed = hashString(`${capture.sessionId}:${capture.sourceId}`);
  const durationMinutes = session.durationMinutes ?? 0;
  const baselines = {
    restful: { heart: 54, hrv: 58, respiration: 13, restless: 17, deep: 0.26, wakes: 1 },
    regular: { heart: 61, hrv: 44, respiration: 14, restless: 34, deep: 0.19, wakes: 3 },
    interrupted: { heart: 68, hrv: 31, respiration: 16, restless: 63, deep: 0.11, wakes: 6 },
  }[session.quality];
  const narrative = session.quality === "restful"
    ? "夜色很深，身体的信号却平稳。林渡把这份安静折进了归途。"
    : session.quality === "regular"
      ? "一夜有轻微起伏，但节律完整；城市按约定交回了摘要。"
      : "醒转把夜晚分成几段。调查没有失败，报告只是多了几道折痕。";

  return {
    sessionId: session.id,
    sourceId: capture.sourceId,
    startedAt: capture.startedAt,
    endedAt: session.endedAt ?? new Date().toISOString(),
    durationMinutes,
    derivedQuality: session.quality,
    confidence: device.confidence,
    averageHeartRate: has(capture, "heart-rate") ? baselines.heart + variance(seed, 3) : undefined,
    hrvMs: has(capture, "heart-rate") ? baselines.hrv + variance(seed >>> 3, 5) : undefined,
    respirationRate: has(capture, "respiration") ? Number((baselines.respiration + variance(seed >>> 6, 8) / 10).toFixed(1)) : undefined,
    restlessnessIndex: has(capture, "movement") ? Math.max(4, Math.min(94, baselines.restless + variance(seed >>> 9, 7))) : undefined,
    deepSleepMinutes: has(capture, "sleep-stages") ? Math.round(durationMinutes * Math.max(0.06, baselines.deep + variance(seed >>> 12, 3) / 100)) : undefined,
    wakeEvents: has(capture, "movement") ? Math.max(0, baselines.wakes + variance(seed >>> 15, 2)) : undefined,
    narrative,
  };
}

export function projectLiveSleepSignals(capture: ActiveSleepCapture, progress: number): LiveSleepSignals {
  const seed = hashString(`${capture.sessionId}:${capture.sourceId}`);
  const phase = Math.max(0, Math.min(1, progress / 100));
  const pulse = Math.round(({ restful: 55, regular: 62, interrupted: 69 }[capture.quality]) + Math.sin(phase * 13 + seed % 7) * 3);
  const respiration = ({ restful: 13.1, regular: 14.2, interrupted: 15.8 }[capture.quality]) + Math.sin(phase * 8 + seed % 5) * 0.4;
  const stillness = Math.round(({ restful: 88, regular: 72, interrupted: 49 }[capture.quality]) - Math.sin(phase * 10 + seed % 3) * 4);

  if (has(capture, "heart-rate")) {
    return {
      primaryLabel: "夜间脉搏",
      primaryValue: `${pulse} bpm`,
      secondaryLabel: has(capture, "respiration") ? "呼吸节律" : "静稳指数",
      secondaryValue: has(capture, "respiration") ? `${respiration.toFixed(1)} /min` : `${stillness}%`,
      tertiaryLabel: "采集进度",
      tertiaryValue: `${Math.round(progress)}%`,
    };
  }
  return {
    primaryLabel: "静稳指数",
    primaryValue: `${stillness}%`,
    secondaryLabel: "呼吸节律",
    secondaryValue: `${respiration.toFixed(1)} /min`,
    tertiaryLabel: "采集进度",
    tertiaryValue: `${Math.round(progress)}%`,
  };
}

