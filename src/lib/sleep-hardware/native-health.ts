import type {
  AuthorizationOptions,
  AuthorizationStatus,
  AvailabilityResult,
  HealthSample,
  QueryOptions,
  ReadSamplesResult,
  SleepState,
} from "@capgo/capacitor-health";
import { qualityFromDuration } from "@/src/lib/game-engine/sleep-session";
import type { SleepSession } from "@/src/lib/game-engine/schema";
import type { NativeSleepBridgeId, SleepSignalSummary } from "./types";

export interface NativeHealthGateway {
  isAvailable: () => Promise<AvailabilityResult>;
  requestAuthorization: (options: AuthorizationOptions) => Promise<AuthorizationStatus>;
  readSamples: (options: QueryOptions) => Promise<ReadSamplesResult>;
  openHealthConnectSettings?: () => Promise<void>;
}

export interface NativeSleepAvailability {
  native: boolean;
  available: boolean;
  bridgeId?: NativeSleepBridgeId;
  reason?: string;
}

interface SleepInterval {
  start: number;
  end: number;
  state: SleepState;
}

const asleepStates = new Set<SleepState>(["asleep", "rem", "deep", "light"]);

async function loadGateway(): Promise<NativeHealthGateway> {
  const { Health } = await import("@capgo/capacitor-health");
  return Health;
}

export function bridgeForCapacitorPlatform(platform: string): NativeSleepBridgeId | undefined {
  if (platform === "ios") return "apple-health";
  if (platform === "android") return "health-connect";
  return undefined;
}

export async function getNativeSleepAvailability(
  gateway?: NativeHealthGateway,
  platformOverride?: string,
): Promise<NativeSleepAvailability> {
  try {
    const platform = platformOverride ?? (await import("@capacitor/core")).Capacitor.getPlatform();
    const bridgeId = bridgeForCapacitorPlatform(platform);
    if (!bridgeId) return { native: false, available: false, reason: "web" };
    const health = gateway ?? await loadGateway();
    const result = await health.isAvailable();
    return { native: true, available: result.available, bridgeId, reason: result.reason };
  } catch (error) {
    return {
      native: true,
      available: false,
      reason: error instanceof Error ? error.message : "native-health-unavailable",
    };
  }
}

export async function authorizeNativeSleep(
  bridgeId: NativeSleepBridgeId,
  gateway?: NativeHealthGateway,
): Promise<boolean> {
  const health = gateway ?? await loadGateway();
  const status = await health.requestAuthorization({ read: ["sleep"], write: [] });
  // HealthKit intentionally does not reveal whether read access was denied. A
  // completed iOS sheet therefore means "configured"; an empty query remains a
  // valid, non-blocking outcome. Health Connect can report the granted scope.
  return bridgeId === "apple-health" || status.readAuthorized.includes("sleep");
}

function validInterval(startDate: string, endDate: string, state: SleepState): SleepInterval | null {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end, state };
}

function sleepIntervals(samples: HealthSample[]): SleepInterval[] {
  const staged = samples.flatMap((sample) => sample.stages ?? [])
    .map((stage) => validInterval(stage.startDate, stage.endDate, stage.stage))
    .filter((interval): interval is SleepInterval => interval !== null);
  if (staged.length > 0) return staged;

  return samples
    .map((sample) => validInterval(
      sample.startDate,
      sample.endDate,
      sample.sleepState ?? "asleep",
    ))
    .filter((interval): interval is SleepInterval => interval !== null);
}

function mergedDurationMinutes(intervals: SleepInterval[]): number {
  const sorted = intervals
    .filter((interval) => interval.end > interval.start)
    .sort((first, second) => first.start - second.start);
  if (sorted.length === 0) return 0;

  let total = 0;
  let start = sorted[0].start;
  let end = sorted[0].end;
  for (const interval of sorted.slice(1)) {
    if (interval.start <= end) {
      end = Math.max(end, interval.end);
      continue;
    }
    total += end - start;
    start = interval.start;
    end = interval.end;
  }
  total += end - start;
  return Math.max(0, Math.round(total / 60_000));
}

function primarySourceName(samples: HealthSample[]): string | undefined {
  const counts = new Map<string, number>();
  for (const sample of samples) {
    if (!sample.sourceName?.trim()) continue;
    counts.set(sample.sourceName, (counts.get(sample.sourceName) ?? 0) + 1);
  }
  return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0];
}

export function normalizeNativeSleepSummary(
  session: SleepSession,
  bridgeId: NativeSleepBridgeId,
  samples: HealthSample[],
): SleepSignalSummary | null {
  const intervals = sleepIntervals(samples);
  const asleep = intervals.filter((interval) => asleepStates.has(interval.state));
  const durationMinutes = mergedDurationMinutes(asleep);
  if (durationMinutes === 0) return null;

  const startedAt = new Date(Math.min(...asleep.map((interval) => interval.start))).toISOString();
  const endedAt = new Date(Math.max(...asleep.map((interval) => interval.end))).toISOString();
  const derivedQuality = qualityFromDuration(durationMinutes);
  const deepSleepMinutes = mergedDurationMinutes(intervals.filter((interval) => interval.state === "deep"));
  const wakeEvents = intervals.filter((interval) => interval.state === "awake").length;
  const hasStageData = samples.some((sample) => sample.hasStageData || (sample.stages?.length ?? 0) > 0);
  const narrative = derivedQuality === "restful"
    ? "系统睡眠记录抵达时，夜色已经很稳。林渡把这份安静折进了归途。"
    : derivedQuality === "regular"
      ? "健康仓交回了一段完整夜色；城市只摘录时长与阶段，没有带走原始记录。"
      : "系统记录里有几次醒转。调查没有失败，报告只是多了几道真实的折痕。";

  return {
    sessionId: session.id,
    sourceId: bridgeId,
    sourceKind: "native",
    sourceName: primarySourceName(samples),
    startedAt,
    endedAt,
    durationMinutes,
    derivedQuality,
    confidence: hasStageData ? 0.95 : 0.84,
    deepSleepMinutes: deepSleepMinutes || undefined,
    wakeEvents: wakeEvents || undefined,
    narrative,
  };
}

export async function readNativeSleepSummary(
  session: SleepSession,
  bridgeId: NativeSleepBridgeId,
  gateway?: NativeHealthGateway,
): Promise<SleepSignalSummary | null> {
  const endedAt = session.endedAt ?? new Date().toISOString();
  const health = gateway ?? await loadGateway();
  const { samples } = await health.readSamples({
    dataType: "sleep",
    startDate: session.startedAt,
    endDate: endedAt,
    limit: 500,
    ascending: true,
  });
  return normalizeNativeSleepSummary(session, bridgeId, samples);
}

export async function openNativeHealthSettings(gateway?: NativeHealthGateway): Promise<void> {
  const health = gateway ?? await loadGateway();
  await health.openHealthConnectSettings?.();
}
