// 占位传感器：空气质量 + 温度 + 虚空摄像头。
// ⚠️ 真实硬件接口尚未接线（也确实还没有电线）。这里按未来真传感器的字段形状
// 生成平滑的假读数，等接口整明白后在 createSensorSnapshot 处替换数据源即可高空对接。

import type {
  PlaceholderSource,
  SensorSnapshot,
  SleepQuality,
  VoidClipReport,
} from "../shared/contracts";

export const SENSOR_SOURCE_PLACEHOLDER: PlaceholderSource = "placeholder";

/** 由 PM2.5 估算 AQI 档位（简化版，够占位用）。 */
export function airQualityLabel(pm25: number): string {
  if (pm25 <= 35) return "优";
  if (pm25 <= 75) return "良";
  if (pm25 <= 115) return "轻度污染";
  return "污染";
}

/**
 * 生成一帧传感器快照。用正弦叠加 + 少量噪声，读数随时间缓慢漂移、始终在合理区间。
 * @param nowMs 时间戳
 * @param rng 噪声源，默认 Math.random，测试时可注入定值
 */
export function createSensorSnapshot(nowMs: number, rng: () => number = Math.random): SensorSnapshot {
  const t = nowMs / 60_000; // 分钟
  const noise = (scale: number) => (rng() - 0.5) * 2 * scale;

  const temperatureC = round1(clamp(21.6 + 2.2 * Math.sin(t / 37) + noise(0.3), 15, 32));
  const humidityPct = Math.round(clamp(49 + 7 * Math.sin(t / 53 + 1.3) + noise(1.5), 25, 80));
  const pm25 = round1(clamp(14 + 8 * Math.sin(t / 23 + 0.6) + noise(1.2), 2, 150));
  const co2Ppm = Math.round(clamp(640 + 190 * Math.sin(t / 41 + 2.1) + noise(20), 420, 2000));

  return {
    capturedAt: new Date(nowMs).toISOString(),
    source: SENSOR_SOURCE_PLACEHOLDER,
    temperature: { valueC: temperatureC, unit: "°C" },
    airQuality: {
      pm25,
      co2Ppm,
      humidityPct,
      label: airQualityLabel(pm25),
    },
  };
}

/**
 * 虚空摄像头占位分析：真录像还没接进来，先从文件路径与大小哈希出
 * 一组稳定可复现的「夜间动作」统计，等真分析管线接上后替换实现。
 */
export function analyzeVoidCameraClip(video: { path: string; sizeBytes?: number }): VoidClipReport {
  const seed = hashString(`${video.path}:${video.sizeBytes ?? 0}`);
  const pick = (offset: number, span: number) => seedAt(seed, offset) % span;

  const tossTurns = 3 + pick(1, 10); // 翻身次数 3–12
  const outOfBed = pick(2, 3); // 离床次数 0–2
  const quietStreakMin = 35 + pick(3, 80); // 最长安静片段 35–114 分钟
  const restlessness = round1(clamp(tossTurns * 0.06 + outOfBed * 0.15, 0.05, 1));

  return {
    source: SENSOR_SOURCE_PLACEHOLDER,
    clipPath: video.path,
    tossTurns,
    outOfBedEvents: outOfBed,
    longestQuietMinutes: quietStreakMin,
    restlessnessIndex: restlessness,
    note: "占位分析：数值由文件指纹推导，仅用于演示，待真实视频管线接入。",
  };
}

/**
 * 环境参考指数：综合温度、空气与（可选的）体动统计。
 * 这是展示环境状态的非医疗指标，不评价睡眠质量；数据源在叙述中如实标注。
 */
export function scoreSleepQuality(snapshot: SensorSnapshot, clipReport?: VoidClipReport): SleepQuality {
  let score = 100;

  const temp = snapshot.temperature.valueC;
  if (temp < 18 || temp > 26) score -= 18;
  else if (temp < 20 || temp > 24) score -= 8;

  const { pm25, co2Ppm } = snapshot.airQuality;
  if (pm25 > 75) score -= 20;
  else if (pm25 > 35) score -= 10;
  if (co2Ppm > 1200) score -= 15;
  else if (co2Ppm > 900) score -= 7;

  if (clipReport) {
    score -= Math.round(clipReport.restlessnessIndex * 25);
    if (clipReport.outOfBedEvents >= 2) score -= 6;
  }

  score = Math.round(clamp(score, 5, 100));
  const grade = score >= 85 ? "环境舒展" : score >= 70 ? "环境适宜" : score >= 50 ? "建议留意" : "建议检查";
  const live = snapshot.source === "rdk-x5";
  let narrative: string;
  if (live && clipReport?.source === "rdk-x5") {
    narrative = `Mini Lindo 原型记录到室温 ${temp}°C、CO₂ ${co2Ppm}ppm，并在板端汇总 ${clipReport.tossTurns} 次体动事件，当前环境标记为「${grade}」。画面没有离开开发板；这不是睡眠质量或医疗判断。`;
  } else if (live) {
    narrative = `Mini Lindo 原型记录到室温 ${temp}°C、PM2.5 ${pm25}，当前环境标记为「${grade}」。摄像头通道未提供体动摘要；这不是睡眠质量或医疗判断。`;
  } else if (clipReport) {
    narrative = `当前为演示数据：室温 ${temp}°C、PM2.5 ${pm25}，文件指纹生成 ${clipReport.tossTurns} 次演示体动事件，环境标记为「${grade}」。这些数值不是传感器实测，也不代表录像分析结果。`;
  } else {
    narrative = `当前为演示数据：室温 ${temp}°C、CO₂ ${co2Ppm}ppm，环境标记为「${grade}」。尚无传感器实测或体动摘要；这不是睡眠质量或医疗判断。`;
  }

  return { score, grade, narrative, source: live ? snapshot.source : SENSOR_SOURCE_PLACEHOLDER };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** FNV-1a，够占位分析做稳定哈希。 */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seedAt(seed: number, offset: number): number {
  return hashString(`${seed}:${offset}`);
}
