"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Footprints,
  Gauge,
  House,
  Map,
  Moon,
  PackageOpen,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sunrise,
  Users,
  X,
} from "lucide-react";
import { availableSandboxEndings, findSandboxAction, requirementMet } from "@/src/lib/sandbox/engine";
import type {
  SandboxCampaignContent,
  SandboxExpeditionReport,
  SandboxHandout,
  SandboxLocation,
  SandboxProgress,
  SandboxRisk,
} from "@/src/lib/sandbox/types";
import { getSandboxProgress, useSandboxStore } from "@/src/stores/sandbox-store";
import { elapsedSessionMinutes, formatSleepDuration, nightSealProgress } from "@/src/lib/game-engine/sleep-session";
import type { SleepMode, SleepQuality } from "@/src/lib/game-engine/schema";
import { getCityWatch } from "@/src/content/watches";
import { getAsset } from "@/src/content/assets";
import { CityRoute, qualityCopy } from "./shared";
import { SleepHardwareHandoff, SleepHardwareMorningReceipt, SleepHardwareNightTelemetry, SleepHardwareStatus } from "./sleep-hardware";
import { useI18n } from "@/src/i18n/provider";

type SandboxView = "map" | "evidence" | "people" | "ending";

const subscribeToHydration = () => () => undefined;
const riskLabels: Record<SandboxRisk, string> = {
  quiet: "低暴露",
  exposed: "会引起注意",
  dangerous: "高风险",
  terminal: "不可逆",
};

function formatSandboxDuration(minutes: number, english: boolean): string {
  if (!english) return formatSleepDuration(minutes);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}
