"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, BriefcaseBusiness, Check, ChevronRight, Clock3, Coffee, FileText, Lightbulb, Moon, TramFront, Zap } from "lucide-react";
import { nightShiftCase } from "@/src/content/case";
import { getAsset, getNightSealAsset, getPostcardAsset } from "@/src/content/assets";
import { getJourneyPostcard, getPostcardPreparationNote } from "@/src/content/postcards";
import { getNightBotanical, growthStageFromProgress } from "@/src/content/botany";
import { getPreparation, preparations, type PreparationId } from "@/src/content/preparations";
import { getRouteDirection } from "@/src/content/routes";
import { getCitySociety, getSocietyLetter, getSocietyTitle } from "@/src/content/societies";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import type { SleepMode, SleepQuality } from "@/src/lib/game-engine/schema";
import { elapsedSessionMinutes, formatSleepDuration, nightSealProgress } from "@/src/lib/game-engine/sleep-session";
import { useGameStore } from "@/src/stores/game-store";
import { BotanicalSpecimen, CityRoute, PaperCard, qualityCopy, Seal, SocietyCrest } from "./shared";
import type { GameView } from "./types";

export function Tonight({ onLaunch }: { onLaunch: (quality: SleepQuality, preparationId: PreparationId, mode: SleepMode) => void }) {
  const { chapter, selectedChoice, selectChoice, phase } = useGameStore();
  const current = nightShiftCase.chapters[chapter - 1];
  const [quality, setQuality] = useState<SleepQuality>("regular");
  const [preparationId, setPreparationId] = useState<PreparationId>("side-lamp");
  const [sleepMode, setSleepMode] = useState<SleepMode>("demo");
  return (
    <div className="content-grid tonight-page">
      <section className="desk-scene">
        <div className="scene-copy"><p className="eyebrow"><Clock3 size={14} /> 今晚的任务 · 23:40 前交接</p><h2>林渡正在整理<br />今晚的装备。</h2><p>选择一个调查方向。无论你今晚睡得如何，故事都会继续。</p></div>
        <div className="detective-cutout" aria-label="正在桌边整理装备的侦探林渡"><div className="head" /><div className="coat" /><div className="lamp-cone" /><BriefcaseBusiness /></div>
        <div className="desk-props"><span className="notebook">FIELD<br />NOTES</span><span className="flashlight" /><span className="cup" /></div>
      </section>
      <section className="plan-panel">
        <div className="section-label"><span>夜 {chapter}</span><small>{current.title}</small></div>
        <h3>{current.question}</h3>
        <p className="city-aside">“{current.cityAside}”</p>
        <div className="choice-list">{current.choices.map((choice, i) => { const direction = getRouteDirection(chapter, choice.id); const society = getCitySociety(direction.societyId); return <button key={choice.id} className={selectedChoice === choice.id ? "choice selected" : "choice"} onClick={() => selectChoice(choice.id)}><span>0{i + 1}</span><div><b>{choice.label}</b><small>{choice.note}</small><em>可能惊动 · {society.name}</em></div>{selectedChoice === choice.id ? <Check /> : <ChevronRight />}</button>; })}</div>
        <div className="preparation-box"><div className="preparation-heading"><small>PACK ONE THING · 随身物</small><b>准备，然后放手</b></div><div className="preparation-list">{preparations.map((item) => { const Icon = item.icon; return <button key={item.id} className={preparationId === item.id ? "preparation selected" : "preparation"} onClick={() => setPreparationId(item.id)}><span><Icon size={19} /></span><div><b>{item.title}</b><small>{item.promise}</small></div>{preparationId === item.id && <Check size={15} />}</button>; })}</div><p>{getPreparation(preparationId)?.description}</p></div>
        <div className="quality-box">
          <div><small>NIGHT HANDOFF</small><b>选择交接方式</b></div>
          <div className="mode-toggle" role="group" aria-label="夜班模式">
            <button className={sleepMode === "demo" ? "active" : ""} onClick={() => setSleepMode("demo")}><Zap size={14} /> 演示旅程</button>
            <button className={sleepMode === "real" ? "active" : ""} onClick={() => setSleepMode("real")}><Moon size={14} /> 今夜真实交接</button>
          </div>
          {sleepMode === "demo" ? <div className="quality-tabs">{(Object.keys(qualityCopy) as SleepQuality[]).map((id) => <button key={id} className={quality === id ? "active" : ""} onClick={() => setQuality(id)} title={qualityCopy[id].note}>{qualityCopy[id].label}</button>)}</div> : <p className="real-mode-note">从交接那一刻起计时。你可以锁屏、关闭页面，醒来后再回来拆晨报；提前醒来也不会失去主线线索。</p>}
        </div>
        <button disabled={!selectedChoice || phase !== "ready"} className="handoff-button" onClick={() => onLaunch(quality, preparationId, sleepMode)}>{sleepMode === "real" ? "开始今夜的真实交接" : "今晚交给你了"} <Moon size={18} /></button>
      </section>
    </div>
  );
}

