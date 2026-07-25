"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Check, ChevronRight, Clock3, Coffee, Ear, FileText, Lightbulb, Moon, PenLine, Radio, Sparkles, Zap } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { growthStageFromProgress } from "@/src/content/botany";
import { getPreparation, preparations, type PreparationId } from "@/src/content/preparations";
import { getCitySociety, getSocietyLetter, getSocietyTitle } from "@/src/content/societies";
import { getCorrespondencePrompt, getCorrespondenceReply, getLatestSocietyReply } from "@/src/content/correspondence";
import { getSouvenir } from "@/src/content/souvenirs";
import { getOpportunityCandidates, getOpportunityNotice, getOpportunityResponse } from "@/src/content/opportunities";
import { DEMO_CITY_WATCH_ID, getCityWatch, getCityWatchId } from "@/src/content/watches";
import { getCampaignBotanical, getCampaignNightSealAssetId, getCampaignPostcard, getCampaignRouteDirection, getCampaignWakeEchoById, getCampaignWatchEcho } from "@/src/content/campaigns/types";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import type { SleepMode, SleepQuality, WakeEcho } from "@/src/lib/game-engine/schema";
import { elapsedSessionMinutes, formatSleepDuration, nightSealProgress } from "@/src/lib/game-engine/sleep-session";
import { useGameStore } from "@/src/stores/game-store";
import { getReadyEvidenceSyntheses } from "@/src/lib/game-engine/evidence-synthesis";
import { BotanicalSpecimen, CityRoute, PaperCard, qualityCopy, Seal, SocietyCrest } from "./shared";
import { NightDiorama } from "./night-diorama";
import type { GameView } from "./types";
import { SleepHardwareHandoff, SleepHardwareMorningReceipt, SleepHardwareNightTelemetry } from "./sleep-hardware";
import { REST_INTENTION_MAX_LENGTH, restReflectionResponseSchema, type RestRitualInput } from "@/src/lib/rest-ritual";
import { useI18n } from "@/src/i18n/provider";

const pendingRestReflectionRequests = new Set<string>();