export function SandboxCase({
  campaignId,
  content,
  onHome,
  onHardware,
  homeLabel,
}: {
  campaignId: string;
  content: SandboxCampaignContent;
  onHome: () => void;
  onHardware: () => void;
  homeLabel?: string;
}) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const { t } = useI18n();
  const sandboxStore = useSandboxStore();
  const progress = getSandboxProgress(sandboxStore, campaignId, content);
  const [view, setView] = useState<SandboxView>("map");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedHandout, setSelectedHandout] = useState<SandboxHandout | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const presentation = content.presentation;
  const resolvedHomeLabel = homeLabel ?? t("案件书架");
  const ending = content.endings.find((item) => item.id === progress.endingId);

  if (!hydrated) return <main className="sandbox-loading"><span>CASE {presentation.caseNumber}</span><h1>{presentation.loadingTitle}</h1></main>;
  if (!progress.started || !progress.originId) {
    return <OriginBriefing content={content} reducedHorror={progress.reducedHorror} onHome={onHome} homeLabel={resolvedHomeLabel} onToggle={() => sandboxStore.toggleReducedHorror(campaignId, content)} onStart={(originId) => sandboxStore.start(campaignId, content, originId)} />;
  }
  if (progress.phase === "night" && progress.pendingActionId && progress.activeSleepSession) {
    return <SandboxNight content={content} progress={progress} onHome={onHome} onFinish={() => sandboxStore.finishExpedition(campaignId, content)} onHardware={onHardware} />;
  }
  if (progress.phase === "morning" && progress.latestReport) {
    return <SandboxMorning content={content} progress={progress} report={progress.latestReport} onHome={onHome} onArchive={() => sandboxStore.archiveReport(campaignId, content)} onHardware={onHardware} />;
  }
  if (ending && view !== "evidence") {
    return <SandboxEnding content={content} progress={progress} endingId={ending.id} onHome={onHome} homeLabel={resolvedHomeLabel} onReview={() => setView("evidence")} onReset={() => { sandboxStore.reset(campaignId, content); setSelectedLocationId(null); }} />;
  }

  const origin = content.origins.find((item) => item.id === progress.originId)!;
  const corruption = content.corruptionStages[progress.corruption];
  const availableEndings = availableSandboxEndings(content, progress);
  const effectiveLocationId = selectedLocationId ?? progress.unlockedLocationIds[0];
  const selectedLocation = content.locations.find((location) => location.id === effectiveLocationId) ?? null;

  return (
    <div className="sandbox-shell">
      <header className="sandbox-topbar">
        <button type="button" className="sandbox-brand" onClick={onHome}><span aria-hidden="true" /><div><b>{t("夜班侦探")}</b><small>{presentation.caseTypeLabel} · {presentation.caseNumber}</small></div></button>
        <div className="sandbox-case-title"><small>{content.year} · {content.place}</small><b>{content.title}</b></div>
        <button type="button" className="sandbox-brief-button" onClick={() => setShowBriefing(true)}><BookOpen /> {t("委托")}</button>
      </header>

      <section className="sandbox-statusbar">
        <div><Footprints /><span><small>{t("行动记录")}</small><b>{progress.completedActionIds.length}</b></span></div>
        <div className={`corruption-level corruption-${progress.corruption}`}><Sparkles /><span><small>{presentation.conditionLabel} · {corruption.name}</small><b>{progress.corruption} / 7</b></span></div>
        <div className={`threat-level threat-${progress.threat}`}><Gauge /><span><small>{presentation.threatLabel}</small><b>{progress.threat} / 6</b></span></div>
        <button type="button" aria-pressed={progress.reducedHorror} onClick={() => sandboxStore.toggleReducedHorror(campaignId, content)}><ShieldAlert /><span><small>{t("表现强度")}</small><b>{progress.reducedHorror ? t("低刺激") : t("完整")}</b></span></button>
        <SleepHardwareStatus onOpen={onHardware} label={false} />
      </section>

      <main className="sandbox-main">
        {view === "map" && <MapView content={content} progress={progress} selected={selectedLocation} onSelect={(location) => setSelectedLocationId(location.id)} onAction={(actionId) => sandboxStore.selectAction(campaignId, content, actionId)} />}
        {view === "evidence" && <EvidenceView content={content} progress={progress} onHandout={setSelectedHandout} />}
        {view === "people" && <PeopleView content={content} progress={progress} />}
        {view === "ending" && <EndingDesk content={content} progress={progress} onChoose={(endingId) => sandboxStore.chooseEnding(campaignId, content, endingId)} />}
      </main>

      <nav className="sandbox-nav" aria-label={presentation.navigationLabel}>
        <button type="button" className={view === "map" ? "active" : ""} onClick={() => setView("map")}><Map /><span>{t("地点")}</span></button>
        <button type="button" className={view === "evidence" ? "active" : ""} onClick={() => setView("evidence")}><FileText /><span>{t("证物")}</span><i>{progress.clueIds.length}</i></button>
        <button type="button" className={view === "people" ? "active" : ""} onClick={() => setView("people")}><Users /><span>{t("人物")}</span></button>
        <button type="button" className={view === "ending" ? "active" : ""} onClick={() => setView("ending")}><Sparkles /><span>{t("收场")}</span>{availableEndings.length > 0 && <i>{availableEndings.length}</i>}</button>
      </nav>

      {selectedHandout && <HandoutModal content={content} handout={selectedHandout} onClose={() => setSelectedHandout(null)} />}
      {showBriefing && <BriefingModal content={content} originTitle={origin.title} objective={origin.objective} onClose={() => setShowBriefing(false)} onReset={() => setShowReset(true)} />}
      {showReset && <ConfirmReset content={content} onClose={() => setShowReset(false)} onConfirm={() => { sandboxStore.reset(campaignId, content); setSelectedLocationId(null); setShowReset(false); setShowBriefing(false); }} />}
      {view === "map" && progress.pendingActionId && <SandboxHandoff
        content={content}
        progress={progress}
        onClose={() => sandboxStore.clearSelection(campaignId, content)}
        onItem={(itemId) => sandboxStore.selectItem(campaignId, content, itemId)}
        onMode={(mode) => sandboxStore.setSleepMode(campaignId, content, mode)}
        onQuality={(quality) => sandboxStore.setQuality(campaignId, content, quality)}
        onStart={() => sandboxStore.startExpedition(campaignId, content)}
        onHardware={onHardware}
      />}
    </div>
  );
}

