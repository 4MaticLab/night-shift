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
import { useI18n } from "@/src/i18n/provider";

export function SleepHardwareStatus({ onOpen, label = true }: { onOpen: () => void; label?: boolean }) {
  const { localize, t } = useI18n();
  const { mode, selectedDeviceId, selectedBridgeId, consent, activeCapture } = useSleepHardwareStore();
  const device = localize(getVirtualSleepDevice(selectedDeviceId));
  const bridge = localize(getSleepBridge(selectedBridgeId));
  const connected = mode === "virtual" && consent?.sourceId === selectedDeviceId;
  const status = activeCapture
    ? t("采集中")
    : connected
      ? device?.name
      : mode === "bridge"
        ? `${bridge?.name} · ${t("预演")}`
        : t("睡眠硬件");
  return (
    <button type="button" className={`sleep-hardware-status ${connected ? "connected" : ""} ${activeCapture ? "recording" : ""}`} onClick={onOpen} aria-label={`${t("打开睡眠硬件中心，当前")}${status}`}>
      {activeCapture ? <Activity /> : connected ? <Radio /> : <Watch />}
      {label && <span><small>{activeCapture ? "SIGNAL LIVE" : connected ? "LOCAL DEVICE" : "SLEEP LINK"}</small><b>{status}</b></span>}
      <ChevronRight />
    </button>
  );
}