export function Tonight({ onLaunch, onHardware }: { onLaunch: (quality: SleepQuality, preparationId: PreparationId, mode: SleepMode, restRitual?: RestRitualInput) => void; onHardware: () => void }) {
  const { chapter, selectedChoice, selectChoice, phase } = useGameStore();
  const { campaign, localize, locale, t } = useI18n();
  const current = campaign.case.chapters.find((item) => item.number === chapter)!;
  const [quality, setQuality] = useState<SleepQuality>("regular");
  const [preparationId, setPreparationId] = useState<PreparationId>("side-lamp");
  const [sleepMode, setSleepMode] = useState<SleepMode>("demo");
  const [restIntention, setRestIntention] = useState("");
  const [aiRequested, setAiRequested] = useState(false);
  const [aiAccessOpen, setAiAccessOpen] = useState(false);
  const [aiAccessCode, setAiAccessCode] = useState("");
  const [aiAccessMessage, setAiAccessMessage] = useState("");
  const [aiAccessChecking, setAiAccessChecking] = useState(false);
  const selectedDirection = selectedChoice ? getCampaignRouteDirection(campaign, chapter, selectedChoice) : null;
  const selectedPreparation = localize(getPreparation(preparationId));
  const handoffPortrait = getAsset("character.lin-du-handoff");
  const previewWatch = localize(getCityWatch(sleepMode === "demo" ? DEMO_CITY_WATCH_ID : getCityWatchId(new Date())));
  const toggleAiRequest = async () => {
    if (aiRequested) {
      setAiRequested(false);
      return;
    }
    setAiAccessChecking(true);
    try {
      const response = await fetch("/api/rest-reflection/access");
      const access = await response.json() as { configured?: boolean; authorized?: boolean };
      if (access.authorized) {
        setAiRequested(true);
        setAiAccessOpen(false);
        setAiAccessMessage("");
      } else {
        setAiAccessOpen(true);
        setAiAccessMessage(access.configured ? t("输入主办方或部署者提供的访问码。") : t("当前部署未配置 AI，仍可使用仅本机回信。"));
      }
    } catch {
      setAiAccessOpen(true);
      setAiAccessMessage(t("暂时无法确认 AI 访问权限，仍可使用仅本机回信。"));
    } finally {
      setAiAccessChecking(false);
    }
  };
  const unlockAiRequest = async () => {
    if (!aiAccessCode.trim()) return;
    setAiAccessChecking(true);
    try {
      const response = await fetch("/api/rest-reflection/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: aiAccessCode }) });
      const access = await response.json() as { configured?: boolean; authorized?: boolean };
      if (response.ok && access.authorized) {
        setAiRequested(true);
        setAiAccessOpen(false);
        setAiAccessCode("");
        setAiAccessMessage("");
      } else {
        setAiAccessMessage(access.configured ? t("访问码不正确；纸条尚未发送。") : t("当前部署未配置 AI，仍可使用仅本机回信。"));
      }
    } catch {
      setAiAccessMessage(t("无法验证访问码；纸条尚未发送。"));
    } finally {
      setAiAccessChecking(false);
    }
  };
  return (
    <div className="content-grid tonight-page">
      <section className={selectedDirection ? "desk-scene handoff-ready" : "desk-scene"}>
        <div className="scene-copy"><p className="eyebrow"><Clock3 size={14} /> {t("今晚的任务 · 23:40 前交接")}</p><h2 className={locale === "en" ? "scene-title scene-title-en" : "scene-title"}>{locale === "en" ? <><span>Lin Du is arranging</span><span>tonight&apos;s equipment.</span></> : <><span>林渡正在整理</span><span>今晚的装备。</span></>}</h2><p>{locale === "en" ? <>Choose an investigative direction.<br />However you sleep tonight, the story will continue.</> : <>选择一个调查方向。<br />无论你今晚睡得如何，故事都会继续。</>}</p></div>
        <div className="handoff-stack">
        <motion.figure className="handoff-portrait" initial={{ opacity: 0, y: 12, rotate: 1.4 }} animate={{ opacity: 1, y: 0, rotate: selectedDirection ? .35 : 1.15 }} transition={{ duration: .7, ease: "easeOut" }}>
          <div className="handoff-portrait-image"><Image src={handoffPortrait.src} alt={handoffPortrait.alt} fill preload sizes="(max-width: 600px) 44vw, (max-width: 900px) 34vw, 24vw" /></div>
          <figcaption><small>LIN DU · NIGHT DETECTIVE</small><b>{campaign.presentation.detectiveName}</b><span>{selectedDirection ? t("已收到今晚的方向") : t("在等你写下方向")}</span></figcaption>
        </motion.figure>
        <aside className="handoff-docket" aria-live="polite"><small>TONIGHT&apos;S HANDOFF · {t("今晚交接单")}</small><b>{selectedDirection?.dispatchTitle ?? t("方向尚未落笔")}</b><span>{selectedDirection ? `${selectedPreparation?.shortTitle ?? t("随身物")} · ${selectedDirection.destination}` : t("从右侧选择一条调查方向；林渡会负责怎样抵达。")}</span></aside>
        </div>
      </section>
      <section className="plan-panel">
        <div className="plan-panel-scroll">
        {chapter > 1 && <DaytimeNotices />}
        <section className="tonight-step">
        <div className="tonight-step-head"><span>01</span><div><small>{locale === "en" ? `NIGHT ${chapter}` : `夜 ${chapter}`} · {current.title}</small><b>{t("选择调查方向")}</b></div><em className="tonight-step-required">{t("必选")}</em></div>
        <h3>{current.question}</h3>
        <p className="city-aside">“{current.cityAside}”</p>
        <div className="choice-list">{current.choices.map((choice, i) => { const direction = getCampaignRouteDirection(campaign, chapter, choice.id); const society = localize(getCitySociety(direction.societyId)); return <button type="button" aria-pressed={selectedChoice === choice.id} key={choice.id} className={selectedChoice === choice.id ? "choice selected" : "choice"} onClick={() => selectChoice(choice.id)}><span>0{i + 1}</span><div><b>{choice.label}</b><small>{choice.note}</small><em>{t("可能惊动")} · {society.name}</em></div>{selectedChoice === choice.id ? <Check /> : <ChevronRight />}</button>; })}</div>
        </section>
        <section className="tonight-step">
        <div className="tonight-step-head"><span>02</span><div><small>PACK ONE THING · {t("随身物")}</small><b>{t("准备，然后放手")}</b></div></div>
        <div className="preparation-list">{preparations.map((source) => { const item = localize(source); return <button type="button" aria-pressed={preparationId === item.id} key={item.id} className={preparationId === item.id ? "preparation selected" : "preparation"} onClick={() => setPreparationId(item.id)}><span><Image src={item.imageSrc} alt={item.imageAlt} width={80} height={80} sizes="80px" /></span><div><b>{item.title}</b><small>{item.promise}</small></div>{preparationId === item.id && <Check size={15} />}</button>; })}</div>
        </section>
        <section className="tonight-step">
          <div className="tonight-step-head"><span>03</span><div><small>NIGHT HANDOFF · {t("交接方式")}</small><b>{t("选择交接方式")}</b></div></div>
          <div className="mode-toggle" role="group" aria-label={t("夜班模式")}>
            <button type="button" aria-pressed={sleepMode === "demo"} className={sleepMode === "demo" ? "active" : ""} onClick={() => setSleepMode("demo")}><Zap size={14} /> {t("演示旅程")}</button>
            <button type="button" aria-pressed={sleepMode === "real"} className={sleepMode === "real" ? "active" : ""} onClick={() => setSleepMode("real")}><Moon size={14} /> {t("今夜真实交接")}</button>
          </div>
          {sleepMode === "demo" ? <div className="quality-tabs">{(Object.keys(qualityCopy) as SleepQuality[]).map((id) => <button type="button" aria-pressed={quality === id} key={id} className={quality === id ? "active" : ""} onClick={() => setQuality(id)} title={t(qualityCopy[id].note)}>{t(qualityCopy[id].label)}</button>)}</div> : <p className="real-mode-note">{t("从交接那一刻起计时。你可以锁屏、关闭页面，醒来后再回来拆晨报；提前醒来也不会失去主线线索。")}</p>}
          <div className={`watch-preview watch-${previewWatch.id}`}><Clock3 /><div><small>{sleepMode === "demo" ? "DEMO FIXED WATCH" : "LOCAL HANDOFF WATCH"}</small><b>{previewWatch.label} · {previewWatch.window}</b><span>{previewWatch.description}</span></div></div>
        </section>
        <div className="tonight-optional-divider"><span>{t("以下可选 · 不影响线索或评分")}</span></div>
        <details className="tonight-optional">
          <summary><span><small>LEAVE IT FOR THE NIGHT · {t("休息仪式")}</small><b>{t("今晚，先放下一件事")}</b><p>{t("写一张短笺；不参与睡眠评分、案件结算或奖励。")}</p></span><ChevronRight /></summary>
        <section className="rest-intention-box" aria-labelledby="rest-intention-title">
          <div className="rest-intention-heading"><PenLine /><div><small>LEAVE IT FOR THE NIGHT · {t("可选休息仪式")}</small><b id="rest-intention-title">{t("今晚，有什么可以先不解决？")}</b></div></div>
          <p>{t("写下一件想暂时放下的事。它不参与睡眠评分、案件结算或奖励，清晨只会换回一张短笺。")}</p>
          <label htmlFor="rest-intention">{t("放下纸条")}</label>
          <textarea id="rest-intention" value={restIntention} maxLength={REST_INTENTION_MAX_LENGTH} onChange={(event) => { setRestIntention(event.target.value); if (!event.target.value.trim()) { setAiRequested(false); setAiAccessOpen(false); } }} placeholder={t("例如：明天的演示还没准备完，但今晚先到这里。")} />
          <div className="rest-intention-meta"><span>{restIntention.length}/{REST_INTENTION_MAX_LENGTH}</span><small>{t("默认仅保存在这台设备")}</small></div>
          <button type="button" className={aiRequested ? "ai-consent selected" : "ai-consent"} aria-pressed={aiRequested} disabled={!restIntention.trim() || aiAccessChecking} onClick={() => void toggleAiRequest()}><span>{aiRequested ? <Check /> : <Sparkles />}</span><div><b>{aiAccessChecking ? t("正在确认 AI 访问权限") : t("请 AI 替林渡选择晨间短笺风格")}</b><small>{t("仅发送本夜纸条，以及案件／章节标题、地点、方向、随身物和侦探名；AI 只选择受限风格，短笺由安全模板组成。需要部署者访问码。")}</small></div></button>
          {aiAccessOpen && <div className="ai-access-gate"><label htmlFor="ai-access-code">{t("AI 访问码")}</label><div><input id="ai-access-code" type="password" autoComplete="off" value={aiAccessCode} maxLength={128} onChange={(event) => setAiAccessCode(event.target.value)} placeholder={t("由部署者提供")} /><button type="button" disabled={!aiAccessCode.trim() || aiAccessChecking} onClick={() => void unlockAiRequest()}>{t("验证并启用")}</button></div><p role="status">{aiAccessMessage}</p></div>}
        </section>
        </details>
        <SleepHardwareHandoff onOpen={onHardware} />
        </div>
  <button type="button" disabled={!selectedChoice || phase !== "ready"} className="handoff-button" onClick={() => onLaunch(quality, preparationId, sleepMode, restIntention.trim() ? { intention: restIntention, aiRequested, locale } : undefined)}>{!selectedChoice ? t("先选择一个调查方向") : sleepMode === "real" ? t("开始今夜的真实交接") : t("今晚交给你了")} <Moon size={18} /></button>
      </section>
    </div>
  );
}

function DaytimeNotices() {
  const { chapter, journeySeed, opportunityHistory, resolveOpportunity, dismissOpportunities } = useGameStore();
  const { localize, t } = useI18n();
  const record = opportunityHistory[chapter];
  const notices = localize(record ? record.offeredIds.map(getOpportunityNotice) : getOpportunityCandidates(chapter, journeySeed, opportunityHistory));
  const chosenNotice = record?.noticeId ? localize(getOpportunityNotice(record.noticeId)) : null;
  const chosenResponse = record ? localize(getOpportunityResponse(record)) : null;

  if (record) return <aside className="daytime-notices resolved" aria-label={t("今日机会告示已归档")}><div><small>UNDER THE DOOR · {t("午后短章")}</small><b>{record.dismissed ? t("三张纸已经收进抽屉") : chosenNotice?.title}</b></div><p>{record.dismissed ? t("没有答复也没有损失。城市会把未拆的纸留在这一天。") : chosenResponse?.result}</p>{chosenResponse && <span>{t("选择已保存；它可能在今后的晨报里留下轻微回声。")}</span>}</aside>;

  return <aside className="daytime-notices" aria-label={t("门缝下的三张机会告示")}><div className="daytime-notices-heading"><div><small>THREE PAPERS UNDER THE DOOR</small><b>{t("门缝下的三张纸")}</b></div><button onClick={dismissOpportunities}>{t("全部收起，不拆")}</button></div><p>{t("任选一张回应，也可以全部收起。没有行动点、奖励差或正确答案，不影响今晚的调查。")}</p><div className="daytime-notice-list">{notices.map((notice) => <details key={notice.id}><summary><span>{notice.location}</span><b>{notice.title}</b><small>{notice.hook}</small></summary><div><p>{notice.detail}</p><small>— {notice.sender}</small><div>{notice.responses.map((response) => <button key={response.id} onClick={() => resolveOpportunity(notice.id, response.id)}><b>{response.label}</b><span>{response.note}</span></button>)}</div></div></details>)}</div></aside>;
}

export function NightRun({ onFinish, onHardware }: { onFinish: () => void; onHardware: () => void }) {
  const { chapter, quality, selectedChoice, selectedPreparationId, sleepMode, activeSleepSession, recordWakeEcho } = useGameStore();
  const { campaign, localize, locale, t } = useI18n();
  const current = campaign.case.chapters.find((item) => item.number === chapter)!;
  const result = resolveNight(campaign, chapter, quality, selectedPreparationId, selectedChoice);
  const direction = result.direction;
  const preparation = localize(getPreparation(selectedPreparationId));
  const nightSeal = getAsset(getCampaignNightSealAssetId(campaign, chapter));
  const nightHeader = getAsset(campaign.presentation.nightAssetId);
  const watch = localize(getCityWatch(activeSleepSession?.watchId ?? DEMO_CITY_WATCH_ID));
  const watchEcho = getCampaignWatchEcho(campaign, chapter, watch.id);
  const [seconds, setSeconds] = useState(12);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (sleepMode === "demo") setSeconds((value) => {
        if (value <= 1) { window.clearInterval(timer); window.setTimeout(onFinish, 350); return 0; }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onFinish, sleepMode]);
  const elapsedMinutes = elapsedSessionMinutes(activeSleepSession, new Date(now));
  const progress = sleepMode === "demo" ? ((12 - seconds) / 12) * 100 : nightSealProgress(activeSleepSession, new Date(now));
  const wakeEcho = activeSleepSession?.wakeEcho ? getCampaignWakeEchoById(campaign, activeSleepSession.wakeEcho.echoId) : null;
  const wakeEchoVisible = Boolean(wakeEcho && (sleepMode === "real" || progress >= 35));
  const botanical = getCampaignBotanical(campaign, chapter);
  const growthStage = growthStageFromProgress(progress);
  const eventCount = sleepMode === "demo" ? Math.max(1, Math.ceil(progress / 20)) : Math.min(result.events.length, Math.max(1, Math.floor(elapsedMinutes / 90) + 1));
  const sessionLine = sleepMode === "real"
    ? locale === "en" ? `Lin Du departed with ${preparation?.shortTitle ?? "a notebook"} · ${formatSleepDuration(elapsedMinutes, locale)} investigated` : `林渡带着${preparation?.shortTitle ?? "笔记本"}出发 · 已调查 ${formatSleepDuration(elapsedMinutes)}`
    : locale === "en" ? `Lin Du departed with ${preparation?.shortTitle ?? "a notebook"} · night seal forming · ${seconds}s` : `林渡带着${preparation?.shortTitle ?? "笔记本"}出发 · 夜印正在形成 · ${seconds} 秒`;
  return (
    <main className="night-run">
      <Image className="night-expedition-art" src={nightHeader.src} alt={nightHeader.alt} fill preload sizes="100vw" />
      <div className="night-stars" /><div className="night-header"><div className="brand-mark compact"><span aria-hidden="true" /><div><b>{t("夜班进行中")}</b><small>{locale === "en" ? `NIGHT ${chapter}` : `第 ${chapter} 夜`} · {sleepMode === "real" ? t("真实夜班") : t(qualityCopy[quality].time)}</small></div></div><button onClick={onFinish}>{sleepMode === "real" ? t("我醒了，拆开报告") : t("跳到清晨")} <ArrowRight size={16} /></button></div>
      <div className="night-title"><p>{sleepMode === "real" ? t("合上页面也没关系。城市记得交接的时刻。") : t("你休息的时候，他会继续。")}</p><h2>{current.title}</h2><span>{sessionLine}</span><div className="route-order"><small>TONIGHT&apos;S DIRECTION</small><b>{direction.dispatchTitle}</b><em>{t("目的地")} · {direction.destination}</em></div></div>
      <aside className={`city-watch-live watch-${watch.id}`}><Clock3 /><div><small>{watch.archiveLabel} · {watch.window}</small><b>{watch.label}</b><span>{watchEcho.scene}</span></div></aside>
      <SleepHardwareNightTelemetry session={activeSleepSession} progress={progress} onOpen={onHardware} dark />
      {sleepMode === "real" && <aside className={wakeEchoVisible ? "wake-check-in recorded" : "wake-check-in"}><div><small>SLEEP GAP · {t("睡隙记录")}</small><b>{wakeEchoVisible ? t("这次醒转已经夹进夜印") : t("如果你只是短暂醒来")}</b><p>{wakeEchoVisible ? t("林渡仍在调查；同一夜不会再收集第二条回声。") : t("可以留下一次记录再继续休息。它不会结束夜班，也不改变睡眠评价或任何成果。")}</p></div><button type="button" disabled={Boolean(activeSleepSession?.wakeEcho)} onClick={recordWakeEcho}><Ear /> {wakeEchoVisible ? t("已记录，夜班继续") : t("我只是醒了一下")}</button>{wakeEchoVisible && wakeEcho && <WakeEchoSlip echo={wakeEcho} recordedAt={activeSleepSession?.wakeEcho?.recordedAt} mode="real" />}</aside>}
      {sleepMode === "demo" && wakeEchoVisible && wakeEcho && <aside className="wake-check-in demo recorded"><div><small>INTERRUPTED SLEEP ECHO · {t("断续旅程回声")}</small><b>{t("睡意裂开时，城市递来一张薄纸")}</b><p>{t("这是断续旅程的叙事侧影，不是失败或额外奖励。")}</p></div><WakeEchoSlip echo={wakeEcho} recordedAt={activeSleepSession?.wakeEcho?.recordedAt} mode="demo" /></aside>}
      <div className="night-seal-growth" aria-label={locale === "en" ? `Night ${chapter} seal forming` : `第${chapter}夜的夜印正在形成`}><Image className="seal-ghost" src={nightSeal.src} alt="" width={118} height={118} sizes="118px" /><span style={{ height: `${progress}%` }}><Image src={nightSeal.src} alt={nightSeal.alt} width={118} height={118} sizes="118px" /></span></div>
      <div className="night-journey-stage"><NightDiorama progress={progress} routeNodes={direction.routeNodes} variant={direction.mapVariant} watchId={watch.id} /><aside className="night-growth-panel"><BotanicalSpecimen chapter={chapter} progress={progress} compact /><small>GROWING WHILE YOU REST</small><p>{botanical.growthStages[growthStage]}</p></aside></div>
      <div className="event-ticker">{result.events.slice(0, eventCount).map((event, index) => <motion.div key={event} initial={{ opacity: 0, x: -10 }} animate={{ opacity: index === eventCount - 1 ? 1 : .45, x: 0 }}><i />{event}</motion.div>)}</div>
      <div className="night-progress"><span style={{ width: `${progress}%` }} /></div>
    </main>
  );
}

function WakeEchoSlip({ echo, recordedAt, mode }: { echo: WakeEcho; recordedAt?: string; mode: SleepMode }) {
  const { locale, t } = useI18n();
  const clock = mode === "demo" ? "02:17" : recordedAt ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(recordedAt)) : t("此刻");
  return <article className="wake-echo-slip"><header><Radio /><span><small>{clock} · ONE ECHO ONLY</small><b>{echo.title}</b></span></header><p><strong>{t("听见：")}</strong>{echo.sound}</p><p><strong>{t("看见：")}</strong>{echo.glimpse}</p><blockquote>“{echo.fieldNote}”</blockquote></article>;
}