function OriginBriefing({
  content,
  reducedHorror,
  onHome,
  homeLabel,
  onToggle,
  onStart,
}: {
  content: SandboxCampaignContent;
  reducedHorror: boolean;
  onHome: () => void;
  homeLabel: string;
  onToggle: () => void;
  onStart: (originId: string) => void;
}) {
  const { t } = useI18n();
  const heroAsset = content.presentation.heroAssetId ? getAsset(content.presentation.heroAssetId) : null;
  return (
    <main className="sandbox-origin">
      <div className="sandbox-origin-backdrop" style={heroAsset ? { backgroundImage: `linear-gradient(90deg, #070a08f2 0 35%, #070a08a8 72%, #070a08e8), url("${heroAsset.src}")` } : undefined} />
      <header><button type="button" onClick={onHome}><ArrowLeft /> {homeLabel}</button><span>{content.presentation.caseNumber} · {content.presentation.caseTypeLabel}</span></header>
      <section className="sandbox-origin-copy">
        <p className="eyebrow">{content.presentation.entryEyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.premise}</p>
        <div className="sandbox-warning"><CircleAlert /><div><b>{t("内容提示")}</b><p>{content.contentWarnings.join(t("、"))}。</p></div><button type="button" aria-pressed={reducedHorror} onClick={onToggle}>{reducedHorror ? t("已启用低刺激表现") : t("切换到低刺激表现")}</button></div>
      </section>
      <section className="origin-cards">
        {content.origins.map((origin, index) => <article key={origin.id}>
          <small>ENTRY {String.fromCharCode(65 + index)} · {origin.subtitle.toUpperCase()}</small>
          <h2>{origin.title}</h2>
          <b>{origin.subtitle}</b>
          <p>{origin.briefing}</p>
          <dl><div><dt>{t("任务")}</dt><dd>{origin.objective}</dd></div><div><dt>{t("入口偏向")}</dt><dd>{origin.trait}</dd></div></dl>
          <button type="button" onClick={() => onStart(origin.id)}>{content.presentation.entryCta} <ChevronRight /></button>
        </article>)}
      </section>
      <footer><span>{content.credits.attribution}</span><span>{content.credits.usage}</span></footer>
    </main>
  );
}

function MapView({
  content,
  progress,
  selected,
  onSelect,
  onAction,
}: {
  content: SandboxCampaignContent;
  progress: SandboxProgress;
  selected: SandboxLocation | null;
  onSelect: (location: SandboxLocation) => void;
  onAction: (actionId: string) => void;
}) {
  const { t } = useI18n();
  const latest = progress.log.at(-1);
  const selectedAsset = selected?.assetId ? getAsset(selected.assetId) : null;
  return (
    <div className="sandbox-map-layout">
      <section className="sandbox-map-panel">
        <div className="sandbox-section-heading"><div><small>FIELD MAP · {progress.unlockedLocationIds.length} / {content.locations.length}</small><h1>{content.presentation.mapTitle}</h1></div><p>{content.presentation.mapDescription}</p></div>
        <div className="sandbox-map" aria-label={content.presentation.mapAriaLabel}>
          <div className="river-line" aria-hidden="true" />
          {content.locations.map((location) => {
            const unlocked = progress.unlockedLocationIds.includes(location.id);
            const visited = progress.visitedLocationIds.includes(location.id);
            return <button type="button" key={location.id} disabled={!unlocked} aria-pressed={selected?.id === location.id} className={`${unlocked ? "unlocked" : "locked"} ${visited ? "visited" : ""}`} style={{ left: `${location.coordinates.x}%`, top: `${location.coordinates.y}%` }} onClick={() => onSelect(location)}><span>{String(location.order).padStart(2, "0")}</span><b>{unlocked ? location.name : t("未显影")}</b></button>;
          })}
          <span className="map-north">N</span>
          <p className="map-caption">{content.presentation.mapCaption}</p>
        </div>
        <div className="location-strip">
          {content.locations.map((location) => {
            const unlocked = progress.unlockedLocationIds.includes(location.id);
            return <button type="button" key={location.id} disabled={!unlocked} className={selected?.id === location.id ? "active" : ""} onClick={() => onSelect(location)}><small>{location.archiveName}</small><b>{unlocked ? location.name : t("尚未显影")}</b></button>;
          })}
        </div>
      </section>
      <aside className="sandbox-location-panel">
        {selected ? <>
          {selectedAsset && <div className="sandbox-location-art"><Image src={selectedAsset.src} alt={selectedAsset.alt} width={1536} height={1024} /></div>}
          <header><small>{selected.archiveName} · {progress.visitedLocationIds.includes(selected.id) ? "VISITED" : "UNVISITED"}</small><h2>{selected.name}</h2><b>{selected.subtitle}</b><p>{selected.atmosphere}</p></header>
          {latest?.locationId === selected.id && <blockquote className="latest-result"><small>{t("最新归档")}</small><b>{latest.title}</b><p>{latest.result}</p>{(latest.corruptionDelta !== 0 || latest.threatDelta !== 0) && <span>{latest.corruptionDelta ? `${content.presentation.conditionLabel} +${latest.corruptionDelta}` : ""}{latest.corruptionDelta && latest.threatDelta ? " · " : ""}{latest.threatDelta ? `${content.presentation.threatLabel} +${latest.threatDelta}` : ""}</span>}</blockquote>}
          <div className="sandbox-action-list">
            {selected.actions.map((action) => {
              const completed = progress.completedActionIds.includes(action.id);
              const allowed = requirementMet(progress, action.requires);
              const selectedAction = progress.pendingActionId === action.id;
              return <article className={`${completed ? "completed" : ""} ${selectedAction ? "selected" : ""} risk-${action.risk}`} key={action.id}>
                <div><span>{t(riskLabels[action.risk])}</span>{completed && <i><Check /> {t("已归档")}</i>}</div>
                <h3>{action.title}</h3><p>{action.intent}</p>
                {!allowed && action.requirementHint && <small>{action.requirementHint}</small>}
                {completed ? <details><summary>{t("重看结果")}</summary><p>{progress.log.find((entry) => entry.actionId === action.id)?.result}</p></details> : <button type="button" aria-pressed={selectedAction} disabled={!allowed} onClick={() => onAction(action.id)}>{allowed ? (selectedAction ? t("已写入今晚交接单") : t("安排今晚调查")) : t("条件尚未满足")} <ChevronRight /></button>}
              </article>;
            })}
          </div>
        </> : <div className="sandbox-empty-panel"><Map /><h2>{t("选择一个已显影地点")}</h2><p>{t("线索会打开新的道路；不必按编号前进。")}</p></div>}
      </aside>
    </div>
  );
}

