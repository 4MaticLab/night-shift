import { describe, expect, it } from "vitest";
import {
  SENSOR_SOURCE_SENTRY,
  SENTRY_DEFAULT_PORT,
  normalizeSentryConfig,
  sentryBaseUrl,
  parseSentrySnapshot,
  parseSentryMotion,
  motionToClipReport,
} from "../apps/desk-pet/src/lib/rdk-bridge";
import {
  SENSOR_SOURCE_PLACEHOLDER,
  createSensorSnapshot,
  scoreSleepQuality,
} from "../apps/desk-pet/src/lib/fake-sensors";

const fallback = createSensorSnapshot(Date.parse("2026-07-25T02:00:00Z"), () => 0.5);

function sentryPayload(environment: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    capturedAt: "2026-07-25T02:00:00Z",
    source: "rdk-x5",
    mock: false,
    environment,
    ...extra,
  };
}

describe("rdk-bridge 连接配置", () => {
  it("剥掉 scheme 与尾部斜杠，缺省端口用 8302", () => {
    expect(normalizeSentryConfig("http://192.168.1.50/", "")).toEqual({
      host: "192.168.1.50",
      port: SENTRY_DEFAULT_PORT,
    });
    expect(normalizeSentryConfig("rdk-x5.local", 9000)).toEqual({ host: "rdk-x5.local", port: 9000 });
  });

  it("非法主机名或端口返回 null", () => {
    expect(normalizeSentryConfig("", "")).toBeNull();
    expect(normalizeSentryConfig("  ", "")).toBeNull();
    expect(normalizeSentryConfig("host with space", "")).toBeNull();
    expect(normalizeSentryConfig("host/path", "")).toBeNull();
    expect(normalizeSentryConfig(42, "")).toBeNull();
    expect(normalizeSentryConfig("ok-host", 0)).toBeNull();
    expect(normalizeSentryConfig("ok-host", 70000)).toBeNull();
    expect(normalizeSentryConfig("ok-host", 12.5)).toBeNull();
  });

  it("拼出的基地址可直接用于轮询", () => {
    expect(sentryBaseUrl({ host: "10.0.0.7", port: 8302 })).toBe("http://10.0.0.7:8302");
  });
});

describe("rdk-bridge 快照解析", () => {
  it("完整读数直接映射为 rdk-x5 快照", () => {
    const parsed = parseSentrySnapshot(
      sentryPayload({ temperatureC: 23.4, humidityPct: 51.6, co2Ppm: 780.2, pm25: 12 }),
      fallback,
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.snapshot.source).toBe(SENSOR_SOURCE_SENTRY);
    expect(parsed!.snapshot.temperature.valueC).toBe(23.4);
    expect(parsed!.snapshot.airQuality.co2Ppm).toBe(780);
    expect(parsed!.snapshot.airQuality.humidityPct).toBe(52);
    expect(parsed!.snapshot.airQuality.label).toBe("优");
    expect(parsed!.degradedFields).toEqual([]);
    expect(parsed!.mock).toBe(false);
  });

  it("缺席硬件字段用占位快照补齐并记入 degradedFields", () => {
    const parsed = parseSentrySnapshot(
      sentryPayload({ temperatureC: 22, humidityPct: 48, co2Ppm: null, pm25: null }),
      fallback,
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.degradedFields).toEqual(["co2Ppm", "pm25"]);
    expect(parsed!.snapshot.airQuality.co2Ppm).toBe(fallback.airQuality.co2Ppm);
    expect(parsed!.snapshot.airQuality.pm25).toBe(fallback.airQuality.pm25);
    expect(parsed!.snapshot.degradedFields).toEqual(["co2Ppm", "pm25"]);
  });

  it("四路全缺席等同没连上，返回 null", () => {
    const parsed = parseSentrySnapshot(
      sentryPayload({ temperatureC: null, humidityPct: null, co2Ppm: null, pm25: null }),
      fallback,
    );
    expect(parsed).toBeNull();
  });

  it("形状不对或来源不符的报文一律拒收", () => {
    expect(parseSentrySnapshot(null, fallback)).toBeNull();
    expect(parseSentrySnapshot("garbage", fallback)).toBeNull();
    expect(parseSentrySnapshot({ source: "someone-else", environment: {} }, fallback)).toBeNull();
    expect(parseSentrySnapshot({ source: "rdk-x5", environment: "nope" }, fallback)).toBeNull();
  });
});