export function NightRun({ onFinish }: { onFinish: () => void }) {
  const { chapter, quality, selectedChoice, selectedPreparationId, sleepMode, activeSleepSession } = useGameStore();
  const current = nightShiftCase.chapters[chapter - 1];
  const result = resolveNight(chapter, quality, selectedPreparationId, selectedChoice);
  const direction = result.direction;
  const preparation = getPreparation(selectedPreparationId);
  const nightSeal = getNightSealAsset(chapter);
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
  const botanical = getNightBotanical(chapter);
  const growthStage = growthStageFromProgress(progress);
  const eventCount = sleepMode === "demo" ? Math.max(1, Math.ceil(progress / 20)) : Math.min(result.events.length, Math.max(1, Math.floor(elapsedMinutes / 90) + 1));
  const sessionLine = sleepMode === "real"
    ? `林渡带着${preparation?.shortTitle ?? "笔记本"}出发 · 已调查 ${formatSleepDuration(elapsedMinutes)}`
    : `林渡带着${preparation?.shortTitle ?? "笔记本"}出发 · 夜印正在形成 · ${seconds} 秒`;
  return (
    <main className="night-run">
      <div className="night-stars" /><div className="night-header"><div className="brand-mark compact"><span>NS</span><div><b>夜班进行中</b><small>第 {chapter} 夜 · {sleepMode === "real" ? "真实夜班" : qualityCopy[quality].time}</small></div></div><button onClick={onFinish}>{sleepMode === "real" ? "我醒了，拆开报告" : "跳到清晨"} <ArrowRight size={16} /></button></div>
      <div className="night-title"><p>{sleepMode === "real" ? "合上页面也没关系。城市记得交接的时刻。" : "你休息的时候，他会继续。"}</p><h2>{current.title}</h2><span>{sessionLine}</span><div className="route-order"><small>TONIGHT&apos;S DIRECTION</small><b>{direction.dispatchTitle}</b><em>目的地 · {direction.destination}</em></div></div>
      <div className="night-seal-growth" aria-label={`第${chapter}夜的夜印正在形成`}><Image className="seal-ghost" src={nightSeal.src} alt="" width={118} height={118} /><span style={{ height: `${progress}%` }}><Image src={nightSeal.src} alt={nightSeal.alt} width={118} height={118} /></span></div>
      <div className="night-journey-stage"><CityRoute progress={progress} routeNodes={direction.routeNodes} variant={direction.mapVariant} /><aside className="night-growth-panel"><BotanicalSpecimen chapter={chapter} progress={progress} compact /><small>GROWING WHILE YOU REST</small><p>{botanical.growthStages[growthStage]}</p></aside></div>
      <div className="event-ticker">{result.events.slice(0, eventCount).map((event, index) => <motion.div key={event} initial={{ opacity: 0, x: -10 }} animate={{ opacity: index === eventCount - 1 ? 1 : .45, x: 0 }}><i />{event}</motion.div>)}</div>
      <div className="night-progress"><span style={{ width: `${progress}%` }} /></div>
    </main>
  );
}