function SandboxHandoff({
  content,
  progress,
  onClose,
  onItem,
  onMode,
  onQuality,
  onStart,
  onHardware,
}: {
  content: SandboxCampaignContent;
  progress: SandboxProgress;
  onClose: () => void;
  onItem: (itemId?: string) => void;
  onMode: (mode: SleepMode) => void;
  onQuality: (quality: SleepQuality) => void;
  onStart: () => void;
  onHardware: () => void;
}) {
  const { t } = useI18n();
  const found = progress.pendingActionId ? findSandboxAction(content, progress.pendingActionId) : undefined;
  if (!found) return null;
  const location = content.locations.find((item) => item.id === found.locationId)!;
  const items = content.items.filter((item) => progress.itemIds.includes(item.id));
  return (
    <div className="sandbox-handoff-scrim" role="presentation" onClick={onClose}>
      <section className="sandbox-handoff" role="dialog" aria-modal="true" aria-labelledby="sandbox-handoff-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="sandbox-handoff-close" aria-label={t("关闭交接单")} onClick={onClose}><X /></button>
        <header>
          <small>TONIGHT&apos;S HANDOFF · {t("延迟探索")}</small>
          <h2 id="sandbox-handoff-title">{t("把这一程交给夜班。")}</h2>
          <p>{t("你现在负责方向与准备。出发后，调查队会在你离开页面或休息时继续前往。")}</p>
        </header>
        <article className={`handoff-action risk-${found.action.risk}`}>
          <span>{location.archiveName} · {t(riskLabels[found.action.risk])}</span>
          <h3>{found.action.title}</h3>
          <b>{location.name}</b>
          <p>{found.action.intent}</p>
        </article>
        <section className="handoff-items">
          <div><small>PACK ONE THING</small><h3>{t("随队带上一件")}</h3></div>
          <div>
            {items.map((item) => <button type="button" aria-pressed={progress.selectedItemId === item.id} key={item.id} onClick={() => onItem(item.id)}><PackageOpen /><span><b>{item.name}</b><small>{item.description}</small></span></button>)}
          </div>
        </section>
        <section className="handoff-timing">
          <div>
            <small>NIGHT MODE</small>
            <div className="handoff-mode" role="group" aria-label={content.presentation.handoffModeLabel}>
              <button type="button" aria-pressed={progress.sleepMode === "demo"} onClick={() => onMode("demo")}>{t("12 秒演示")}</button>
              <button type="button" aria-pressed={progress.sleepMode === "real"} onClick={() => onMode("real")}>{t("真实夜班")}</button>
            </div>
          </div>
          <div>
            <small>{progress.sleepMode === "demo" ? "DEMO JOURNEY" : "REAL RETURN"}</small>
            {progress.sleepMode === "demo" ? <div className="handoff-quality">
              {(["interrupted", "regular", "restful"] as const).map((quality) => <button type="button" aria-pressed={progress.selectedQuality === quality} key={quality} onClick={() => onQuality(quality)}><b>{t(qualityCopy[quality].label)}</b><span>{t(qualityCopy[quality].note)}</span></button>)}
            </div> : <p className="real-night-note">{t("真实夜班按你回来时的经过时间生成断续、普通或安稳记录；任何时长都会得到同一组关键事实。")}</p>}
          </div>
        </section>
        <SleepHardwareHandoff onOpen={onHardware} dark />
        <footer>
          <p><Moon /> {content.presentation.sleepEthic}</p>
          <button type="button" onClick={onStart}>{t("今晚交给调查队")} <ArrowRight /></button>
        </footer>
      </section>
    </div>
  );
}

