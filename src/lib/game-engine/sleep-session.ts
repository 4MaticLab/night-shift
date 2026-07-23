import { nanoid } from "nanoid";
import { DEMO_CITY_WATCH_ID, getCityWatchId } from "@/src/content/watches";
import { wakeEchoRecordSchema, type CityWatchId, type SleepMode, type SleepQuality, type SleepSession } from "./schema";

const demoDurationMinutes: Record<SleepQuality, number> = {
  interrupted: 248,
  regular: 392,
  restful: 484,
};

export function qualityFromDuration(durationMinutes: number): SleepQuality {
  if (durationMinutes < 300) return "interrupted";
  if (durationMinutes < 420) return "regular";
  return "restful";
}

export function startSleepSession(
  mode: SleepMode,
  quality: SleepQuality,
  startedAt = new Date(),
  watchId: CityWatchId = mode === "demo" ? DEMO_CITY_WATCH_ID : getCityWatchId(startedAt),
): SleepSession {
  return {
    id: nanoid(),
    startedAt: startedAt.toISOString(),
    quality,
    mode,
    watchId,
  };
}

export function finishSleepSession(session: SleepSession, endedAt = new Date()): SleepSession {
  const actualMinutes = Math.max(1, Math.floor((endedAt.getTime() - new Date(session.startedAt).getTime()) / 60_000));
  const durationMinutes = session.mode === "demo" ? demoDurationMinutes[session.quality] : actualMinutes;
  return {
    ...session,
    endedAt: endedAt.toISOString(),
    durationMinutes,
    quality: session.mode === "demo" ? session.quality : qualityFromDuration(durationMinutes),
  };
}

export function recordWakeEcho(session: SleepSession, echoId: string, recordedAt = new Date()): SleepSession {
  if (session.wakeEcho) return session;
  return { ...session, wakeEcho: wakeEchoRecordSchema.parse({ echoId, recordedAt: recordedAt.toISOString() }) };
}

export function elapsedSessionMinutes(session: SleepSession | null, now = new Date()): number {
  if (!session) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 60_000));
}

export function nightSealProgress(session: SleepSession | null, now = new Date()): number {
  if (!session) return 3;
  if (session.mode === "demo") return 3;
  return Math.min(100, Math.max(3, (elapsedSessionMinutes(session, now) / 480) * 100));
}

export function formatSleepDuration(durationMinutes?: number): string {
  if (durationMinutes === undefined) return "尚未结束";
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (!hours) return `${minutes} 分钟`;
  return `${hours} 小时 ${minutes.toString().padStart(2, "0")} 分`;
}