describe("rdk-bridge 体动统计解析", () => {
  const stats = {
    windowMinutes: 90,
    samples: 10_800,
    tossTurns: 6.4,
    outOfBedEvents: 1,
    longestQuietMinutes: 42.5,
    restlessnessIndex: 1.6,
  };

  it("统计字段被取整与钳位", () => {
    const parsed = parseSentryMotion(sentryPayload({}, { stats }));
    expect(parsed).toEqual({
      windowMinutes: 90,
      tossTurns: 6,
      outOfBedEvents: 1,
      longestQuietMinutes: 42.5,
      restlessnessIndex: 1,
    });
  });

  it("摄像头离线（stats 为 null）或字段缺失返回 null", () => {
    expect(parseSentryMotion(sentryPayload({}, { stats: null }))).toBeNull();
    expect(parseSentryMotion(sentryPayload({}, { stats: { windowMinutes: 30 } }))).toBeNull();
    expect(parseSentryMotion(undefined)).toBeNull();
  });

  it("体动统计映射为报告管线可用的 VoidClipReport", () => {
    const parsed = parseSentryMotion(sentryPayload({}, { stats }));
    const report = motionToClipReport(parsed!, { host: "10.0.0.7", port: 8302 });
    expect(report.source).toBe(SENSOR_SOURCE_SENTRY);
    expect(report.clipPath).toBe("http://10.0.0.7:8302/api/v1/motion");
    expect(report.tossTurns).toBe(6);
    expect(report.longestQuietMinutes).toBe(43);
    expect(report.note).toContain("Mini Lindo");
    expect(report.note).toContain("画面未离开开发板");
  });
});

describe("rdk-bridge 环境回执随数据源切换", () => {
  const liveSnapshot = {
    capturedAt: new Date().toISOString(),
    source: SENSOR_SOURCE_SENTRY,
    temperature: { valueC: 22, unit: "°C" },
    airQuality: { pm25: 10, co2Ppm: 600, humidityPct: 50, label: "优" },
  };

  it("哨站快照 + 哨站体动 → 报告标记实测来源", () => {
    const motion = parseSentryMotion(sentryPayload({}, {
      stats: { windowMinutes: 60, tossTurns: 4, outOfBedEvents: 0, longestQuietMinutes: 50, restlessnessIndex: 0.2 },
    }));
    const clipReport = motionToClipReport(motion!, { host: "10.0.0.7", port: 8302 });
    const result = scoreSleepQuality(liveSnapshot, clipReport);
    expect(result.source).toBe(SENSOR_SOURCE_SENTRY);
    expect(result.narrative).toContain("Mini Lindo");
    expect(result.narrative).toContain("板端");
    expect(result.narrative).toContain("不是睡眠质量或医疗判断");
  });

  it("哨站快照但摄像头未上岗 → 叙述如实说明", () => {
    const result = scoreSleepQuality(liveSnapshot);
    expect(result.source).toBe(SENSOR_SOURCE_SENTRY);
    expect(result.narrative).toContain("Mini Lindo");
  });

  it("演示快照明确说明不是实测或医疗判断", () => {
    const placeholder = { ...liveSnapshot, source: SENSOR_SOURCE_PLACEHOLDER };
    const result = scoreSleepQuality(placeholder);
    expect(result.source).toBe(SENSOR_SOURCE_PLACEHOLDER);
    expect(result.narrative).toContain("不是睡眠质量或医疗判断");
  });
});
