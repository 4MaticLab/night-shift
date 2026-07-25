// 值更点（挂机积分）核心规则。纯函数，主进程与根仓库测试共用。
// 速率单位统一为「点 / 分钟」。

import type { OfflineCreditResult, PetMode } from "../shared/contracts";

export const RATES = Object.freeze({
  awake: 1, // 林渡在桌面值更
  sleeping: 1.5, // 闲时躺进蓝盒子床垫，替你把夜守厚一点
  offline: 0.5, // 应用没开时的补记，故意低于在线速率
});

export const OFFLINE_CAP_MINUTES = 8 * 60; // 离线补记最多按一整个夜班（8 小时）计

/** 在线累积：按当前模式把一段时间折算成积分增量。 */
export function accruePoints(mode: PetMode, elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  const rate = mode === "sleeping" ? RATES.sleeping : RATES.awake;
  return (elapsedMs / 60_000) * rate;
}

/**
 * 离线补记：应用重开时，按上次在场时间补一段低速积分。
 * minutes 为实际计入的整分钟数。
 */
export function offlineCredit(lastSeenIso: string | null | undefined, nowMs: number): OfflineCreditResult {
  if (!lastSeenIso) return { minutes: 0, points: 0 };
  const lastSeen = Date.parse(lastSeenIso);
  if (!Number.isFinite(lastSeen) || lastSeen >= nowMs) return { minutes: 0, points: 0 };
  const minutes = Math.min((nowMs - lastSeen) / 60_000, OFFLINE_CAP_MINUTES);
  if (minutes < 1) return { minutes: 0, points: 0 };
  const whole = Math.floor(minutes);
  return { minutes: whole, points: whole * RATES.offline };
}

/** 积分对应的头衔，纯展示用。 */
export function rankForPoints(points: number): string {
  if (points >= 4_000) return "雾灯市荣誉夜班长";
  if (points >= 1_500) return "资深守夜人";
  if (points >= 500) return "档案室常客";
  if (points >= 100) return "见习守夜人";
  return "初到夜班的访客";
}
