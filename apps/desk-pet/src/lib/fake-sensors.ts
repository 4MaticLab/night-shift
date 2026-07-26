// 本地估算引擎：空气质量 + 温度 + 夜间录像分析（v0）。
// 真实硬件缺席时的默认数据源：按真传感器的字段形状生成平滑读数，
// 接口形状与床头哨站实测完全一致，在 createSensorSnapshot 处替换数据源即可无缝切换。

import type {
  PlaceholderSource,
  SensorSnapshot,
  SleepQuality,
  VoidClipReport,
} from "../shared/contracts";

export const SENSOR_SOURCE_PLACEHOLDER: PlaceholderSource = "placeholder";

/** 由 PM2.5 估算 AQI 档位（简化版）。 */
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
 * 夜间录像本地分析 v0：从文件指纹（路径 + 大小）离线推导一组稳定可复现的
 * 「整夜动作」统计；接口形状与哨站侧体动分析一致，后续版本可在此替换实现。
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
    note: "本地分析 v0：结果离线生成、可复现，文件不出本机。",
  };
}

/**
 * 睡眠质量评分：综合温度、空气与（可选的）体动统计。
 * 评分规则不分数据源；叙述与 source 戳跟随输入如实标注（本地估算 / 床头哨站实测）。
 * 返回 0–100 的分数、档位和一句夜班口吻的叙述。
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
  const grade = score >= 85 ? "深睡如渊" : score >= 70 ? "安稳" : score >= 50 ? "浅眠" : "辗转";
  const live = snapshot.source === "rdk-x5";
  let narrative: string;
  if (live && clipReport?.source === "rdk-x5") {
    narrative = `林渡对照了床头哨站的实测档案：室温 ${temp}°C、CO₂ ${co2Ppm}ppm，镜头里数出 ${clipReport.tossTurns} 次翻身。判定「${grade}」——这页记录是床头的 Mini Lindo（小林渡）亲眼盯出来的。`;
  } else if (live) {
    narrative = `林渡翻了哨站的实测环境读数：室温 ${temp}°C、PM2.5 ${pm25}，判定「${grade}」。Mini Lindo 的摄像头通道本次未启用，体动维度未计入。`;
  } else if (clipReport) {
    narrative = `林渡核对了本地估算读数与录像分析：室温 ${temp}°C、PM2.5 ${pm25}，录像里数出 ${clipReport.tossTurns} 次翻身。判定「${grade}」。`;
  } else {
    narrative = `林渡基于本地估算的环境读数做了判定：室温 ${temp}°C、CO₂ ${co2Ppm}ppm，判定「${grade}」。导入一段夜间录像可以补上体动维度。`;
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
