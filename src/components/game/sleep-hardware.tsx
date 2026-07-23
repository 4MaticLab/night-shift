"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Check,
  ChevronRight,
  CircleOff,
  Cloud,
  HeartPulse,
  LockKeyhole,
  MoonStar,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Unplug,
  Watch,
  Waves,
  X,
} from "lucide-react";
import { getAsset } from "@/src/content/assets";
import {
  getSleepBridge,
  getVirtualSleepDevice,
  sleepBridges,
  sleepPermissionCopy,
  virtualSleepDevices,
} from "@/src/content/sleep-devices";
import type { SleepSession } from "@/src/lib/game-engine/schema";
import { projectLiveSleepSignals } from "@/src/lib/sleep-hardware/simulator";
import type { SleepPermissionId } from "@/src/lib/sleep-hardware/types";
import { useSleepHardwareStore } from "@/src/stores/sleep-hardware-store";

export function SleepHardwareStatus({ onOpen, label = true }: { onOpen: () => void; label?: boolean }) {
  const { mode, selectedDeviceId, selectedBridgeId, consent, activeCapture } = useSleepHardwareStore();
  const device = getVirtualSleepDevice(selectedDeviceId);
  const bridge = getSleepBridge(selectedBridgeId);
  const connected = mode === "virtual" && consent?.sourceId === selectedDeviceId;
  const status = activeCapture
    ? "采集中"
    : connected
      ? device?.name
      : mode === "bridge"
        ? `${bridge?.name} · 预演`
        : "睡眠硬件";
  return (
    <button type="button" className={`sleep-hardware-status ${connected ? "connected" : ""} ${activeCapture ? "recording" : ""}`} onClick={onOpen} aria-label={`打开睡眠硬件中心，当前${status}`}>
      {activeCapture ? <Activity /> : connected ? <Radio /> : <Watch />}
      {label && <span><small>{activeCapture ? "SIGNAL LIVE" : connected ? "LOCAL DEVICE" : "SLEEP LINK"}</small><b>{status}</b></span>}
      <ChevronRight />
    </button>
  );
}