function SandboxNight({
  content,
  progress,
  onHome,
  onFinish,
  onHardware,
}: {
  content: SandboxCampaignContent;
  progress: SandboxProgress;
  onHome: () => void;
  onFinish: () => void;
  onHardware: () => void;
}) {
  const { locale, t } = useI18n();
  const session = progress.activeSleepSession!;
  const found = findSandboxAction(content, progress.pendingActionId!)!;
  const location = content.locations.find((item) => item.id === found.locationId)!;
  const carriedItem = content.items.find((item) => item.id === progress.selectedItemId);
  const [seconds, setSeconds] = useState(12);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (session.mode === "demo") setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(onFinish, 350);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onFinish, session.mode]);
  const elapsedMinutes = elapsedSessionMinutes(session, new Date(now));
  const expeditionProgress = session.mode === "demo" ? ((12 - seconds) / 12) * 100 : nightSealProgress(session, new Date(now));
  const watch = getCityWatch(session.watchId);
  const routeNodes = [t("临时营地"), location.name, found.action.title, t("晨报桌")];
  const mapVariants = ["river", "market", "heights"] as const;
  const mapVariant = mapVariants[(location.order - 1) % mapVariants.length];
  const events = [
    found.action.scene,
    location.atmosphere,
    `${t("调查意图")}：${found.action.intent}`,
    carriedItem ? `${carriedItem.name}${t("被放在随手可取的位置。")}` : t("队伍只带着最基本的照明离开营地。"),
    content.presentation.nightClosingLine,
  ];
  const visibleEvents = Math.max(1, Math.min(events.length, Math.ceil(expeditionProgress / 20)));
  return (
    <main className="sandbox-night">
      <div className="sandbox-night-stars" />
      <header>
        <button type="button" className="sandbox-night-brand" onClick={onHome}><span aria-hidden="true" /><div><b>{content.presentation.nightTitle}</b><small>{session.mode === "demo" ? t(qualityCopy[session.quality].time) : t("真实夜班")}</small></div></button>
        <button type="button" className="sandbox-wake-button" onClick={onFinish}>{session.mode === "demo" ? t("跳到清晨") : t("我回来了，拆开晨报")} <ArrowRight /></button>
      </header>
      <section className="sandbox-night-heading">
        <p>{session.mode === "demo" ? t("你离开以后，调查仍在继续。") : t("合上页面也没关系。交接时间已经写进存档。")}</p>
        <h1>{found.action.title}</h1>
        <span>{location.name} · {t(riskLabels[found.action.risk])}</span>
      </section>
      <aside className="sandbox-watch-card">
        <Clock3 /><div><small>{t(watch.archiveLabel)} · {watch.window}</small><b>{t(watch.label)}</b><p>{t(watch.description)}</p></div>
      </aside>
      <SleepHardwareNightTelemetry session={session} progress={expeditionProgress} onOpen={onHardware} dark />
      <section className="sandbox-night-route">
        <CityRoute progress={expeditionProgress} routeNodes={routeNodes} variant={mapVariant} />
        <aside>
          <small>FIELD ORDER · {Math.round(expeditionProgress)}%</small>
          <h2>{location.archiveName}</h2>
          <b>{carriedItem?.name ?? t("基础照明与空白笔记")}</b>
          <p>{session.mode === "demo" ? `${t("夜印正在形成")} · ${seconds} ${t("秒")}` : `${t("已调查")} ${formatSandboxDuration(elapsedMinutes, locale === "en")}`}</p>
        </aside>
      </section>
      <section className="sandbox-night-events" aria-live="polite">
        {events.slice(0, visibleEvents).map((event, index) => <p className={index === visibleEvents - 1 ? "current" : ""} key={event}><i />{event}</p>)}
      </section>
      <div className="sandbox-night-progress"><span style={{ width: `${expeditionProgress}%` }} /></div>
    </main>
  );
}

