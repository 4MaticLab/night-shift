import { describe, expect, it } from "vitest";
import {
  RATES,
  OFFLINE_CAP_MINUTES,
  accruePoints,
  offlineCredit,
  rankForPoints,
} from "../apps/desk-pet/src/lib/points";
import {
  SENSOR_SOURCE_PLACEHOLDER,
  airQualityLabel,
  createSensorSnapshot,
  analyzeVoidCameraClip,
  scoreSleepQuality,
} from "../apps/desk-pet/src/lib/fake-sensors";

describe("desk-pet 值更点", () => {
  it("醒着与补眠按不同速率累积", () => {
    expect(accruePoints("awake", 60_000)).toBeCloseTo(RATES.awake);
    expect(accruePoints("sleeping", 60_000)).toBeCloseTo(RATES.sleeping);
    expect(RATES.sleeping).toBeGreaterThan(RATES.awake);
  });

  it("无效时长不产生积分", () => {
    expect(accruePoints("awake", 0)).toBe(0);
    expect(accruePoints("awake", -5_000)).toBe(0);
    expect(accruePoints("awake", Number.NaN)).toBe(0);
  });

  it("离线补记按低速率计并封顶 8 小时", () => {
    const now = Date.parse("2026-07-25T08:00:00Z");
    const twoHoursAgo = new Date(now - 2 * 60 * 60_000).toISOString();
    expect(offlineCredit(twoHoursAgo, now)).toEqual({ minutes: 120, points: 60 });

    const twoDaysAgo = new Date(now - 48 * 60 * 60_000).toISOString();
    const capped = offlineCredit(twoDaysAgo, now);
    expect(capped.minutes).toBe(OFFLINE_CAP_MINUTES);
    expect(capped.points).toBe(OFFLINE_CAP_MINUTES * RATES.offline);
  });

  it("缺失或异常的上次在场时间不补记", () => {
    const now = Date.now();
    expect(offlineCredit(undefined, now)).toEqual({ minutes: 0, points: 0 });
    expect(offlineCredit("not-a-date", now)).toEqual({ minutes: 0, points: 0 });
    expect(offlineCredit(new Date(now + 60_000).toISOString(), now)).toEqual({ minutes: 0, points: 0 });
  });

  it("积分头衔单调不减", () => {
    const ranks = [0, 100, 500, 1_500, 4_000].map(rankForPoints);
    expect(new Set(ranks).size).toBe(5);
  });
});

describe("desk-pet 本地估算传感器", () => {
  it("读数始终落在合理区间并标记估算来源", () => {
    for (let i = 0; i < 50; i += 1) {
      const snapshot = createSensorSnapshot(Date.now() + i * 7 * 60_000);
      expect(snapshot.source).toBe(SENSOR_SOURCE_PLACEHOLDER);
      expect(snapshot.temperature.valueC).toBeGreaterThanOrEqual(15);
      expect(snapshot.temperature.valueC).toBeLessThanOrEqual(32);
      expect(snapshot.airQuality.pm25).toBeGreaterThanOrEqual(2);
      expect(snapshot.airQuality.pm25).toBeLessThanOrEqual(150);
      expect(snapshot.airQuality.co2Ppm).toBeGreaterThanOrEqual(420);
      expect(snapshot.airQuality.co2Ppm).toBeLessThanOrEqual(2000);
      expect(snapshot.airQuality.humidityPct).toBeGreaterThanOrEqual(25);
      expect(snapshot.airQuality.humidityPct).toBeLessThanOrEqual(80);
    }
  });

  it("注入定值噪声源时读数可复现", () => {
    const rng = () => 0.5;
    const at = Date.parse("2026-07-25T02:00:00Z");
    expect(createSensorSnapshot(at, rng)).toEqual(createSensorSnapshot(at, rng));
  });

  it("PM2.5 档位划分正确", () => {
    expect(airQualityLabel(10)).toBe("优");
    expect(airQualityLabel(50)).toBe("良");
    expect(airQualityLabel(100)).toBe("轻度污染");
    expect(airQualityLabel(140)).toBe("污染");
  });
});

describe("desk-pet 夜间录像本地分析 v0", () => {
  it("同一文件的分析结果稳定可复现", () => {
    const clip = { path: "/tmp/night-2026-07-24.mp4", sizeBytes: 128_000_000 };
    expect(analyzeVoidCameraClip(clip)).toEqual(analyzeVoidCameraClip(clip));
  });

  it("统计值在承诺的范围内", () => {
    for (let i = 0; i < 20; i += 1) {
      const report = analyzeVoidCameraClip({ path: `/tmp/clip-${i}.mp4`, sizeBytes: i * 1_000_003 });
      expect(report.source).toBe(SENSOR_SOURCE_PLACEHOLDER);
      expect(report.tossTurns).toBeGreaterThanOrEqual(3);
      expect(report.tossTurns).toBeLessThanOrEqual(12);
      expect(report.outOfBedEvents).toBeGreaterThanOrEqual(0);
      expect(report.outOfBedEvents).toBeLessThanOrEqual(2);
      expect(report.restlessnessIndex).toBeGreaterThan(0);
      expect(report.restlessnessIndex).toBeLessThanOrEqual(1);
    }
  });
});

describe("desk-pet 睡眠质量评分", () => {
  const calmSnapshot = {
    capturedAt: new Date().toISOString(),
    source: SENSOR_SOURCE_PLACEHOLDER,
    temperature: { valueC: 22, unit: "°C" },
    airQuality: { pm25: 10, co2Ppm: 600, humidityPct: 50, label: "优" },
  };

  it("环境舒适且无录像时给出高分", () => {
    const result = scoreSleepQuality(calmSnapshot);
    expect(result.score).toBe(100);
    expect(result.grade).toBe("深睡如渊");
    expect(result.narrative).toContain("导入一段夜间录像");
  });

  it("恶劣环境 + 不安录像会拉低分数但不低于下限", () => {
    const harsh = {
      ...calmSnapshot,
      temperature: { valueC: 30, unit: "°C" },
      airQuality: { pm25: 120, co2Ppm: 1600, humidityPct: 70, label: "污染" },
    };
    const clipReport = analyzeVoidCameraClip({ path: "/tmp/rough-night.mp4", sizeBytes: 1 });
    const result = scoreSleepQuality(harsh, clipReport);
    expect(result.score).toBeLessThan(60);
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.narrative).toContain("翻身");
  });
});
