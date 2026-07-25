// 主进程 / preload / 渲染进程共享的数据契约。
// 纯类型，不引任何运行时依赖：根仓库的测试与渲染进程 d.ts 都从这里取形状。

export type PetMode = "awake" | "sleeping";

/** 传感器数据源：占位假数据，或床头的 RDK X5 哨站实测。 */
export type SensorSource = "placeholder" | "rdk-x5";

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
  source: SensorSource;
  temperature: TemperatureReading;
  airQuality: AirQualityReading;
  /** 哨站某路硬件缺席时，由占位值补齐的字段名。 */
  degradedFields?: string[];
}

export interface VoidClip {
  path: string;
  name: string;
  sizeBytes: number;
  importedAt: string;
}

export interface VoidClipReport {
  source: SensorSource;
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
  source: SensorSource;
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

/** 床头哨站（RDK X5）连接配置：仅局域网直连。 */
export interface SentryConfig {
  host: string;
  port: number;
}

export type SentryConnectionState = "disconnected" | "online" | "error";

export interface SentryStatus {
  state: SentryConnectionState;
  config: SentryConfig | null;
  /** 哨站自报的设备名，如 "rdk-x5"。 */
  device: string | null;
  /** 哨站跑在 mock 模式（合成数据）时为 true，UI 如实展示。 */
  mock: boolean;
  lastSeenAt: string | null;
  /** 最近一帧被占位值补齐的字段（硬件缺席降级）。 */
  degradedFields: string[];
  error: string | null;
}

/** 哨站摄像头体动聚合统计（板端就地分析，不含任何图像）。 */
export interface SentryMotionStats {
  windowMinutes: number;
  tossTurns: number;
  outOfBedEvents: number;
  longestQuietMinutes: number;
  restlessnessIndex: number;
}

export interface PetSnapshot {
  mode: PetMode;
  manual: boolean;
  points: PointsPayload;
  sensors: SensorSnapshot;
  voidClip: VoidClip | null;
  lastReport: SleepReport | null;
  sentry: SentryStatus;
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
  connectSentry(config: SentryConfig): Promise<SentryStatus>;
  disconnectSentry(): Promise<SentryStatus>;
  quit(): Promise<void>;
  onMode(callback: (payload: ModePayload) => void): () => void;
  onPoints(callback: (payload: PointsPayload) => void): () => void;
  onSensors(callback: (payload: SensorSnapshot) => void): () => void;
  onVoidClip(callback: (payload: VoidClip | null) => void): () => void;
  onSentry(callback: (payload: SentryStatus) => void): () => void;
}