function SandboxMorning({
  content,
  progress,
  report,
  onHome,
  onArchive,
  onHardware,
}: {
  content: SandboxCampaignContent;
  progress: SandboxProgress;
  report: SandboxExpeditionReport;
  onHome: () => void;
  onArchive: () => void;
  onHardware: () => void;
}) {
  const { locale, t } = useI18n();
  const found = findSandboxAction(content, report.actionId)!;
  const location = content.locations.find((item) => item.id === report.locationId)!;
  const entry = progress.log.find((item) => item.id === report.entryId)!;
  const watch = getCityWatch(report.session.watchId);
  const carriedItem = content.items.find((item) => item.id === report.carriedItemId);
  const newClues = content.clues.filter((item) => report.clueIds.includes(item.id));
  const newHandouts = content.handouts.filter((item) => report.handoutIds.includes(item.id));
  const newItems = content.items.filter((item) => report.itemIds.includes(item.id));
  const newLocations = content.locations.filter((item) => report.unlockedLocationIds.includes(item.id));
  return (
    <main className="sandbox-morning">
      <header>
        <button type="button" onClick={onHome}><span aria-hidden="true" /><div><b>{content.presentation.morningTitle}</b><small>DELAYED EXPEDITION RETURN</small></div></button>
        <div><Sunrise /><span><small>{t(watch.label)} {t("交接")}</small><b>{report.session.mode === "demo" ? t("演示夜班") : formatSandboxDuration(report.session.durationMinutes ?? 0, locale === "en")}</b></span></div>
      </header>
      <section className="sandbox-morning-hero">
        <small>MORNING REPORT · {location.archiveName}</small>
        <p>{t("昨夜调查完成")}</p>
        <h1>{found.action.title}</h1>
        <span>{location.name} · {t(qualityCopy[report.session.quality].label)}</span>
      </section>
      <section className="sandbox-report-grid">
        <article className="sandbox-report-result">
          <small>FIELD NOTES · {t("确定性结算")}</small>
          <h2>{entry.title}</h2>
          <blockquote>{entry.result}</blockquote>
          <dl>
            <div><dt>{t("携带物")}</dt><dd>{carriedItem?.name ?? t("基础装备")}</dd></div>
            <div><dt>{content.presentation.conditionLabel}{t("变化")}</dt><dd>{report.corruptionDelta ? `+${report.corruptionDelta}` : t("无")}</dd></div>
            <div><dt>{content.presentation.threatLabel}{t("变化")}</dt><dd>{report.threatDelta ? `+${report.threatDelta}` : t("无")}</dd></div>
            <div><dt>{t("夜班记录")}</dt><dd>{formatSandboxDuration(report.session.durationMinutes ?? 0, locale === "en")}</dd></div>
          </dl>
        </article>
        <article className="sandbox-report-effects">
          <small>RETURNED WITH · {t("带回卷宗")}</small>
          <h2>{t("清晨桌上的新东西")}</h2>
          {newClues.map((clue) => <div key={clue.id}><FileText /><span><b>{clue.title}</b><p>{clue.summary}</p></span></div>)}
          {newHandouts.map((handout) => <div key={handout.id}><BookOpen /><span><b>{t("展示材料")} {String(handout.number).padStart(2, "0")} · {handout.title}</b><p>{handout.source}</p></span></div>)}
          {newItems.map((item) => <div key={item.id}><PackageOpen /><span><b>{item.name}</b><p>{item.description}</p></span></div>)}
          {newLocations.map((item) => <div key={item.id}><Map /><span><b>{t("地图显影")} · {item.name}</b><p>{item.subtitle}</p></span></div>)}
          {report.npcEffects.map((effect) => {
            const npc = content.npcs.find((item) => item.id === effect.npcId)!;
            return <div key={effect.npcId}><Users /><span><b>{npc.name} · {content.presentation.npcStateLabels[effect.state]}</b><p>{npc.role}</p></span></div>;
          })}
          {newClues.length + newHandouts.length + newItems.length + newLocations.length + report.npcEffects.length === 0 && <p className="no-new-evidence">{content.presentation.noNewEvidence}</p>}
        </article>
      </section>
      <div className="sandbox-sleep-receipt"><SleepHardwareMorningReceipt sessionId={report.session.id} /><button type="button" onClick={onHardware}>{t("管理睡眠硬件")} <ChevronRight /></button></div>
      <section className="sandbox-report-ethic">
        <Moon /><p>{content.presentation.sleepEthic}</p>
      </section>
      <button type="button" className="sandbox-archive-report" onClick={onArchive}>{t("归档晨报，准备下一夜")} <ArrowRight /></button>
    </main>
  );
}