export function SleepHardwarePanel({ onClose }: { onClose: () => void }) {
  const hardware = useSleepHardwareStore();
  const [tab, setTab] = useState<"virtual" | "bridge">(hardware.mode === "bridge" ? "bridge" : "virtual");
  const selectedDevice = getVirtualSleepDevice(hardware.selectedDeviceId) ?? virtualSleepDevices[0];
  const selectedBridge = getSleepBridge(hardware.selectedBridgeId) ?? sleepBridges[0];
  const [permissions, setPermissions] = useState<SleepPermissionId[]>(hardware.consent?.sourceId === selectedDevice.id ? hardware.consent.permissions : selectedDevice.permissions);
  const authorized = hardware.mode === "virtual" && hardware.consent?.sourceId === selectedDevice.id;

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = priorOverflow;
      window.removeEventListener("keydown", escape);
    };
  }, [onClose]);

  const chooseDevice = (deviceId: typeof selectedDevice.id) => {
    const device = getVirtualSleepDevice(deviceId);
    if (!device) return;
    hardware.selectVirtualDevice(device.id);
    setPermissions(device.permissions);
  };

  const togglePermission = (permission: SleepPermissionId) => {
    if (permission === "sleep-window") return;
    setPermissions((current) => current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission]);
  };

  return (
    <>
      <motion.button type="button" aria-label="关闭睡眠硬件中心" className="sleep-hardware-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside className="sleep-hardware-panel" role="dialog" aria-modal="true" aria-labelledby="sleep-hardware-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
        <header className="sleep-hardware-panel-header">
          <div><small>SOMATIC NIGHT DESK · 感官夜班台</small><h2 id="sleep-hardware-title">把一夜的微光<br />交给城市。</h2></div>
          <button type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </header>
        <p className="sleep-hardware-lede">设备信号只会丰富夜行与晨报。没有设备、没有好数据、或中途撤销，都不会让故事失败。</p>

        <div className="sleep-source-tabs" role="tablist" aria-label="硬件来源">
          <button type="button" role="tab" aria-selected={tab === "virtual"} onClick={() => setTab("virtual")}><Sparkles /> 虚拟硬件 <small>现在可玩</small></button>
          <button type="button" role="tab" aria-selected={tab === "bridge"} onClick={() => setTab("bridge")}><Cloud /> 真实桥接 <small>接口预演</small></button>
        </div>

        {tab === "virtual" ? (
          <section className="sleep-device-workbench">
            <div className="sleep-device-grid">
              {virtualSleepDevices.map((device) => {
                const art = getAsset(device.assetId);
                const selected = hardware.mode === "virtual" && hardware.selectedDeviceId === device.id;
                return <button type="button" key={device.id} aria-pressed={selected} onClick={() => chooseDevice(device.id)}>
                  <span className="sleep-device-image"><Image src={art.src} alt={art.alt} fill sizes="(max-width: 600px) 44vw, 190px" /></span>
                  <span><small>{device.archiveName}</small><b>{device.name}</b><em>{device.shortDescription}</em></span>
                  {selected && <i><Check /></i>}
                </button>;
              })}
            </div>

            <article className="sleep-device-consent">
              <header>
                <div><small>LOCAL PERMISSION SHEET</small><h3>{selectedDevice.name}</h3><p>“{selectedDevice.fieldNote}”</p></div>
                <span className={authorized ? "authorized" : ""}>{authorized ? <ShieldCheck /> : <LockKeyhole />}{authorized ? "已在本机授权" : "等待授权"}</span>
              </header>
              <div className="sleep-permission-list">
                {selectedDevice.permissions.map((permission) => {
                  const copy = sleepPermissionCopy[permission];
                  const checked = permissions.includes(permission);
                  return <button type="button" key={permission} aria-pressed={checked} disabled={permission === "sleep-window"} onClick={() => togglePermission(permission)}>
                    <span className={checked ? "checked" : ""}>{checked && <Check />}</span>
                    <div><b>{copy.label}</b><small>{copy.note}</small></div>
                  </button>;
                })}
              </div>
              <div className="sleep-consent-notice"><ShieldCheck /><p><b>本地优先</b>：只保存本夜摘要与最近 8 条记录；不保存原始时间序列，不上传，不作医学诊断。</p></div>
              {authorized ? (
                <div className="sleep-consent-actions">
                  <div><Radio /><span><small>READY FOR HANDOFF</small><b>下一次夜班会自动采集</b></span></div>
                  <button type="button" onClick={hardware.revokeConsent}><Unplug /> 撤销授权</button>
                </div>
              ) : (
                <button type="button" className="sleep-authorize-button" onClick={() => hardware.grantConsent(permissions)}><LockKeyhole /> 授权这台虚拟设备 <ChevronRight /></button>
              )}
            </article>
          </section>
        ) : (
          <section className="sleep-bridge-workbench">
            <aside className="bridge-prototype-stamp"><Cloud /><div><small>BRIDGE PROTOTYPE</small><b>接口预演，不会发起真实连接</b><p>这里用于验证厂商选择、能力映射和授权说明。OAuth、设备 SDK 与令牌服务尚未接入。</p></div></aside>
            <div className="sleep-bridge-list">
              {sleepBridges.map((bridge) => <button type="button" key={bridge.id} aria-pressed={hardware.mode === "bridge" && hardware.selectedBridgeId === bridge.id} onClick={() => hardware.selectBridge(bridge.id)}>
                <span>{bridge.id === "health-connect" ? <Smartphone /> : bridge.id === "oura-cloud" ? <MoonStar /> : <HeartPulse />}</span>
                <div><small>{bridge.ecosystem}</small><b>{bridge.name}</b><p>{bridge.note}</p></div>
                <ChevronRight />
              </button>)}
            </div>
            <article className="bridge-permission-map">
              <small>PROPOSED DATA MAP · 拟接入摘要</small>
              <h3>{selectedBridge.name}</h3>
              <div>{selectedBridge.permissions.map((permission) => <span key={permission}><Check /> {sleepPermissionCopy[permission].label}</span>)}</div>
              <button type="button" disabled><CircleOff /> 等候真实 SDK 与服务端令牌桥</button>
              <p>选择已经保存在本机，但界面不会把它标成“已连接”。要体验完整联动，请切回虚拟硬件。</p>
            </article>
          </section>
        )}
      </motion.aside>
    </>
  );
}

