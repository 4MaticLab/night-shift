// Night Shift 桌宠主进程。
// 两个窗口：透明桌宠窗（林渡）+ 夜班面板窗（积分账本 / 传感器占位 / 虚空摄像头）。
// 空闲检测走 powerMonitor：系统闲置超过阈值，林渡自己去蓝盒子床垫躺下。

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  powerMonitor,
  screen,
  Tray,
} from "electron";
import { statSync } from "node:fs";
import { basename, join } from "node:path";

import { analyzeVoidCameraClip, createSensorSnapshot, scoreSleepQuality } from "./lib/fake-sensors";
import { accruePoints, offlineCredit, rankForPoints, RATES } from "./lib/points";
import {
  motionToClipReport,
  normalizeSentryConfig,
  parseSentryMotion,
  parseSentrySnapshot,
  sentryBaseUrl,
} from "./lib/rdk-bridge";
import { DEFAULT_STATE, loadState, saveState, type PetState } from "./lib/store";
import type {
  ModePayload,
  OfflineCreditResult,
  PetMode,
  PetSnapshot,
  PointsPayload,
  SensorSnapshot,
  SentryStatus,
  VoidClip,
  VoidClipReport,
} from "./shared/contracts";

const IDLE_SLEEP_SECONDS = 90; // 系统闲置这么久后，林渡去床垫躺下
const TICK_MS = 15_000; // 积分与空闲检查节拍
const SENSOR_MS = 5_000; // 传感器推送节拍（占位生成 / 哨站轮询共用）
const SENTRY_TIMEOUT_MS = 3_000; // 哨站单次请求超时
const SENTRY_MAX_FAILURES = 2; // 连续失败这么多次后判定掉线，回退占位数据

const stateFile = () => join(app.getPath("userData"), "night-shift-desk-pet.json");
// 编译产物在 dist/，美术素材仍取仓库 public/art
const artRoot = join(__dirname, "..", "..", "..", "public", "art");
const rendererRoot = join(__dirname, "..", "renderer");

let petWindow: BrowserWindow | null = null;
let dashboardWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

let state: PetState = { ...DEFAULT_STATE };
let mode: PetMode = "awake";
let manualMode: PetMode | null = null; // 用户双击林渡强行哄睡 / 叫醒
let offlineCredited: OfflineCreditResult = { minutes: 0, points: 0 };
let lastTickAt = Date.now();
let sensorHistory: SensorSnapshot[] = []; // 最近的读数（占位或哨站），出报告时取最新一帧
let sentryStatus: SentryStatus = emptySentryStatus();
let sentryFailures = 0;

function emptySentryStatus(): SentryStatus {
  return {
    state: "disconnected",
    config: null,
    device: null,
    mock: false,
    lastSeenAt: null,
    degradedFields: [],
    error: null,
  };
}