function EvidenceView({ content, progress, onHandout }: { content: SandboxCampaignContent; progress: SandboxProgress; onHandout: (handout: SandboxHandout) => void }) {
  const { t } = useI18n();
  const unlockedClues = content.clues.filter((clue) => progress.clueIds.includes(clue.id));
  const handouts = content.handouts.filter((handout) => progress.handoutIds.includes(handout.id));
  const items = content.items.filter((item) => progress.itemIds.includes(item.id));
  return (
    <div className="sandbox-document-page">
      <div className="sandbox-section-heading"><div><small>EVIDENCE DESK · {unlockedClues.length} / {content.clues.length}</small><h1>{t("证物与展示材料")}</h1></div><p>{t("关键事实拥有多条获取路径；一次错过不会锁死卷宗。")}</p></div>
      <section className="sandbox-handout-shelf">
        <h2>{t("展示材料")} <span>{handouts.length} / {content.handouts.length}</span></h2>
        <div>{content.handouts.map((handout) => {
          const unlocked = progress.handoutIds.includes(handout.id);
          return <button type="button" key={handout.id} disabled={!unlocked} onClick={() => onHandout(handout)}><small>HANDOUT {String(handout.number).padStart(2, "0")}</small><b>{unlocked ? handout.title : t("封存材料")}</b><p>{unlocked ? handout.source : t("在对应地点找到后可阅读")}</p></button>;
        })}</div>
      </section>
      <section className="sandbox-clue-grid">
        {unlockedClues.map((clue) => <article key={clue.id}><small>{clue.category}</small><h3>{clue.title}</h3><b>{clue.summary}</b><p>{clue.detail}</p><div>{clue.relatedIds.filter((id) => progress.clueIds.includes(id)).map((id) => <span key={id}>{content.clues.find((item) => item.id === id)?.title}</span>)}</div></article>)}
      </section>
      <section className="sandbox-inventory"><h2>{t("随队物品")}</h2><div>{items.map((item) => <article key={item.id}><b>{item.name}</b><p>{item.description}</p></article>)}</div></section>
    </div>
  );
}

function PeopleView({ content, progress }: { content: SandboxCampaignContent; progress: SandboxProgress }) {
  const { t } = useI18n();
  const origin = content.origins.find((item) => item.id === progress.originId)!;
  const corruption = content.corruptionStages[progress.corruption];
  return (
    <div className="sandbox-document-page">
      <div className="sandbox-section-heading"><div><small>PEOPLE & CONDITION</small><h1>{t("人物与队伍状态")}</h1></div><p>{origin.title} · {origin.trait}</p></div>
      <section className="corruption-ledger">
        <header><div><small>CURRENT EXPOSURE · {progress.corruption}/7</small><h2>{corruption.name}</h2></div><span>{progress.reducedHorror ? t("低刺激表现已启用") : t("完整恐怖表现")}</span></header>
        <div>{content.corruptionStages.map((stage) => <article className={`${stage.stage <= progress.corruption ? "reached" : ""} ${stage.stage === progress.corruption ? "current" : ""}`} key={stage.stage}><span>{stage.stage}</span><div><b>{stage.name}</b><p>{stage.stage <= progress.corruption ? stage.benefit : t("尚未抵达")}</p><small>{stage.stage <= progress.corruption ? stage.cost : content.presentation.conditionAdvanceHint}</small></div></article>)}</div>
      </section>
      <section className="npc-ledger">
        {content.npcs.map((npc) => {
          const state = progress.npcStates[npc.id] ?? "unknown";
          const portrait = npc.assetId ? getAsset(npc.assetId) : null;
          return <article className={`npc-${state}`} key={npc.id}>{portrait && <Image className="npc-ledger-portrait" src={portrait.src} alt={portrait.alt} width={1024} height={1280} />}<div><small>{npc.faction}</small><span>{content.presentation.npcStateLabels[state]}</span></div><h3>{npc.name}</h3><b>{npc.role}</b><p>{state === "unknown" ? npc.publicFace : npc.privateDrive}</p></article>;
        })}
      </section>
    </div>
  );
}

function EndingDesk({ content, progress, onChoose }: { content: SandboxCampaignContent; progress: SandboxProgress; onChoose: (endingId: string) => void }) {
  const { t } = useI18n();
  const available = availableSandboxEndings(content, progress);
  return (
    <div className="sandbox-document-page ending-desk">
      <div className="sandbox-section-heading"><div><small>CLOSING ROUTES · {available.length} AVAILABLE</small><h1>{t("给故事一个收场")}</h1></div><p>{t("卷宗只展示你真正抵达的选择；每种答案都有自己的代价。")}</p></div>
      {available.length === 0 ? <section className="no-ending-yet"><CircleAlert /><h2>{content.presentation.noEndingTitle}</h2><p>{content.presentation.noEndingDescription}</p></section> : <section className="sandbox-ending-grid">{available.map((ending) => <article className={ending.terminal ? "terminal" : ""} key={ending.id}><small>{ending.archiveLabel}</small><h2>{ending.title}</h2><b>{ending.theme}</b><p>{ending.result}</p><button type="button" onClick={() => onChoose(ending.id)}>{t("以此收场")} <ChevronRight /></button></article>)}</section>}
      <section className="ending-readiness">
        <h2>{t("尚未归档的收场")}</h2>
        <div>{content.endings.filter((ending) => !available.some((item) => item.id === ending.id)).map((ending) => <article key={ending.id}><b>{ending.title}</b><span>{t("条件尚未满足")}</span><p>{ending.theme}</p></article>)}</div>
      </section>
    </div>
  );
}

