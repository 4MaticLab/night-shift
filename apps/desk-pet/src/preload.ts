import { contextBridge, ipcRenderer } from "electron";
import type { NightPetBridge, PetMode, SentryConfig } from "./shared/contracts";

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

// 渲染进程唯一的能力面：显式列举，不透传 ipcRenderer。
const bridge: NightPetBridge = {
  getSnapshot: () => ipcRenderer.invoke("pet:get-snapshot"),
  setManualMode: (mode: PetMode | null) => ipcRenderer.invoke("pet:set-manual-mode", mode),
  openDashboard: () => ipcRenderer.invoke("pet:open-dashboard"),
  importVoidClip: () => ipcRenderer.invoke("camera:import"),
  clearVoidClip: () => ipcRenderer.invoke("camera:clear"),
  generateSleepReport: () => ipcRenderer.invoke("sleep:generate-report"),
  connectSentry: (config: SentryConfig) => ipcRenderer.invoke("sentry:connect", config.host, config.port),
  disconnectSentry: () => ipcRenderer.invoke("sentry:disconnect"),
  quit: () => ipcRenderer.invoke("pet:quit"),
  onMode: (callback) => subscribe("pet:mode", callback),
  onPoints: (callback) => subscribe("points:changed", callback),
  onSensors: (callback) => subscribe("sensors:reading", callback),
  onVoidClip: (callback) => subscribe("camera:clip-changed", callback),
  onSentry: (callback) => subscribe("sentry:status", callback),
};

contextBridge.exposeInMainWorld("nightPet", bridge);
