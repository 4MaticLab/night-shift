// 主进程 / preload / 渲染进程共享的数据契约。
// 纯类型，不引任何运行时依赖：根仓库的测试与渲染进程 d.ts 都从这里取形状。

export type PetMode = "awake" | "sleeping";

/** 占位数据源标记：真传感器接上前，所有读数都打这个戳。 */
export type PlaceholderSource = "placeholder";

export interface TemperatureReading {
  valueC: number;
  unit: "°C";
}

export interface AirQualityReading {
  pm25: number;
  co2Ppm: number;
  humidityPct: number;
  label: string;
}

export interface SensorSnapshot {
  capturedAt: string;
  source: PlaceholderSource;
  temperature: TemperatureReading;
  airQuality: AirQualityReading;
}

export interface VoidClip {
  path: string;
  name: string;
  sizeBytes: number;
  importedAt: string;
}

export interface VoidClipReport {
  source: PlaceholderSource;
  clipPath: string;
  tossTurns: number;
  outOfBedEvents: number;
  longestQuietMinutes: number;
  restlessnessIndex: number;
  note: string;
}

export interface SleepQuality {
  score: number;
  grade: string;
  narrative: string;
  source: PlaceholderSource;
}

export interface SleepReport {
  generatedAt: string;
  snapshot: SensorSnapshot;
  clipReport: VoidClipReport | null;
  quality: SleepQuality;
}

export interface OfflineCreditResult {
  minutes: number;
  points: number;
}

export interface PointsPayload {
  total: number;
  exact: number;
  mode: PetMode;
  ratePerMinute: number;
  rank: string;
  offlineCredited: OfflineCreditResult;
}

export interface ModePayload {
  mode: PetMode;
  manual: boolean;
}

export interface PetSnapshot {
  mode: PetMode;
  manual: boolean;
  points: PointsPayload;
  sensors: SensorSnapshot;
  voidClip: VoidClip | null;
  lastReport: SleepReport | null;
  idleSleepSeconds: number;
}

/** preload 通过 contextBridge 暴露给两个窗口的完整能力面。 */
export interface NightPetBridge {
  getSnapshot(): Promise<PetSnapshot>;
  setManualMode(mode: PetMode | null): Promise<ModePayload>;
  openDashboard(): Promise<void>;
  importVoidClip(): Promise<VoidClip | null>;
  clearVoidClip(): Promise<null>;
  generateSleepReport(): Promise<SleepReport>;
  quit(): Promise<void>;
  onMode(callback: (payload: ModePayload) => void): () => void;
  onPoints(callback: (payload: PointsPayload) => void): () => void;
  onSensors(callback: (payload: SensorSnapshot) => void): () => void;
  onVoidClip(callback: (payload: VoidClip | null) => void): () => void;
}