function HandoutModal({ content, handout, onClose }: { content: SandboxCampaignContent; handout: SandboxHandout; onClose: () => void }) {
  return <div className="sandbox-modal-scrim" role="presentation" onClick={onClose}><article className="handout-modal" role="dialog" aria-modal="true" aria-label={handout.title} onClick={(event) => event.stopPropagation()}><button type="button" onClick={onClose}><X /></button><small>{content.presentation.handoutKicker} · HANDOUT {String(handout.number).padStart(2, "0")}</small><h2>{handout.title}</h2><b>{handout.source}</b><p className="handout-summary">{handout.summary}</p>{handout.archiveText.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<footer>{content.presentation.handoutFooter}</footer></article></div>;
}

function BriefingModal({ content, originTitle, objective, onClose, onReset }: { content: SandboxCampaignContent; originTitle: string; objective: string; onClose: () => void; onReset: () => void }) {
  const { t } = useI18n();
  return <div className="sandbox-modal-scrim" role="presentation" onClick={onClose}><article className="briefing-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={onClose}><X /></button><small>ACTIVE BRIEFING</small><h2>{originTitle}</h2><p>{objective}</p><hr /><h3>{content.presentation.briefingHeading}</h3><p>{content.credits.adaptation}</p><p>{content.credits.notice}</p><p><b>{content.credits.usage}</b></p><button type="button" className="reset-case-button" onClick={onReset}><RotateCcw /> {t("重新开始这条故事线")}</button></article></div>;
}

function ConfirmReset({ content, onClose, onConfirm }: { content: SandboxCampaignContent; onClose: () => void; onConfirm: () => void }) {
  const { t } = useI18n();
  return <div className="sandbox-modal-scrim high" role="presentation" onClick={onClose}><article className="confirm-reset" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><CircleAlert /><h2>{content.presentation.resetTitle}</h2><p>{content.presentation.resetDescription}</p><div><button type="button" onClick={onClose}>{t("保留存档")}</button><button type="button" onClick={onConfirm}>{t("确认重新开始")}</button></div></article></div>;
}

function SandboxEnding({ content, progress, endingId, onHome, homeLabel, onReview, onReset }: { content: SandboxCampaignContent; progress: SandboxProgress; endingId: string; onHome: () => void; homeLabel: string; onReview: () => void; onReset: () => void }) {
  const { t } = useI18n();
  const ending = content.endings.find((item) => item.id === endingId)!;
  const rescued = Object.values(progress.npcStates).filter((state) => state === "rescued").length;
  const heroAsset = content.presentation.heroAssetId ? getAsset(content.presentation.heroAssetId) : null;
  const background = heroAsset ? { backgroundImage: `linear-gradient(145deg, #111710f2, #060906e8 70%), url("${heroAsset.src}")` } : undefined;
  return <main className="sandbox-ending-reveal" style={background}><div className="ending-pulse" /><header><span>CASE {content.presentation.caseNumber} · {ending.archiveLabel}</span><button type="button" onClick={onHome}><House /> {homeLabel}</button></header><section><small>{content.year} · {content.presentation.endingEyebrow}</small><h1>{ending.title}</h1><b>{ending.theme}</b><p>{ending.result}</p><blockquote>{ending.coda}</blockquote><dl><div><dt>{t("调查行动")}</dt><dd>{progress.completedActionIds.length}</dd></div><div><dt>{t("带回线索")}</dt><dd>{progress.clueIds.length} / {content.clues.length}</dd></div><div><dt>{content.presentation.conditionLabel}{t("阶段")}</dt><dd>{progress.corruption} / 7</dd></div><div><dt>{t("救出人物")}</dt><dd>{rescued}</dd></div></dl><div className="ending-actions"><button type="button" onClick={onReview}><FileText /> {t("重看证物")}</button><button type="button" onClick={onReset}><RotateCcw /> {t("重新调查")}</button></div></section><footer><span>{content.credits.attribution}</span><span>{content.credits.usage}</span></footer></main>;
}