async function fetchSentryJson(path: string): Promise<unknown> {
  if (!sentryStatus.config) throw new Error("sentry not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SENTRY_TIMEOUT_MS);
  try {
    const response = await fetch(`${sentryBaseUrl(sentryStatus.config)}${path}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`sentry http ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function setSentryStatus(next: Partial<SentryStatus>): void {
  sentryStatus = { ...sentryStatus, ...next };
  broadcast("sentry:status", sentryStatus);
}

function createPetWindow(): void {
  petWindow = new BrowserWindow({
    width: 300,
    height: 380,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: { preload: join(__dirname, "preload.js") },
  });
  petWindow.setAlwaysOnTop(true, "floating");
  // 默认落在主屏右下角，像趴在桌角
  const { workArea } = screen.getPrimaryDisplay();
  petWindow.setPosition(workArea.x + workArea.width - 320, workArea.y + workArea.height - 400);
  petWindow.loadFile(join(rendererRoot, "pet.html"));
  petWindow.on("closed", () => { petWindow = null; });
}

function openDashboard(): void {
  if (dashboardWindow) {
    dashboardWindow.show();
    dashboardWindow.focus();
    return;
  }
  dashboardWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    title: "Night Shift · 夜班面板",
    backgroundColor: "#0b1020",
    webPreferences: { preload: join(__dirname, "preload.js") },
  });
  dashboardWindow.loadFile(join(rendererRoot, "dashboard.html"));
  dashboardWindow.on("closed", () => { dashboardWindow = null; });
}

function broadcast(channel: string, payload: unknown): void {
  for (const win of [petWindow, dashboardWindow]) {
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function currentMode(): PetMode {
  if (manualMode) return manualMode;
  return powerMonitor.getSystemIdleTime() >= IDLE_SLEEP_SECONDS ? "sleeping" : "awake";
}

function tick(): void {
  const now = Date.now();
  state.points += accruePoints(mode, now - lastTickAt);
  lastTickAt = now;

  const nextMode = currentMode();
  if (nextMode !== mode) {
    mode = nextMode;
    broadcast("pet:mode", { mode, manual: manualMode !== null } satisfies ModePayload);
  }

  state.lastSeenAt = new Date(now).toISOString();
  saveState(stateFile(), state);
  broadcast("points:changed", pointsPayload());
}

function pointsPayload(): PointsPayload {
  return {
    total: Math.floor(state.points),
    exact: state.points,
    mode,
    ratePerMinute: mode === "sleeping" ? RATES.sleeping : RATES.awake,
    rank: rankForPoints(state.points),
    offlineCredited,
  };
}

function pushSensors(): void {
  void (async () => {
    const placeholder = createSensorSnapshot(Date.now());
    let snapshot = placeholder;

    if (sentryStatus.config) {
      try {
        const raw = await fetchSentryJson("/api/v1/snapshot");
        const parsed = parseSentrySnapshot(raw, placeholder);
        if (!parsed) throw new Error("sentry snapshot malformed");
        snapshot = parsed.snapshot;
        sentryFailures = 0;
        setSentryStatus({
          state: "online",
          mock: parsed.mock,
          lastSeenAt: snapshot.capturedAt,
          degradedFields: parsed.degradedFields,
          error: null,
        });
      } catch (error) {
        sentryFailures += 1;
        if (sentryFailures >= SENTRY_MAX_FAILURES && sentryStatus.state !== "error") {
          // 掉线回退占位数据：不惩罚、不锁功能，UI 如实标注
          setSentryStatus({ state: "error", error: String(error) });
        }
      }
    }

    sensorHistory.push(snapshot);
    if (sensorHistory.length > 120) sensorHistory = sensorHistory.slice(-120);
    broadcast("sensors:reading", snapshot);
  })();
}

/** 哨站在线时拉一份实测体动统计；拉不到（摄像头离线 / 掉线）返回 null。 */
async function fetchSentryClipReport(): Promise<VoidClipReport | null> {
  if (!sentryStatus.config || sentryStatus.state !== "online") return null;
  try {
    const stats = parseSentryMotion(await fetchSentryJson("/api/v1/motion"));
    return stats ? motionToClipReport(stats, sentryStatus.config) : null;
  } catch {
    return null;
  }
}

function registerIpc(): void {
  ipcMain.handle("pet:get-snapshot", (): PetSnapshot & { art: Record<string, string> } => ({
    mode,
    manual: manualMode !== null,
    points: pointsPayload(),
    sensors: sensorHistory.at(-1) ?? createSensorSnapshot(Date.now()),
    voidClip: state.voidClip,
    lastReport: state.lastReport,
    sentry: sentryStatus,
    art: {
      linDu: join(artRoot, "characters", "lin-du-handoff-portrait-v1.webp"),
      mattress: join(artRoot, "hardware", "virtual-mattress-v1.webp"),
      logo: join(artRoot, "brand", "night-shift-logo-mark-v1.webp"),
    },
    idleSleepSeconds: IDLE_SLEEP_SECONDS,
  }));

  ipcMain.handle("pet:set-manual-mode", (_event, requested: unknown): ModePayload => {
    manualMode = requested === "awake" || requested === "sleeping" ? requested : null;
    tick();
    return { mode, manual: manualMode !== null };
  });

  ipcMain.handle("pet:open-dashboard", () => openDashboard());
  ipcMain.handle("pet:quit", () => app.quit());

  ipcMain.handle("camera:import", async (): Promise<VoidClip | null> => {
    const parent = dashboardWindow ?? petWindow;
    const options = {
      title: "导入虚空摄像头录像",
      properties: ["openFile" as const],
      filters: [{ name: "视频", extensions: ["mp4", "mov", "webm", "mkv", "avi"] }],
    };
    const result = parent
      ? await dialog.showOpenDialog(parent, options)
      : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return state.voidClip;
    const clipPath = result.filePaths[0];
    let sizeBytes = 0;
    try { sizeBytes = statSync(clipPath).size; } catch { /* 文件读不到就按 0 记 */ }
    state.voidClip = {
      path: clipPath,
      name: basename(clipPath),
      sizeBytes,
      importedAt: new Date().toISOString(),
    };
    saveState(stateFile(), state);
    broadcast("camera:clip-changed", state.voidClip);
    return state.voidClip;
  });

  ipcMain.handle("camera:clear", () => {
    state.voidClip = null;
    saveState(stateFile(), state);
    broadcast("camera:clip-changed", null);
    return null;
  });

  ipcMain.handle("sleep:generate-report", async () => {
    const snapshot = sensorHistory.at(-1) ?? createSensorSnapshot(Date.now());
    // 体动统计优先用床头哨站实测；哨站不在时退回导入录像的占位分析
    const sentryReport = await fetchSentryClipReport();
    const clipReport = sentryReport ?? (state.voidClip ? analyzeVoidCameraClip(state.voidClip) : undefined);
    const quality = scoreSleepQuality(snapshot, clipReport);
    state.lastReport = {
      generatedAt: new Date().toISOString(),
      snapshot,
      clipReport: clipReport ?? null,
      quality,
    };
    saveState(stateFile(), state);
    return state.lastReport;
  });

  ipcMain.handle("sentry:connect", async (_event, rawHost: unknown, rawPort: unknown): Promise<SentryStatus> => {
    const config = normalizeSentryConfig(rawHost, rawPort);
    if (!config) {
      setSentryStatus({ ...emptySentryStatus(), state: "error", error: "地址不合法：需要 主机名/IP 与 1–65535 端口" });
      return sentryStatus;
    }
    sentryStatus = { ...emptySentryStatus(), config };
    sentryFailures = 0;
    try {
      const health = await fetchSentryJson("/api/v1/health") as Record<string, unknown>;
      if (health?.ok !== true) throw new Error("哨站健康检查未通过");
      setSentryStatus({
        state: "online",
        device: typeof health.device === "string" ? health.device : null,
        mock: health.mock === true,
        lastSeenAt: new Date().toISOString(),
        error: null,
      });
      state.sentryConfig = config;
      saveState(stateFile(), state);
      pushSensors(); // 立即拉一帧实测，不等下个节拍
    } catch (error) {
      setSentryStatus({ state: "error", error: String(error) });
    }
    return sentryStatus;
  });

  ipcMain.handle("sentry:disconnect", (): SentryStatus => {
    sentryStatus = emptySentryStatus();
    sentryFailures = 0;
    state.sentryConfig = null;
    saveState(stateFile(), state);
    broadcast("sentry:status", sentryStatus);
    pushSensors(); // 立即回到占位数据，UI 不留旧帧
    return sentryStatus;
  });
}

function setupTray(): void {
  try {
    const icon = nativeImage
      .createFromPath(join(artRoot, "brand", "night-shift-logo-v1.png"))
      .resize({ width: 18, height: 18 });
    tray = new Tray(icon);
    tray.setToolTip("Night Shift 桌宠 · 林渡在值更");
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: "打开夜班面板", click: () => openDashboard() },
      { label: "显示林渡", click: () => petWindow?.show() },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ]));
  } catch (error) {
    console.error("desk-pet: tray unavailable", error);
  }
}

void app.whenReady().then(() => {
  state = loadState(stateFile());
  offlineCredited = offlineCredit(state.lastSeenAt, Date.now());
  state.points += offlineCredited.points;
  lastTickAt = Date.now();
  // 上次配过的哨站自动重连：先挂配置，首次 pushSensors 探活后自然转 online
  if (state.sentryConfig) {
    sentryStatus = { ...emptySentryStatus(), config: state.sentryConfig };
  }

  registerIpc();
  createPetWindow();
  setupTray();
  pushSensors();

  setInterval(tick, TICK_MS);
  setInterval(pushSensors, SENSOR_MS);
});

app.on("window-all-closed", () => {
  // 桌宠窗关掉即视为下班
  app.quit();
});

app.on("before-quit", () => {
  state.points += accruePoints(mode, Date.now() - lastTickAt);
  state.lastSeenAt = new Date().toISOString();
  saveState(stateFile(), state);
});
