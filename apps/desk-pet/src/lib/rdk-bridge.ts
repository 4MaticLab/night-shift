// RDK X5 床头哨站桥接：解析哨站 JSON、把体动统计映射为报告、降级回退。
// 本文件只做纯逻辑（不 fetch、不碰 Electron），网络与轮询在 main.ts；
// 这样解析、补齐、映射规则都能在根 vitest 里直接测。

import type {
  SensorSnapshot,
  SensorSource,
  SentryConfig,
  SentryMotionStats,
  VoidClipReport,
} from "../shared/contracts";

export const SENSOR_SOURCE_SENTRY: SensorSource = "rdk-x5";
export const SENTRY_DEFAULT_PORT = 8302;
/** 板端与桌宠端各自声明的协议号，对不上就拒绝连接。 */
export const SENTRY_PROTOCOL = "1";

/** 校验并归一化连接配置；非法输入返回 null。 */
export function normalizeSentryConfig(hostInput: unknown, portInput: unknown): SentryConfig | null {
  if (typeof hostInput !== "string") return null;
  const host = hostInput.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (host.length === 0 || /[\s/]/.test(host)) return null;
  const port = portInput === "" || portInput === undefined || portInput === null
    ? SENTRY_DEFAULT_PORT
    : Number(portInput);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port };
}

export function sentryBaseUrl(config: SentryConfig): string {
  return `http://${config.host}:${config.port}`;
}

interface ParsedSnapshot {
  snapshot: SensorSnapshot;
  degradedFields: string[];
  mock: boolean;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * 把哨站 /api/v1/snapshot 的原始 JSON 解析为桌宠的 SensorSnapshot。
 * 缺席字段（硬件没接线）用 fallback（占位快照）里的值补齐并记入 degradedFields；
 * 整体形状不对则返回 null，调用方按掉线处理。
 */
export function parseSentrySnapshot(raw: unknown, fallback: SensorSnapshot): ParsedSnapshot | null {
  if (typeof raw !== "object" || raw === null) return null;
  const payload = raw as Record<string, unknown>;
  if (payload.source !== SENSOR_SOURCE_SENTRY) return null;
  const env = payload.environment;
  if (typeof env !== "object" || env === null) return null;
  const fields = env as Record<string, unknown>;

  const degraded: string[] = [];
  const take = (key: string, fallbackValue: number): number => {
    const value = num(fields[key]);
    if (value === null) {
      degraded.push(key);
      return fallbackValue;
    }
    return value;
  };

  const temperatureC = take("temperatureC", fallback.temperature.valueC);
  const humidityPct = take("humidityPct", fallback.airQuality.humidityPct);
  const co2Ppm = take("co2Ppm", fallback.airQuality.co2Ppm);
  const pm25 = take("pm25", fallback.airQuality.pm25);
  // 全部字段都缺席说明板上一路传感器都没有，等同没连上
  if (degraded.length >= 4) return null;

  return {
    snapshot: {
      capturedAt: typeof payload.capturedAt === "string" ? payload.capturedAt : new Date().toISOString(),
      source: SENSOR_SOURCE_SENTRY,
      temperature: { valueC: temperatureC, unit: "°C" },
      airQuality: {
        pm25,
        co2Ppm: Math.round(co2Ppm),
        humidityPct: Math.round(humidityPct),
        label: airLabel(pm25),
      },
      degradedFields: degraded,
    },
    degradedFields: degraded,
    mock: payload.mock === true,
  };
}

/** 与 fake-sensors.airQualityLabel 同一分档（避免循环依赖，独立实现）。 */
function airLabel(pm25: number): string {
  if (pm25 <= 35) return "优";
  if (pm25 <= 75) return "良";
  if (pm25 <= 115) return "轻度污染";
  return "污染";
}

/** 解析 /api/v1/motion 的原始 JSON；摄像头离线或形状不对返回 null。 */
export function parseSentryMotion(raw: unknown): SentryMotionStats | null {
  if (typeof raw !== "object" || raw === null) return null;
  const payload = raw as Record<string, unknown>;
  if (payload.source !== SENSOR_SOURCE_SENTRY) return null;
  const stats = payload.stats;
  if (typeof stats !== "object" || stats === null) return null;
  const fields = stats as Record<string, unknown>;
  const windowMinutes = num(fields.windowMinutes);
  const tossTurns = num(fields.tossTurns);
  const outOfBedEvents = num(fields.outOfBedEvents);
  const longestQuietMinutes = num(fields.longestQuietMinutes);
  const restlessnessIndex = num(fields.restlessnessIndex);
  if (
    windowMinutes === null || tossTurns === null || outOfBedEvents === null ||
    longestQuietMinutes === null || restlessnessIndex === null
  ) {
    return null;
  }
  return {
    windowMinutes,
    tossTurns: Math.max(0, Math.round(tossTurns)),
    outOfBedEvents: Math.max(0, Math.round(outOfBedEvents)),
    longestQuietMinutes: Math.max(0, longestQuietMinutes),
    restlessnessIndex: Math.min(1, Math.max(0, restlessnessIndex)),
  };
}

/**
 * 把哨站体动统计映射为报告用的 VoidClipReport 形状：
 * 报告管线（scoreSleepQuality / 渲染）不用区分统计来自导入录像还是床头实拍。
 */
export function motionToClipReport(stats: SentryMotionStats, config: SentryConfig): VoidClipReport {
  return {
    source: SENSOR_SOURCE_SENTRY,
    clipPath: `${sentryBaseUrl(config)}/api/v1/motion`,
    tossTurns: stats.tossTurns,
    outOfBedEvents: stats.outOfBedEvents,
    longestQuietMinutes: Math.round(stats.longestQuietMinutes),
    restlessnessIndex: Math.round(stats.restlessnessIndex * 100) / 100,
    note: `床头哨站 Mini Lindo 实测：${stats.windowMinutes.toFixed(0)} 分钟观察窗内的体动聚合统计，画面未离开开发板。`,
  };
}