export function SleepHardwareHandoff({ onOpen, dark = false }: { onOpen: () => void; dark?: boolean }) {
  const { mode, selectedDeviceId, selectedBridgeId, consent } = useSleepHardwareStore();
  const device = getVirtualSleepDevice(selectedDeviceId);
  const bridge = getSleepBridge(selectedBridgeId);
  const ready = mode === "virtual" && consent?.sourceId === selectedDeviceId;
  return (
    <aside className={`sleep-handoff-card ${dark ? "dark" : ""} ${ready ? "ready" : ""}`}>
      <div className="sleep-handoff-icon">{ready ? <Radio /> : mode === "bridge" ? <Cloud /> : <Waves />}</div>
      <div><small>SOMATIC HANDOFF · 感官交接</small><b>{ready ? `${device?.name}已待命` : mode === "bridge" ? `${bridge?.name}仍是接口预演` : "不接设备也能照常出发"}</b><p>{ready ? `本夜会读取 ${consent.permissions.length} 类摘要信号，并只在本机留下晨报。` : mode === "bridge" ? "真实授权尚未发生；本夜不会采集设备数据。" : "你可以使用虚拟戒指、手表、床垫或枕头，让夜班对睡眠产生回应。"}</p></div>
      <button type="button" onClick={onOpen}>{ready ? "查看设备" : "打开硬件台"} <ChevronRight /></button>
    </aside>
  );
}

export function SleepHardwareNightTelemetry({ session, progress, onOpen, dark = false }: { session: SleepSession | null | undefined; progress: number; onOpen: () => void; dark?: boolean }) {
  const capture = useSleepHardwareStore((state) => state.activeCapture);
  if (!session || capture?.sessionId !== session.id) return null;
  const device = getVirtualSleepDevice(capture.sourceId);
  const signals = projectLiveSleepSignals(capture, progress);
  return (
    <aside className={`sleep-live-telemetry ${dark ? "dark" : ""}`}>
      <header><span><Activity /><i /></span><div><small>LOCAL SIGNAL · 本机信号</small><b>{device?.name}正在记录</b></div><button type="button" onClick={onOpen}>查看</button></header>
      <div>
        <span><small>{signals.primaryLabel}</small><b>{signals.primaryValue}</b></span>
        <span><small>{signals.secondaryLabel}</small><b>{signals.secondaryValue}</b></span>
        <span><small>{signals.tertiaryLabel}</small><b>{signals.tertiaryValue}</b></span>
      </div>
      <p>这是一段虚拟传感器投影，不是医疗设备读数。原始变化不会写入存档。</p>
    </aside>
  );
}

export function SleepHardwareMorningReceipt({ sessionId, dark = false }: { sessionId: string | undefined; dark?: boolean }) {
  const summary = useSleepHardwareStore((state) => sessionId ? state.history[sessionId] : undefined);
  if (!summary) return null;
  const device = getVirtualSleepDevice(summary.sourceId);
  const metrics = [
    summary.averageHeartRate !== undefined ? ["平均心率", `${summary.averageHeartRate} bpm`] : null,
    summary.hrvMs !== undefined ? ["HRV 摘要", `${summary.hrvMs} ms`] : null,
    summary.respirationRate !== undefined ? ["呼吸节律", `${summary.respirationRate} /min`] : null,
    summary.restlessnessIndex !== undefined ? ["夜间翻动", `${summary.restlessnessIndex} / 100`] : null,
    summary.deepSleepMinutes !== undefined ? ["深睡摘要", `${summary.deepSleepMinutes} min`] : null,
    summary.wakeEvents !== undefined ? ["醒转趋势", `${summary.wakeEvents} 次`] : null,
  ].filter(Boolean).slice(0, 4) as [string, string][];
  return (
    <article className={`sleep-morning-receipt ${dark ? "dark" : ""}`}>
      <header><div><small>SOMATIC RECEIPT · 感官回执</small><h3>{device?.name}留下的一夜</h3></div><span><ShieldCheck /> 仅本机摘要</span></header>
      <div>{metrics.map(([label, value]) => <span key={label}><small>{label}</small><b>{value}</b></span>)}</div>
      <blockquote>“{summary.narrative}”</blockquote>
      <p>置信度 {Math.round(summary.confidence * 100)}% · 虚拟样机 · 非医疗结论</p>
    </article>
  );
}

