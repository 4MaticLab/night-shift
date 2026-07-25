"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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
  Waves,
  Router,
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
import { useAccessibleDialog } from "@/src/lib/use-accessible-dialog";
import { AmbientHardwareWorkbench } from "./ambient-hardware";

gsap.registerPlugin(useGSAP);

const bridgeVirtualMatches = {
  "apple-health": "watch-17",
  "health-connect": "watch-17",
  "oura-cloud": "night-ring",
  "fitbit-web": "watch-17",
} as const;

export function SleepHardwarePanel({ onClose }: { onClose: () => void }) {
  const hardware = useSleepHardwareStore();
  const { localize, locale, t } = useI18n();
  const [tab, setTab] = useState<"virtual" | "bridge" | "ambient">(hardware.mode === "bridge" ? "bridge" : "virtual");
  const [draftDeviceId, setDraftDeviceId] = useState(hardware.selectedDeviceId);
  const [draftBridgeId, setDraftBridgeId] = useState(hardware.selectedBridgeId);
  const [justConnected, setJustConnected] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const consentRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const selectedDevice = localize(getVirtualSleepDevice(draftDeviceId) ?? virtualSleepDevices[0]);
  const selectedBridge = localize(getSleepBridge(draftBridgeId) ?? sleepBridges[0]);
  const connectedDevice = hardware.mode === "virtual" && hardware.consent
    ? localize(getVirtualSleepDevice(hardware.consent.sourceId))
    : undefined;
  const [permissions, setPermissions] = useState<SleepPermissionId[]>(hardware.consent?.sourceId === selectedDevice.id ? hardware.consent.permissions : selectedDevice.permissions);
  const authorized = hardware.mode === "virtual" && hardware.consent?.sourceId === selectedDevice.id;
  const permissionsMatch = authorized
    && permissions.length === hardware.consent?.permissions.length
    && permissions.every((permission) => hardware.consent?.permissions.includes(permission));
  const ready = authorized && permissionsMatch;
  const connected = Boolean(connectedDevice);

  useAccessibleDialog(panelRef, onClose, { returnFocusSelector: ".sleep-hardware-status" });

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(headerRef.current, { y: -30, opacity: 0, duration: .8 })
        .from(ledeRef.current, { y: 20, opacity: 0, duration: .7 }, "-=0.5")
        .from(summaryRef.current, { y: 20, opacity: 0, duration: .7 }, "-=0.5")
        .from(stepsRef.current, { y: 20, opacity: 0, duration: .6 }, "-=0.4")
        .from(tabsRef.current, { y: 20, opacity: 0, duration: .6 }, "-=0.4");
    });
  }, { scope: panelRef, dependencies: [] });

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, []);

  const chooseDevice = (deviceId: typeof selectedDevice.id) => {
    const device = getVirtualSleepDevice(deviceId);
    if (!device) return;
    setDraftDeviceId(device.id);
    setPermissions(hardware.consent?.sourceId === device.id ? hardware.consent.permissions : device.permissions);
    setJustConnected(false);
  };

  const togglePermission = (permission: SleepPermissionId) => {
    if (permission === "sleep-window") return;
    setPermissions((current) => current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission]);
  };

  const authorizeDevice = () => {
    if (hardware.authorizeVirtualDevice(selectedDevice.id, permissions)) {
      setJustConnected(true);
    }
  };

  const scrollToConsent = () => consentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const previewBridgeWithVirtualDevice = () => {
    const matchedDeviceId = bridgeVirtualMatches[selectedBridge.id];
    chooseDevice(matchedDeviceId);
    setTab("virtual");
    window.setTimeout(scrollToConsent, 80);
  };

  return (
    <motion.div className="sleep-hardware-layer" data-dialog-layer initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}>
      <motion.button type="button" aria-label={t("关闭睡眠硬件中心")} className="sleep-hardware-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside ref={panelRef} className="sleep-hardware-panel" role="dialog" aria-modal="true" aria-labelledby="sleep-hardware-title" tabIndex={-1} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
        <header ref={headerRef} className="sleep-hardware-panel-header">
          <div><small>SOMATIC NIGHT DESK · {t("感官夜班台")}</small><h2 id="sleep-hardware-title">{locale === "en" ? <>Give the faint light<br />of a night to the city.</> : <>把一夜的微光<br />交给城市。</>}</h2></div>
          <button type="button" data-dialog-initial-focus onClick={onClose} aria-label={t("关闭")}><X /></button>
        </header>
        <p ref={ledeRef} className="sleep-hardware-lede">{t("设备信号只会丰富夜行与晨报。没有设备、没有好数据、或中途撤销，都不会让故事失败。")}</p>

        <aside ref={summaryRef} className={`sleep-connection-summary ${connected ? "connected" : ""} ${hardware.activeCapture ? "recording" : ""}`}>
          <span>{hardware.activeCapture ? <Activity /> : connected ? <Radio /> : <Waves />}</span>
          <div>
            <small>{hardware.activeCapture ? "NIGHT SIGNAL LIVE" : connected ? "LOCAL LINK READY" : "OPTIONAL SOMATIC LAYER"}</small>
            <b>{hardware.activeCapture
              ? locale === "en" ? `${connectedDevice?.name ?? "Virtual device"} is recording` : `${connectedDevice?.name ?? "虚拟设备"}正在记录`
              : connected
                ? locale === "en" ? `${connectedDevice?.name} connected` : `${connectedDevice?.name}已连接`
                : t("尚未连接设备，也能完整游玩")}</b>
            <p>{hardware.activeCapture
              ? t("本夜采集中。为保护回执一致性，晨报生成前不能更换设备或权限。")
              : connected
                ? locale === "en"
                  ? `${hardware.consent?.permissions.length ?? 0} summary categories allowed; capture will start with the next night shift.`
                  : `已允许 ${hardware.consent?.permissions.length ?? 0} 类摘要；下一次夜班出发时自动开始。`
                : t("连接虚拟硬件只需要一次确认；原始时间序列不会写进存档。")}</p>
          </div>
          {connected && <i><ShieldCheck /> {t("仅本机")}</i>}
        </aside>

        <ol ref={stepsRef} className="sleep-setup-steps" aria-label={t("连接步骤")}>
          <li className={tab === "virtual" ? "active" : ""}><span>01</span><b>{t("选择设备")}</b></li>
          <li><span>02</span><b>{t("确认摘要")}</b></li>
          <li className={connected ? "done" : ""}><span>{connected ? <Check /> : "03"}</span><b>{t("夜班自动记录")}</b></li>
        </ol>

        <div ref={tabsRef} className="sleep-source-tabs" role="tablist" aria-label={t("硬件来源")}>
          <button type="button" role="tab" aria-selected={tab === "virtual"} onClick={() => setTab("virtual")}><Sparkles /> {t("虚拟硬件")} <small>{t("现在可玩")}</small></button>
          <button type="button" role="tab" aria-selected={tab === "bridge"} onClick={() => setTab("bridge")}><Cloud /> {t("真实桥接")} <small>{t("接口预演")}</small></button>
          <button type="button" role="tab" aria-selected={tab === "ambient"} onClick={() => setTab("ambient")}><Router /> {t("房间外设")} <small>HOME ASSISTANT</small></button>
        </div>

        {tab === "ambient" ? <AmbientHardwareWorkbench /> : tab === "virtual" ? (
          <section className="sleep-device-workbench">
            <header className="sleep-workbench-heading">
              <div><small>STEP 01 · CHOOSE A SIGNAL</small><h3>{t("选择今晚要模拟的设备")}</h3></div>
              <p>{t("点选只会准备一份授权草稿。现有连接会一直保留，直到你在下一步明确确认。")}</p>
            </header>
            <div className="sleep-device-grid">
              {virtualSleepDevices.map((source) => {
                const device = localize(source);
                const art = getAsset(device.assetId);
                const selected = draftDeviceId === device.id;
                const active = connectedDevice?.id === device.id;
                return <button type="button" key={device.id} aria-pressed={selected} onClick={() => chooseDevice(device.id)}>
                  <span className="sleep-device-image"><Image src={art.src} alt={art.alt} fill sizes="(max-width: 600px) 44vw, 190px" /></span>
                  <span><small>{device.archiveName}</small><b>{device.name}</b><em>{device.shortDescription}</em>{active && <strong><Radio /> {t("正在使用")}</strong>}</span>
                  {selected && <i><Check /></i>}
                </button>;
              })}
            </div>

            <button type="button" className="sleep-continue-button" onClick={scrollToConsent}>
              <span><small>NEXT · STEP 02</small><b>{locale === "en" ? `Review summary permissions for ${selectedDevice.name}` : `继续确认 ${selectedDevice.name} 的摘要权限`}</b></span><ChevronRight />
            </button>

            <article ref={consentRef} className={`sleep-device-consent ${justConnected && ready ? "just-connected" : ""}`}>
              <header>
                <div><small>STEP 02 · LOCAL PERMISSION SHEET</small><h3>{selectedDevice.name}</h3><p>“{selectedDevice.fieldNote}”</p></div>
                <span className={ready ? "authorized" : ""}>{ready ? <ShieldCheck /> : <LockKeyhole />}{ready ? t("已在本机授权") : connected ? t("现有连接仍保留") : t("等待你的确认")}</span>
              </header>
              <div className="sleep-permission-list">
                {selectedDevice.permissions.map((permission) => {
                  const copy = localize(sleepPermissionCopy[permission]);
                  const checked = permissions.includes(permission);
                  return <button type="button" key={permission} aria-pressed={checked} disabled={permission === "sleep-window"} onClick={() => togglePermission(permission)}>
                    <span className={checked ? "checked" : ""}>{checked && <Check />}</span>
                    <div><b>{copy.label}{permission === "sleep-window" && <em>{t("必要")}</em>}</b><small>{copy.note}</small></div>
                  </button>;
                })}
              </div>
              <div className="sleep-consent-notice"><ShieldCheck /><p><b>{t("本地优先")}</b>{locale === "en" ? ": " : "："}{t("只保存本夜摘要与最近 8 条记录；不保存原始时间序列，不上传，不作医学诊断。")}</p></div>
              {ready ? (
                <div className="sleep-consent-actions">
                  <div><Radio /><span><small>{justConnected ? "CONNECTION COMPLETE" : "READY FOR HANDOFF"}</small><b>{justConnected ? t("连接完成，可以回到游戏了") : t("下一次夜班会自动采集")}</b></span></div>
                  {justConnected
                    ? <button type="button" className="sleep-done-button" onClick={onClose}>{t("完成并返回游戏")} <ChevronRight /></button>
                    : <button type="button" onClick={hardware.revokeConsent}><Unplug /> {t("撤销授权")}</button>}
                </div>
              ) : (
                <button type="button" className="sleep-authorize-button" disabled={Boolean(hardware.activeCapture)} onClick={authorizeDevice}>
                  <LockKeyhole />
                  {hardware.activeCapture
                    ? t("本夜采集中，晨报后可更换")
                    : connected
                      ? locale === "en" ? `Switch to ${selectedDevice.name}` : `确认改用 ${selectedDevice.name}`
                      : locale === "en" ? `Authorise and connect ${selectedDevice.name}` : `授权并连接 ${selectedDevice.name}`}
                  <ChevronRight />
                </button>
              )}
            </article>
          </section>
        ) : (
          <section className="sleep-bridge-workbench">
            <aside className="bridge-prototype-stamp"><Cloud /><div><small>BRIDGE PROTOTYPE</small><b>{t("可以浏览，不会改动当前连接")}</b><p>{t("这里用于预演厂商选择、能力映射和授权说明。OAuth、设备 SDK 与令牌服务尚未接入。")}</p></div></aside>
            <div className="sleep-bridge-list">
              {sleepBridges.map((source) => { const bridge = localize(source); return <button type="button" key={bridge.id} aria-pressed={draftBridgeId === bridge.id} onClick={() => setDraftBridgeId(bridge.id)}>
                <span>{bridge.id === "health-connect" ? <Smartphone /> : bridge.id === "oura-cloud" ? <MoonStar /> : <HeartPulse />}</span>
                <div><small>{bridge.ecosystem}</small><b>{bridge.name}</b><p>{bridge.note}</p></div>
                <ChevronRight />
              </button>; })}
            </div>
            <article className="bridge-permission-map">
              <small>PROPOSED DATA MAP · {t("拟接入摘要")}</small>
              <h3>{selectedBridge.name}</h3>
              <div>{selectedBridge.permissions.map((permission) => <span key={permission}><Check /> {localize(sleepPermissionCopy[permission]).label}</span>)}</div>
              <p><CircleOff /> {t("真实授权尚未开放。你可以先用能力相近的虚拟设备跑通完整夜班联动。")}</p>
              <button type="button" onClick={previewBridgeWithVirtualDevice}>
                <Sparkles /> {locale === "en"
                  ? `Try this flow with ${localize(getVirtualSleepDevice(bridgeVirtualMatches[selectedBridge.id]))?.name}`
                  : `用 ${getVirtualSleepDevice(bridgeVirtualMatches[selectedBridge.id])?.name} 体验这条链路`} <ChevronRight />
              </button>
            </article>
          </section>
        )}
      </motion.aside>
    </motion.div>
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