export function SleepHardwarePanel({ onClose }: { onClose: () => void }) {
  const hardware = useSleepHardwareStore();
  const { localize, locale, t } = useI18n();
  const [tab, setTab] = useState<"virtual" | "bridge">(hardware.mode === "bridge" ? "bridge" : "virtual");
  const selectedDevice = localize(getVirtualSleepDevice(hardware.selectedDeviceId) ?? virtualSleepDevices[0]);
  const selectedBridge = localize(getSleepBridge(hardware.selectedBridgeId) ?? sleepBridges[0]);
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
      <motion.button type="button" aria-label={t("关闭睡眠硬件中心")} className="sleep-hardware-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside className="sleep-hardware-panel" role="dialog" aria-modal="true" aria-labelledby="sleep-hardware-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
        <header className="sleep-hardware-panel-header">
          <div><small>SOMATIC NIGHT DESK · {t("感官夜班台")}</small><h2 id="sleep-hardware-title">{locale === "en" ? <>Give the faint light<br />of a night to the city.</> : <>把一夜的微光<br />交给城市。</>}</h2></div>
          <button type="button" onClick={onClose} aria-label={t("关闭")}><X /></button>
        </header>
        <p className="sleep-hardware-lede">{t("设备信号只会丰富夜行与晨报。没有设备、没有好数据、或中途撤销，都不会让故事失败。")}</p>

        <div className="sleep-source-tabs" role="tablist" aria-label={t("硬件来源")}>
          <button type="button" role="tab" aria-selected={tab === "virtual"} onClick={() => setTab("virtual")}><Sparkles /> {t("虚拟硬件")} <small>{t("现在可玩")}</small></button>
          <button type="button" role="tab" aria-selected={tab === "bridge"} onClick={() => setTab("bridge")}><Cloud /> {t("真实桥接")} <small>{t("接口预演")}</small></button>
        </div>

        {tab === "virtual" ? (
          <section className="sleep-device-workbench">
            <div className="sleep-device-grid">
              {virtualSleepDevices.map((source) => {
                const device = localize(source);
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
                <span className={authorized ? "authorized" : ""}>{authorized ? <ShieldCheck /> : <LockKeyhole />}{authorized ? t("已在本机授权") : t("等待授权")}</span>
              </header>
              <div className="sleep-permission-list">
                {selectedDevice.permissions.map((permission) => {
                  const copy = localize(sleepPermissionCopy[permission]);
                  const checked = permissions.includes(permission);
                  return <button type="button" key={permission} aria-pressed={checked} disabled={permission === "sleep-window"} onClick={() => togglePermission(permission)}>
                    <span className={checked ? "checked" : ""}>{checked && <Check />}</span>
                    <div><b>{copy.label}</b><small>{copy.note}</small></div>
                  </button>;
                })}
              </div>
              <div className="sleep-consent-notice"><ShieldCheck /><p><b>{t("本地优先")}</b>：{t("只保存本夜摘要与最近 8 条记录；不保存原始时间序列，不上传，不作医学诊断。")}</p></div>
              {authorized ? (
                <div className="sleep-consent-actions">
                  <div><Radio /><span><small>READY FOR HANDOFF</small><b>{t("下一次夜班会自动采集")}</b></span></div>
                  <button type="button" onClick={hardware.revokeConsent}><Unplug /> {t("撤销授权")}</button>
                </div>
              ) : (
                <button type="button" className="sleep-authorize-button" onClick={() => hardware.grantConsent(permissions)}><LockKeyhole /> {t("授权这台虚拟设备")} <ChevronRight /></button>
              )}
            </article>
          </section>
        ) : (
          <section className="sleep-bridge-workbench">
            <aside className="bridge-prototype-stamp"><Cloud /><div><small>BRIDGE PROTOTYPE</small><b>{t("接口预演，不会发起真实连接")}</b><p>{t("这里用于验证厂商选择、能力映射和授权说明。OAuth、设备 SDK 与令牌服务尚未接入。")}</p></div></aside>
            <div className="sleep-bridge-list">
              {sleepBridges.map((source) => { const bridge = localize(source); return <button type="button" key={bridge.id} aria-pressed={hardware.mode === "bridge" && hardware.selectedBridgeId === bridge.id} onClick={() => hardware.selectBridge(bridge.id)}>
                <span>{bridge.id === "health-connect" ? <Smartphone /> : bridge.id === "oura-cloud" ? <MoonStar /> : <HeartPulse />}</span>
                <div><small>{bridge.ecosystem}</small><b>{bridge.name}</b><p>{bridge.note}</p></div>
                <ChevronRight />
              </button>; })}
            </div>
            <article className="bridge-permission-map">
              <small>PROPOSED DATA MAP · {t("拟接入摘要")}</small>
              <h3>{selectedBridge.name}</h3>
              <div>{selectedBridge.permissions.map((permission) => <span key={permission}><Check /> {localize(sleepPermissionCopy[permission]).label}</span>)}</div>
              <button type="button" disabled><CircleOff /> {t("等候真实 SDK 与服务端令牌桥")}</button>
              <p>{t("选择已经保存在本机，但界面不会把它标成“已连接”。要体验完整联动，请切回虚拟硬件。")}</p>
            </article>
          </section>
        )}
      </motion.aside>
    </>
  );
}

export function SleepHardwareHandoff({ onOpen, dark = false }: { onOpen: () => void; dark?: boolean }) {
  const { mode, selectedDeviceId, selectedBridgeId, consent } = useSleepHardwareStore();
  const { localize, locale, t } = useI18n();
  const device = localize(getVirtualSleepDevice(selectedDeviceId));
  const bridge = localize(getSleepBridge(selectedBridgeId));
  const ready = mode === "virtual" && consent?.sourceId === selectedDeviceId;
  return (
    <aside className={`sleep-handoff-card ${dark ? "dark" : ""} ${ready ? "ready" : ""}`}>
      <div className="sleep-handoff-icon">{ready ? <Radio /> : mode === "bridge" ? <Cloud /> : <Waves />}</div>
      <div><small>SOMATIC HANDOFF · {t("感官交接")}</small><b>{ready ? locale === "en" ? `${device?.name} is ready` : `${device?.name}已待命` : mode === "bridge" ? locale === "en" ? `${bridge?.name} remains a prototype` : `${bridge?.name}仍是接口预演` : t("不接设备也能照常出发")}</b><p>{ready ? locale === "en" ? `Tonight will read ${consent.permissions.length} kinds of summary signal and leave the report only on this device.` : `本夜会读取 ${consent.permissions.length} 类摘要信号，并只在本机留下晨报。` : mode === "bridge" ? t("真实授权尚未发生；本夜不会采集设备数据。") : t("你可以使用虚拟戒指、手表、床垫或枕头，让夜班对睡眠产生回应。")}</p></div>
      <button type="button" onClick={onOpen}>{ready ? t("查看设备") : t("打开硬件台")} <ChevronRight /></button>
    </aside>
  );
}

export function SleepHardwareNightTelemetry({ session, progress, onOpen, dark = false }: { session: SleepSession | null | undefined; progress: number; onOpen: () => void; dark?: boolean }) {
  const capture = useSleepHardwareStore((state) => state.activeCapture);
  const { localize, locale, t } = useI18n();
  if (!session || capture?.sessionId !== session.id) return null;
  const device = localize(getVirtualSleepDevice(capture.sourceId));
  const signals = localize(projectLiveSleepSignals(capture, progress));
  return (
    <aside className={`sleep-live-telemetry ${dark ? "dark" : ""}`}>
      <header><span><Activity /><i /></span><div><small>LOCAL SIGNAL · {t("本机信号")}</small><b>{locale === "en" ? `${device?.name} is recording` : `${device?.name}正在记录`}</b></div><button type="button" onClick={onOpen}>{t("查看")}</button></header>
      <div>
        <span><small>{signals.primaryLabel}</small><b>{signals.primaryValue}</b></span>
        <span><small>{signals.secondaryLabel}</small><b>{signals.secondaryValue}</b></span>
        <span><small>{signals.tertiaryLabel}</small><b>{signals.tertiaryValue}</b></span>
      </div>
      <p>{t("这是一段虚拟传感器投影，不是医疗设备读数。原始变化不会写入存档。")}</p>
    </aside>
  );
}

export function SleepHardwareMorningReceipt({ sessionId, dark = false }: { sessionId: string | undefined; dark?: boolean }) {
  const summary = useSleepHardwareStore((state) => sessionId ? state.history[sessionId] : undefined);
  const { localize, locale, t } = useI18n();
  if (!summary) return null;
  const device = localize(getVirtualSleepDevice(summary.sourceId));
  const metrics = [
    summary.averageHeartRate !== undefined ? [t("平均心率"), `${summary.averageHeartRate} bpm`] : null,
    summary.hrvMs !== undefined ? [t("HRV 摘要"), `${summary.hrvMs} ms`] : null,
    summary.respirationRate !== undefined ? [t("呼吸节律"), `${summary.respirationRate} /min`] : null,
    summary.restlessnessIndex !== undefined ? [t("夜间翻动"), `${summary.restlessnessIndex} / 100`] : null,
    summary.deepSleepMinutes !== undefined ? [t("深睡摘要"), `${summary.deepSleepMinutes} min`] : null,
    summary.wakeEvents !== undefined ? [t("醒转趋势"), locale === "en" ? `${summary.wakeEvents}` : `${summary.wakeEvents} 次`] : null,
  ].filter(Boolean).slice(0, 4) as [string, string][];
  return (
    <article className={`sleep-morning-receipt ${dark ? "dark" : ""}`}>
      <header><div><small>SOMATIC RECEIPT · {t("感官回执")}</small><h3>{locale === "en" ? `A night left by ${device?.name}` : `${device?.name}留下的一夜`}</h3></div><span><ShieldCheck /> {t("仅本机摘要")}</span></header>
      <div>{metrics.map(([label, value]) => <span key={label}><small>{label}</small><b>{value}</b></span>)}</div>
      <blockquote>“{t(summary.narrative)}”</blockquote>
      <p>{t("置信度")} {Math.round(summary.confidence * 100)}% · {t("虚拟样机")} · {t("非医疗结论")}</p>
    </article>
  );
}