export function MorningReport({ reportChapter, reviewingCurrentMorning, onReviewEvidence, onFinishDay, onPrepareTonight, onHardware }: {
  reportChapter: number;
  reviewingCurrentMorning: boolean;
  onReviewEvidence: () => void;
  onFinishDay: () => void;
  onPrepareTonight: () => void;
  onHardware: () => void;
}) {
  const {
    campaignId,
    chapter: activeChapter,
    quality: activeQuality,
    selectedChoice: activeChoice,
    selectedPreparationId: activePreparationId,
    lastSleepSession,
    preparationHistory,
    choiceHistory,
    growthHistory,
    societyHistory,
    correspondenceHistory,
    souvenirHistory,
    opportunityHistory,
    restRitualHistory,
    answerCorrespondence,
    completeRestReflection,
    unlockedClueIds,
    synthesizedEvidenceIds,
  } = useGameStore();
  const { campaign, localize, locale, t } = useI18n();
  const chapter = reportChapter;
  const growthRecord = growthHistory[chapter];
  const quality = growthRecord?.quality ?? (activeChapter === chapter ? activeQuality : "regular");
  const selectedChoice = growthRecord?.choiceId ?? choiceHistory[chapter] ?? (activeChapter === chapter ? activeChoice : "");
  const selectedPreparationId = growthRecord?.preparationId ?? preparationHistory[chapter] ?? (activeChapter === chapter ? activePreparationId : "side-lamp");
  const reportSleepSession = growthRecord
    ? lastSleepSession?.endedAt === growthRecord.completedAt
      && lastSleepSession.quality === growthRecord.quality
      && lastSleepSession.watchId === growthRecord.watchId
      ? lastSleepSession
      : null
    : activeChapter === chapter ? lastSleepSession : null;
  const current = campaign.case.chapters.find((item) => item.number === chapter)!;
  const result = resolveNight(campaign, chapter, quality, selectedPreparationId, selectedChoice);
  const preparation = localize(getPreparation(selectedPreparationId));
  const nightSeal = getAsset(getCampaignNightSealAssetId(campaign, chapter));
  const morningHeader = getAsset(campaign.presentation.morningAssetId);
  const postcard = getCampaignPostcard(campaign, chapter);
  const postcardArt = getAsset(postcard.assetId);
  const postcardPreparationId = selectedPreparationId || "side-lamp";
  const postcardPreparationNote = postcard.preparationNotes[postcardPreparationId];
  const botanical = getCampaignBotanical(campaign, chapter);
  const souvenirRecord = souvenirHistory[chapter];
  const souvenir = souvenirRecord ? localize(getSouvenir(souvenirRecord.souvenirId)) : null;
  const souvenirArt = souvenir ? getAsset(souvenir.assetId) : null;
  const opportunityRecord = opportunityHistory[chapter];
  const opportunityNotice = opportunityRecord?.noticeId ? localize(getOpportunityNotice(opportunityRecord.noticeId)) : null;
  const opportunityResponse = opportunityRecord ? localize(getOpportunityResponse(opportunityRecord)) : null;
  const encounteredCharacter = campaign.characters.find((character) => character.encounterChapter === chapter);
  const characterArt = encounteredCharacter ? getAsset(encounteredCharacter.assetId) : null;
  const societyRecord = societyHistory[chapter];
  const society = societyRecord ? localize(getCitySociety(societyRecord.societyId)) : null;
  const correspondencePrompt = societyRecord ? localize(getCorrespondencePrompt(societyRecord)) : null;
  const correspondenceRecord = correspondenceHistory[chapter];
  const selectedReply = correspondenceRecord ? localize(getCorrespondenceReply(correspondenceRecord)) : null;
  const priorCorrespondence = societyRecord ? getLatestSocietyReply(correspondenceHistory, societyRecord.societyId, chapter) : undefined;
  const priorReply = priorCorrespondence ? localize(getCorrespondenceReply(priorCorrespondence)) : null;
  const foundClues = campaign.case.clues.filter((item) => result.clueIds.includes(item.id));
  const foundItems = campaign.case.collectibles.filter((item) => result.collectibleIds.includes(item.id));
  const watch = localize(getCityWatch(reportSleepSession?.watchId ?? growthRecord?.watchId ?? DEMO_CITY_WATCH_ID));
  const watchEcho = getCampaignWatchEcho(campaign, chapter, watch.id);
  const wakeEchoId = reportSleepSession?.wakeEcho?.echoId ?? growthRecord?.wakeEchoId;
  const wakeEcho = wakeEchoId ? getCampaignWakeEchoById(campaign, wakeEchoId) : null;
  const restRitual = restRitualHistory[chapter];
  const readyInferenceCount = getReadyEvidenceSyntheses({
    syntheses: campaign.syntheses,
    unlockedClueIds,
    synthesizedEvidenceIds,
  }).length;
  const reportClock = reportSleepSession?.mode === "real" && reportSleepSession.endedAt
    ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(reportSleepSession.endedAt))
    : "05:28";
  const [reportArchiveOpen, setReportArchiveOpen] = useState(false);
  useEffect(() => {
    const wideReport = window.matchMedia("(min-width: 901px)");
    const syncDisclosure = () => setReportArchiveOpen(wideReport.matches);
    syncDisclosure();
    wideReport.addEventListener("change", syncDisclosure);
    return () => wideReport.removeEventListener("change", syncDisclosure);
  }, [chapter]);
  useEffect(() => {
    if (!restRitual || !restRitual.aiRequested || restRitual.status !== "pending") return;
    const requestKey = restRitual.requestId;
    if (pendingRestReflectionRequests.has(requestKey)) return;
    pendingRestReflectionRequests.add(requestKey);
    const requestReflection = async () => {
      try {
        const response = await fetch("/api/rest-reflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: restRitual.requestId,
            locale: restRitual.locale,
            intention: restRitual.intention,
            campaignTitle: campaign.case.title,
            chapterTitle: current.title,
            direction: result.direction.dispatchTitle,
            destination: result.direction.destination,
            preparation: preparation?.shortTitle ?? t("随身物"),
            detectiveName: campaign.presentation.detectiveName,
          }),
        });
        const parsed = restReflectionResponseSchema.safeParse(await response.json());
        if (parsed.success) completeRestReflection(campaignId, chapter, restRitual.requestId, parsed.data.reflection, parsed.data.source, parsed.data.reason);
        else completeRestReflection(campaignId, chapter, restRitual.requestId, restRitual.reflection, "local", response.status === 401 || response.status === 403 || response.status === 429 ? "access-required" : "invalid-output");
      } catch {
        completeRestReflection(campaignId, chapter, restRitual.requestId, restRitual.reflection, "local", "provider-error");
      } finally {
        pendingRestReflectionRequests.delete(requestKey);
      }
    };
    void requestReflection();
  }, [campaign.case.title, campaign.presentation.detectiveName, campaignId, chapter, completeRestReflection, current.title, preparation?.shortTitle, restRitual, result.direction.destination, result.direction.dispatchTitle, t]);
  const restReflectionLabel = restRitual?.status === "pending"
    ? t("AI 正在写回信")
    : restRitual?.status === "ai"
      ? t("AI 个性化短笺")
      : restRitual?.status === "unavailable"
        ? t("AI 未完成 · 本地回信")
        : t("仅本机 · 固定回信");
  const restReflectionDisclosure = restRitual?.status === "pending"
    ? t("本地回信已先写好；模型完成后会在原位替换。")
    : restRitual?.source === "ai"
      ? t("只向模型发送了本夜纸条与已列明的最小叙事上下文。")
      : restRitual?.reason === "local-only"
        ? t("内容只在本机生成和保存，没有发起网络请求。")
        : restRitual?.reason === "not-configured"
          ? t("纸条到达应用服务端，但服务端未配置模型，因此没有发送给模型。")
          : restRitual?.reason === "access-required"
            ? t("纸条到达应用服务端，但访问权限已失效，因此没有发送给模型。")
            : t("应用服务端已尝试请求模型，但请求失败或输出未通过校验，因此改用本地回信。");
  return (
    <div className="report-wrap newspaper">
      <div className="broadsheet">
      <header className="paper-masthead">
        <div className="masthead-topline"><span>{locale === "en" ? "MORNING EDITION" : "晨间版"} · NO. 0{chapter}</span><span>{locale === "en" ? `PRINTED AT ${reportClock}` : `印于 ${reportClock}`}</span><span>{locale === "en" ? "PRICE · ONE LANTERN" : "定价 · 一盏灯"}</span></div>
        <h1>{locale === "en" ? `${campaign.presentation.cityName} Morning Herald` : `${campaign.presentation.cityName}晨报`}</h1>
        <div className="masthead-dateline"><span>{t("记录人：")}{campaign.presentation.detectiveName}</span><span>{t("昨夜调查完成")}</span><span>{campaign.presentation.cityName} · {locale === "en" ? `NIGHT 0${chapter}` : `第 ${chapter} 夜`}</span></div>
      </header>
      <section className="paper-lead">
        <div className="lead-copy"><Seal>{t("调查报告")} · 0{chapter}</Seal><h2>{current.title}</h2><small>{t("记录人：")}{campaign.presentation.detectiveName} · {campaign.presentation.cityName} · {reportClock}</small></div>
        <figure className="lead-figure"><Image className="report-hero-art" src={morningHeader.src} alt={morningHeader.alt} fill preload sizes="(max-width: 900px) 100vw, 60vw" /><figcaption>{morningHeader.alt}</figcaption></figure>
      </section>
      {!reviewingCurrentMorning && <aside className="report-replay-note"><FileText /><span><small>LATEST MORNING REPORT · {t("最新晨报重读")}</small><b>{t("这份报纸保持为上一次归来时的内容。")}</b><p>{t("你可以继续整理案件板，也可以回到今晚的交接；重读不会改写任何归档。")}</p></span></aside>}
      <details className="report-archive-details" open={reportArchiveOpen} onToggle={(event) => setReportArchiveOpen(event.currentTarget.open)}>
        <summary>
          <span><small>FULL NIGHT ARCHIVE · {locale === "en" ? "OPTIONAL READING" : "可选详读"}</small><b>{locale === "en" ? "Open the full route, city echoes, and keepsakes" : "展开昨夜完整行程、城市回声与纪念物"}</b><p>{locale === "en" ? "The core report and next action remain below. Reading every side record is optional." : "核心发现与下一步仍在下方；不展开也不会漏掉线索或阻断主线。"}</p></span>
          <ChevronRight />
        </summary>
      <div className="sleep-receipt-wrap"><SleepHardwareMorningReceipt sessionId={reportSleepSession?.id} /><button type="button" onClick={onHardware}>{t("管理睡眠硬件")} <ChevronRight /></button></div>
      {restRitual && <PaperCard className={`rest-reflection-card source-${restRitual.source}`}><div className="rest-reflection-mark"><Sparkles /><span>{restReflectionLabel}</span></div><div><div className="paper-heading"><small>WHAT YOU LEFT FOR THE NIGHT · {t("放下纸条")}</small><b>{t("林渡把它夹回晨报里")}</b></div><blockquote>“{restRitual.intention}”</blockquote><p>{restRitual.reflection}</p><footer>{restReflectionDisclosure} {t("回信不改变案件事实、睡眠评价或任何奖励。")}</footer></div></PaperCard>}
      <section className="return-postcard" aria-label={locale === "en" ? `Postcard returned from Night ${chapter}` : `第${chapter}夜归来明信片`}>
        <div className="postcard-picture"><Image src={postcardArt.src} alt={postcardArt.alt} fill sizes="(max-width: 900px) 100vw, 58vw" /><span>RETURNED · NIGHT 0{chapter}</span></div>
        <PaperCard className="postcard-back"><div className="paper-heading"><small>01 · POSTCARD FROM LAST NIGHT</small><b>{postcard.title}</b></div><small className="postcard-location">{postcard.location}</small><p className="postcard-rumor">“{postcard.cityRumor}”</p><p>{postcard.message}</p><div className="route-letter"><small>ROUTE LETTER · {result.direction.dispatchTitle}</small><b>{result.direction.destination}</b><p>“{result.returnLetter}”</p><span>{result.cityEncounter}</span></div><div className="postcard-preparation-note"><b>{preparation?.shortTitle ?? t("随身物")}{t("留下的痕迹")}</b><span>{postcardPreparationNote}</span></div></PaperCard>
      </section>
      <PaperCard className={`city-watch-report watch-${watch.id}`}><div className="watch-clock-stamp"><Clock3 /><span>{watch.window}</span></div><div><div className="paper-heading"><small>TIME WATCH · THE HOUR LEFT A MARK</small><b>{t("交接时辰留下的城市侧影")}</b></div><span className="watch-archive-name">{watch.archiveLabel} · {watch.label}</span><h3>{watchEcho.scene}</h3><p><b>{t("此时在街上遇见：")}</b>{watchEcho.encounter}</p><blockquote>“{watchEcho.fieldNote}”</blockquote><footer>{t("时辰只改变侧影与短笺，不改变线索、收藏、植物或睡眠评价。")}</footer></div></PaperCard>
      {wakeEcho && <PaperCard className="wake-echo-report"><div className="wake-report-signal"><Radio /><span>ONE BRIEF WAKING</span></div><div><div className="paper-heading"><small>SLEEP GAP · A NOTE BETWEEN DREAMS</small><b>{t("你短暂醒来时，夜班没有结束")}</b></div><h3>{wakeEcho.title}</h3><p><b>{t("听见：")}</b>{wakeEcho.sound}</p><p><b>{t("看见：")}</b>{wakeEcho.glimpse}</p><blockquote>“{wakeEcho.fieldNote}”</blockquote><footer>{t("这条回声不是奖励，不改变线索、植物、睡眠评价或结局资格。")}</footer></div></PaperCard>}
      <section className={`growth-reveal quality-${quality}`} aria-label={locale === "en" ? `Night ${chapter} botanical` : `第${chapter}夜时间植物`}><BotanicalSpecimen chapter={chapter} /><PaperCard className="growth-record"><div className="paper-heading"><small>02 · TIME GREW HERE</small><b>{t("雾灯温室新标本")}</b></div><span className="botanical-archive-name">{botanical.archiveName} · {botanical.district}</span><h3>{botanical.name}</h3><p className="botanical-rumor">“{botanical.cityRumor}”</p><p>{botanical.specimenNote}</p><div className="growth-quality-note"><b>{t(qualityCopy[quality].label)} · {t("仍然完整")}</b><span>{botanical.qualityNotes[quality]}</span></div></PaperCard></section>
      {encounteredCharacter && characterArt && <section className="character-encounter" aria-label={`${t("昨夜遇见的人")}：${encounteredCharacter.name}`}><div><Image src={characterArt.src} alt={characterArt.alt} width={1024} height={1280} sizes="(max-width: 600px) calc(100vw - 28px), 300px" /></div><PaperCard><div className="paper-heading"><small>PERSON MET LAST NIGHT · {t("昨夜遇见的人")}</small><b>{encounteredCharacter.archiveName}</b></div><span>{encounteredCharacter.role} · {encounteredCharacter.district}</span><h3>{encounteredCharacter.name}</h3><p>“{encounteredCharacter.publicRumor}”</p><blockquote>“{encounteredCharacter.quote}”</blockquote><div><small>{t("目前可以确认")}</small>{encounteredCharacter.knownFact}</div></PaperCard></section>}
      {opportunityNotice && opportunityResponse && <PaperCard className="opportunity-echo"><div><small>DAYLIGHT ANSWER RETURNED · {t("午后答复的回声")}</small><h3>{opportunityNotice.title}</h3></div><blockquote>“{opportunityResponse.echo}”</blockquote><span>{t("这段回声不改变案件成果或结局资格。")}</span></PaperCard>}
      {souvenir && souvenirArt && <section className="souvenir-reveal" aria-label={`${t("口袋里多出来的东西")}：${souvenir.name}`}><div className="souvenir-reveal-art"><Image src={souvenirArt.src} alt={souvenirArt.alt} width={1024} height={1024} sizes="(max-width: 600px) calc(100vw - 28px), 320px" /></div><PaperCard><div className="paper-heading"><small>03 · FOUND IN A POCKET</small><b>{t("口袋里多出来的东西")}</b></div><span className="souvenir-archive-name">{souvenir.archiveName}</span><h3>{souvenir.name}</h3><p className="souvenir-rumor">“{souvenir.cityRumor}”</p><p>{souvenir.provenance}</p><blockquote>“{souvenir.fieldNote}”</blockquote><div className="souvenir-no-advantage"><b>{t("不是案件线索")}</b><span>{t("它不提供调查优势、额外奖励或结局资格，只证明这座城在你睡着时有自己的生活。")}</span></div></PaperCard></section>}
      {societyRecord && society && correspondencePrompt && <section className={`society-memory-letter society-${society.id}`} aria-label={`${society.name}${t("来函")}`}><SocietyCrest societyId={society.id} featured /><PaperCard><div className="paper-heading"><small>04 · THE CITY REMEMBERS</small><b>{society.name}{t("来函")}</b></div><span className="society-archive-name">{society.archiveName}</span><h3>{locale === "en" ? `To “${t(getSocietyTitle(societyRecord))}”` : `致「${getSocietyTitle(societyRecord)}」`}</h3><p className="society-rumor">“{society.publicRumor}”</p><blockquote>{t(getSocietyLetter(societyRecord))}</blockquote>{priorReply && <div className="correspondence-echo"><small>YOUR LAST ANSWER RETURNED · {t("上次答复的余波")}</small><p>{priorReply.echo}</p></div>}<div className="society-postscript"><small>{t("本夜被记住的原因")}</small><p>{result.direction.societyNotice}</p></div><div className="correspondence-question"><small>A QUESTION WITH NO CORRECT ANSWER · {t("城市问函")}</small><p>{correspondencePrompt.context}</p><h4>{correspondencePrompt.question}</h4><div className="correspondence-replies">{correspondencePrompt.replies.map((reply) => <button key={reply.id} className={selectedReply?.id === reply.id ? "selected" : ""} disabled={Boolean(selectedReply) || !reviewingCurrentMorning} onClick={() => answerCorrespondence(chapter, reply.id)}><b>{reply.label}</b><span>{reply.note}</span>{selectedReply?.id === reply.id && <Check size={15} />}</button>)}</div>{selectedReply ? <div className="correspondence-filed"><b>{t("答复已寄出")}</b><span>{selectedReply.summary}</span></div> : <p className="correspondence-skip">{reviewingCurrentMorning ? t("可以不回信，直接整理晨报；沉默不会失去线索、植物或任何后续章节。") : t("今日已经结束；这封未寄出的答复作为空白留在档案里。")}</p>}</div><footer>— {society.signoff}</footer></PaperCard></section>}
      </details>
      <div className="report-grid">
        <PaperCard className="sleep-summary"><div className="paper-heading"><small>NIGHT IMPRESSION</small><b>{locale === "en" ? `Night seal ${chapter}` : `第 ${chapter} 枚夜印`}</b></div><div className="sleep-session-meta"><span>{reportSleepSession?.mode === "real" ? t("真实夜班") : t("演示夜班")}</span><b>{formatSleepDuration(reportSleepSession?.durationMinutes ?? growthRecord?.durationMinutes, locale)}</b></div><div className="earned-seal"><Image src={nightSeal.src} alt={nightSeal.alt} width={150} height={150} sizes="150px" /></div><p>{t(quality === "interrupted" ? "城市的声音有些断续，旅程较短，但这枚夜印仍完整记录了重要发现。" : quality === "regular" ? "一条完整而安静的标准路线，已经压进纸纤维里。" : "雾散得很早，夜印因此多留下一圈稀薄的金线。")}</p></PaperCard>
        <PaperCard className="journal"><div className="paper-heading"><small>LIN DU / FIELD NOTES</small><b>{t("侦探日志")}</b></div><p>“{current.journal}”</p><span>— {campaign.presentation.detectiveName}, 05:28</span></PaperCard>
      </div>
      {result.preparationEcho && <PaperCard className="preparation-echo"><div><small>PACKED OBJECT · {t("随身物回响")}</small><h3>{preparation?.title}</h3></div><p>“{t(result.preparationEcho)}”</p></PaperCard>}
      <section className="route-report"><div className="dark-heading"><span>05</span><div><small>LAST NIGHT ROUTE · {result.direction.dispatchTitle}</small><h3>{t("昨夜路线")}</h3></div></div><CityRoute compact routeNodes={result.direction.routeNodes} variant={result.direction.mapVariant} /></section>
      <section className="discoveries"><div className="dark-heading"><span>06</span><div><small>NEW EVIDENCE</small><h3>{t("新发现")}</h3></div></div><div className="evidence-row">{foundClues.map((clue) => <PaperCard key={clue.id} className="evidence-card"><div className="evidence-icon">{clue.type === "contradiction" ? <Lightbulb /> : <FileText />}</div><Seal>{clue.type === "contradiction" ? t("矛盾") : t("线索")}</Seal><h4>{clue.title}</h4><p>{clue.detail}</p></PaperCard>)}{foundItems.map((item) => { const art = getAsset(item.assetId); return <PaperCard key={item.id} className="evidence-card collectible"><div className="evidence-art"><Image src={art.src} alt={art.alt} width={180} height={180} sizes="(max-width: 600px) calc(100vw - 92px), 260px" /></div><Seal>{t("收藏")} · {item.rarity}</Seal><h4>{item.title}</h4><p>{item.surfaceDescription}</p></PaperCard>; })}</div></section>
      <PaperCard className="contradiction"><span>NEW QUESTION · {t("新的矛盾")}</span><blockquote>“{current.contradiction}”</blockquote><p>{t("把它带回案件板。白天的推理由你完成。")}</p></PaperCard>
      <div className="report-action">
        <button className="report-board-action" onClick={onReviewEvidence}><FileText size={18} />{readyInferenceCount > 0 ? (locale === "en" ? `${readyInferenceCount} inference${readyInferenceCount > 1 ? "s" : ""} ready to file` : `${readyInferenceCount} 条新推论可以整理`) : (locale === "en" ? "Open the evidence archive" : "去线索档案继续整理")}</button>
        <button className="primary-button" onClick={reviewingCurrentMorning ? onFinishDay : onPrepareTonight}>{reviewingCurrentMorning ? (chapter === campaign.case.chapters.at(-1)!.number ? t("做出最终决定") : t("结束今日，准备下一夜")) : t("去准备今晚")}<ArrowRight size={18} /></button>
      </div>
      </div>
    </div>
  );
}

export function EmptyReport({ setView }: { setView: (view: GameView) => void }) {
  const { completedReports } = useGameStore();
  const { t } = useI18n();
  return <div className="empty-report"><Coffee /><p>{completedReports.length ? t("最新晨报已经归档。") : t("第一份晨报还在路上。")}</p><h2>{completedReports.length ? t("城市的清晨已经留下记录。") : t("先把今晚的任务交给林渡。")}</h2><button className="primary-button" onClick={() => setView(completedReports.length ? "archive" : "tonight")}>{completedReports.length ? t("查看档案") : t("准备今晚")}<ArrowRight /></button></div>;
}