export function MorningReport({ onContinue }: { onContinue: () => void }) {
  const { chapter, quality, selectedChoice, selectedPreparationId, lastSleepSession, societyHistory } = useGameStore();
  const current = nightShiftCase.chapters[chapter - 1];
  const result = resolveNight(chapter, quality, selectedPreparationId, selectedChoice);
  const preparation = getPreparation(selectedPreparationId);
  const nightSeal = getNightSealAsset(chapter);
  const postcard = getJourneyPostcard(chapter);
  const postcardArt = getPostcardAsset(chapter);
  const postcardPreparationId = selectedPreparationId || "side-lamp";
  const postcardPreparationNote = getPostcardPreparationNote(chapter, postcardPreparationId);
  const botanical = getNightBotanical(chapter);
  const societyRecord = societyHistory[chapter];
  const society = societyRecord ? getCitySociety(societyRecord.societyId) : null;
  const foundClues = nightShiftCase.clues.filter((item) => result.clueIds.includes(item.id));
  const foundItems = nightShiftCase.collectibles.filter((item) => result.collectibleIds.includes(item.id));
  return (
    <div className="report-wrap">
      <section className="report-hero"><div><Seal>调查报告 · 0{chapter}</Seal><p>昨夜调查完成</p><h2>{current.title}</h2><small>记录人：林渡 · 雾灯城 · 05:28</small></div><div className="dawn-window"><span /><TramFront /></div></section>
      <section className="return-postcard" aria-label={`第${chapter}夜归来明信片`}>
        <div className="postcard-picture"><Image src={postcardArt.src} alt={postcardArt.alt} fill sizes="(max-width: 900px) 100vw, 58vw" /><span>RETURNED · NIGHT 0{chapter}</span></div>
        <PaperCard className="postcard-back"><div className="paper-heading"><small>01 · POSTCARD FROM LAST NIGHT</small><b>{postcard.title}</b></div><small className="postcard-location">{postcard.location}</small><p className="postcard-rumor">“{postcard.cityRumor}”</p><p>{postcard.message}</p><div className="route-letter"><small>ROUTE LETTER · {result.direction.dispatchTitle}</small><b>{result.direction.destination}</b><p>“{result.returnLetter}”</p><span>{result.cityEncounter}</span></div><div className="postcard-preparation-note"><b>{preparation?.shortTitle ?? "随身物"}留下的痕迹</b><span>{postcardPreparationNote}</span></div></PaperCard>
      </section>
      <section className={`growth-reveal quality-${quality}`} aria-label={`第${chapter}夜时间植物`}><BotanicalSpecimen chapter={chapter} /><PaperCard className="growth-record"><div className="paper-heading"><small>02 · TIME GREW HERE</small><b>雾灯温室新标本</b></div><span className="botanical-archive-name">{botanical.archiveName} · {botanical.district}</span><h3>{botanical.name}</h3><p className="botanical-rumor">“{botanical.cityRumor}”</p><p>{botanical.specimenNote}</p><div className="growth-quality-note"><b>{qualityCopy[quality].label} · 仍然完整</b><span>{botanical.qualityNotes[quality]}</span></div></PaperCard></section>
      {societyRecord && society && <section className={`society-memory-letter society-${society.id}`} aria-label={`${society.name}来函`}><SocietyCrest societyId={society.id} /><PaperCard><div className="paper-heading"><small>03 · THE CITY REMEMBERS</small><b>{society.name}来函</b></div><span className="society-archive-name">{society.archiveName}</span><h3>致「{getSocietyTitle(societyRecord)}」</h3><p className="society-rumor">“{society.publicRumor}”</p><blockquote>{getSocietyLetter(societyRecord)}</blockquote><div className="society-postscript"><small>本夜被记住的原因</small><p>{result.direction.societyNotice}</p></div><footer>— {society.signoff}</footer></PaperCard></section>}
      <div className="report-grid">
        <PaperCard className="sleep-summary"><div className="paper-heading"><small>NIGHT IMPRESSION</small><b>第 {chapter} 枚夜印</b></div><div className="sleep-session-meta"><span>{lastSleepSession?.mode === "real" ? "真实夜班" : "演示夜班"}</span><b>{formatSleepDuration(lastSleepSession?.durationMinutes)}</b></div><div className="earned-seal"><Image src={nightSeal.src} alt={nightSeal.alt} width={150} height={150} /></div><p>{quality === "interrupted" ? "城市的声音有些断续，旅程较短，但这枚夜印仍完整记录了重要发现。" : quality === "regular" ? "一条完整而安静的标准路线，已经压进纸纤维里。" : "雾散得很早，夜印因此多留下一圈稀薄的金线。"}</p></PaperCard>
        <PaperCard className="journal"><div className="paper-heading"><small>LIN DU / FIELD NOTES</small><b>侦探日志</b></div><p>“{current.journal}”</p><span>— 林渡，清晨五点二十八分</span></PaperCard>
      </div>
      {result.preparationEcho && <PaperCard className="preparation-echo"><div><small>PACKED OBJECT · 随身物回响</small><h3>{preparation?.title}</h3></div><p>“{result.preparationEcho}”</p></PaperCard>}
      <section className="route-report"><div className="dark-heading"><span>04</span><div><small>LAST NIGHT ROUTE · {result.direction.dispatchTitle}</small><h3>昨夜路线</h3></div></div><CityRoute compact routeNodes={result.direction.routeNodes} variant={result.direction.mapVariant} /></section>
      <section className="discoveries"><div className="dark-heading"><span>05</span><div><small>NEW EVIDENCE</small><h3>新发现</h3></div></div><div className="evidence-row">{foundClues.map((clue) => <PaperCard key={clue.id} className="evidence-card"><div className="evidence-icon">{clue.type === "contradiction" ? <Lightbulb /> : <FileText />}</div><Seal>{clue.type === "contradiction" ? "矛盾" : "线索"}</Seal><h4>{clue.title}</h4><p>{clue.detail}</p></PaperCard>)}{foundItems.map((item) => { const art = getAsset(item.assetId); return <PaperCard key={item.id} className="evidence-card collectible"><div className="evidence-art"><Image src={art.src} alt={art.alt} width={180} height={180} /></div><Seal>收藏 · {item.rarity}</Seal><h4>{item.title}</h4><p>{item.surfaceDescription}</p></PaperCard>; })}</div></section>
      <PaperCard className="contradiction"><span>NEW QUESTION · 新的矛盾</span><blockquote>“{current.contradiction}”</blockquote><p>把它带回案件板。白天的推理由你完成。</p></PaperCard>
      <div className="report-action"><button className="primary-button" onClick={onContinue}>{chapter === 5 ? "做出最终决定" : "整理线索，准备下一夜"}<ArrowRight size={18} /></button></div>
    </div>
  );
}

export function EmptyReport({ setView }: { setView: (view: GameView) => void }) {
  const { completedReports } = useGameStore();
  return <div className="empty-report"><Coffee /><p>{completedReports.length ? "最新晨报已经归档。" : "第一份晨报还在路上。"}</p><h2>{completedReports.length ? "城市的清晨已经留下记录。" : "先把今晚的任务交给林渡。"}</h2><button className="primary-button" onClick={() => setView(completedReports.length ? "archive" : "tonight")}>{completedReports.length ? "查看档案" : "准备今晚"}<ArrowRight /></button></div>;
}
