"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive, ArrowRight, BookOpen, BriefcaseBusiness, Check, ChevronRight,
  Clock3, Coffee, FileText, Flower2, Footprints,
  Gift, KeyRound, Lightbulb, Moon, RotateCcw, Search,
  Sparkles, TramFront, X, Zap,
} from "lucide-react";
import { Background, BackgroundVariant, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nightShiftCase } from "@/src/content/case";
import { assets, getAsset, getNightSealAsset } from "@/src/content/assets";
import { getPreparation, preparations, type PreparationId } from "@/src/content/preparations";
import { resolveNight } from "@/src/lib/game-engine/resolve-night";
import type { SleepMode, SleepQuality } from "@/src/lib/game-engine/schema";
import { elapsedSessionMinutes, formatSleepDuration, nightSealProgress } from "@/src/lib/game-engine/sleep-session";
import { useGameStore } from "@/src/stores/game-store";

type View = "tonight" | "report" | "board" | "collection" | "archive";

const subscribeToHydration = () => () => undefined;

const qualityCopy: Record<SleepQuality, { label: string; time: string; note: string }> = {
  interrupted: { label: "4小时 · 断续", time: "短程调查", note: "会听见一次特别的城市回声" },
  regular: { label: "6.5小时 · 普通", time: "标准调查", note: "一条完整路线与一件藏品" },
  restful: { label: "8小时 · 安稳", time: "深入调查", note: "更完整的观察与稀有说明" },
};

function Seal({ children }: { children: React.ReactNode }) {
  return <span className="seal">{children}</span>;
}

function PaperCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`paper-card ${className}`}><span className="tape" />{children}</div>;
}

function Hero({ onStart, onDemo, interactive }: { onStart: () => void; onDemo: () => void; interactive: boolean }) {
  return (
    <main className="hero-shell">
      <div className="rain" aria-hidden="true" />
      <Image className="hero-art" src={assets.nightShiftHero.src} alt={assets.nightShiftHero.alt} fill priority sizes="100vw" />
      <div className="hero-vignette" />
      <nav className="landing-nav">
        <div className="brand-mark"><span>NS</span><div><b>夜班侦探</b><small>NIGHT SHIFT</small></div></div>
        <button className="ghost-button" disabled={!interactive} onClick={onDemo}><Zap size={15} /> DEMO MODE</button>
      </nav>
      <section className="hero-copy">
        <p className="eyebrow"><Moon size={14} /> 一款与你轮班生活的异步侦探游戏</p>
        <h1>你睡着以后，<br /><em>他才开始工作。</em></h1>
        <p className="hero-lede">白天分析线索，晚上把调查交给侦探。等你醒来，雾灯城会留下一份新的报告。</p>
        <div className="hero-actions">
          <button className="primary-button" disabled={!interactive} onClick={onStart}>开始第一宗案件 <ArrowRight size={18} /></button>
          <button className="text-button" disabled={!interactive} onClick={onDemo}><BookOpen size={17} /> 观看 90 秒演示</button>
        </div>
        <div className="shift-rule"><span>你负责白天推理</span><i /><span>林渡负责夜晚调查</span></div>
      </section>
      <div className="case-teaser"><span className="case-index">CASE 001</span><b>零点四十三分的末班车</b><small>一辆不存在的电车，每晚仍在穿过这座城市。</small></div>
    </main>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = [
    ["你们从未同时醒着。", "当你合上眼睛，林渡才穿上外套。"],
    ["白天，你整理他带回的线索。", "旧车票、花粉、被刮掉的地图，都在等你连接。"],
    ["夜晚，他替你进入城市。", "今晚的调查，交给他吧。"],
  ];
  return (
    <motion.div className="intro-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="intro-window"><TramFront /><span className="window-light" /></div>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="intro-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <span>0{step + 1} / 03</span><h2>{lines[step][0]}</h2><p>{lines[step][1]}</p>
        </motion.div>
      </AnimatePresence>
      <div className="intro-footer"><div className="intro-dots">{lines.map((_, i) => <i className={i === step ? "active" : ""} key={i} />)}</div><button className="primary-button" onClick={() => step < 2 ? setStep(step + 1) : onDone()}>{step < 2 ? "继续" : "进入事务所"}<ChevronRight size={18} /></button></div>
    </motion.div>
  );
}

function TopBar({ chapter, onDemo, onHome }: { chapter: number; onDemo: () => void; onHome: () => void }) {
  return (
    <header className="topbar">
      <button className="brand-mark compact" onClick={onHome}><span>NS</span><div><b>夜班侦探</b><small>NIGHT SHIFT</small></div></button>
      <div className="case-heading"><small>CASE 001 · 第 {chapter} 夜</small><b>{nightShiftCase.title}</b></div>
      <button className="demo-pill" onClick={onDemo}><Zap size={14} /> DEMO</button>
    </header>
  );
}

function BottomNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  const items: [View, React.ReactNode, string][] = [
    ["report", <Coffee key="c" />, "今晨"], ["board", <Search key="s" />, "案件板"], ["tonight", <Moon key="m" />, "今晚"], ["collection", <Gift key="g" />, "收藏"], ["archive", <Archive key="a" />, "档案"],
  ];
  return <nav className="bottom-nav">{items.map(([id, icon, label]) => <button className={view === id ? "active" : ""} key={id} onClick={() => setView(id)}>{icon}<span>{label}</span></button>)}</nav>;
}

function Tonight({ onLaunch }: { onLaunch: (quality: SleepQuality, preparationId: PreparationId, mode: SleepMode) => void }) {
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
        <div className="choice-list">{current.choices.map((choice, i) => <button key={choice.id} className={selectedChoice === choice.id ? "choice selected" : "choice"} onClick={() => selectChoice(choice.id)}><span>0{i + 1}</span><div><b>{choice.label}</b><small>{choice.note}</small></div>{selectedChoice === choice.id ? <Check /> : <ChevronRight />}</button>)}</div>
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

function CityRoute({ progress = 100, compact = false }: { progress?: number; compact?: boolean }) {
  return <div className={`city-map ${compact ? "compact" : ""}`}><div className="river" /><div className="tram-line"><span style={{ width: `${progress}%` }} /></div><div className="route-stop s1"><i />事务所</div><div className="route-stop s2"><i />灯港</div><div className="route-stop s3"><i />旧子午</div><div className="route-stop s4"><i />玻璃丘</div><motion.div className="detective-marker" animate={{ left: `${Math.max(4, Math.min(90, progress))}%` }} transition={{ duration: 1.2 }}><Footprints /></motion.div><span className="map-label ml1">LANTERN WHARF</span><span className="map-label ml2">OLD MERIDIAN</span><span className="map-label ml3">GLASS HILL</span></div>;
}

function NightRun({ onFinish }: { onFinish: () => void }) {
  const { chapter, quality, selectedPreparationId, sleepMode, activeSleepSession } = useGameStore();
  const current = nightShiftCase.chapters[chapter - 1];
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
  const eventCount = sleepMode === "demo" ? Math.max(1, Math.ceil(progress / 20)) : Math.min(current.events.length, Math.max(1, Math.floor(elapsedMinutes / 90) + 1));
  const sessionLine = sleepMode === "real"
    ? `林渡带着${preparation?.shortTitle ?? "笔记本"}出发 · 已调查 ${formatSleepDuration(elapsedMinutes)}`
    : `林渡带着${preparation?.shortTitle ?? "笔记本"}出发 · 夜印正在形成 · ${seconds} 秒`;
  return (
    <main className="night-run">
      <div className="night-stars" /><div className="night-header"><div className="brand-mark compact"><span>NS</span><div><b>夜班进行中</b><small>第 {chapter} 夜 · {sleepMode === "real" ? "真实夜班" : qualityCopy[quality].time}</small></div></div><button onClick={onFinish}>{sleepMode === "real" ? "我醒了，拆开报告" : "跳到清晨"} <ArrowRight size={16} /></button></div>
      <div className="night-title"><p>{sleepMode === "real" ? "合上页面也没关系。城市记得交接的时刻。" : "你休息的时候，他会继续。"}</p><h2>{current.title}</h2><span>{sessionLine}</span></div>
      <div className="night-seal-growth" aria-label={`第${chapter}夜的夜印正在形成`}><Image className="seal-ghost" src={nightSeal.src} alt="" width={118} height={118} /><span style={{ height: `${progress}%` }}><Image src={nightSeal.src} alt={nightSeal.alt} width={118} height={118} /></span></div>
      <CityRoute progress={progress} />
      <div className="event-ticker">{current.events.slice(0, eventCount).map((event, index) => <motion.div key={event} initial={{ opacity: 0, x: -10 }} animate={{ opacity: index === eventCount - 1 ? 1 : .45, x: 0 }}><i />{event}</motion.div>)}</div>
      <div className="night-progress"><span style={{ width: `${progress}%` }} /></div>
    </main>
  );
}

function MorningReport({ onContinue }: { onContinue: () => void }) {
  const { chapter, quality, selectedPreparationId, lastSleepSession } = useGameStore();
  const current = nightShiftCase.chapters[chapter - 1];
  const result = resolveNight(chapter, quality, selectedPreparationId);
  const preparation = getPreparation(selectedPreparationId);
  const nightSeal = getNightSealAsset(chapter);
  const foundClues = nightShiftCase.clues.filter((item) => result.clueIds.includes(item.id));
  const foundItems = nightShiftCase.collectibles.filter((item) => result.collectibleIds.includes(item.id));
  return (
    <div className="report-wrap">
      <section className="report-hero"><div><Seal>调查报告 · 0{chapter}</Seal><p>昨夜调查完成</p><h2>{current.title}</h2><small>记录人：林渡 · 雾灯城 · 05:28</small></div><div className="dawn-window"><span /><TramFront /></div></section>
      <div className="report-grid">
        <PaperCard className="sleep-summary"><div className="paper-heading"><small>NIGHT IMPRESSION</small><b>第 {chapter} 枚夜印</b></div><div className="sleep-session-meta"><span>{lastSleepSession?.mode === "real" ? "真实夜班" : "演示夜班"}</span><b>{formatSleepDuration(lastSleepSession?.durationMinutes)}</b></div><div className="earned-seal"><Image src={nightSeal.src} alt={nightSeal.alt} width={150} height={150} /></div><p>{quality === "interrupted" ? "城市的声音有些断续，旅程较短，但这枚夜印仍完整记录了重要发现。" : quality === "regular" ? "一条完整而安静的标准路线，已经压进纸纤维里。" : "雾散得很早，夜印因此多留下一圈稀薄的金线。"}</p></PaperCard>
        <PaperCard className="journal"><div className="paper-heading"><small>LIN DU / FIELD NOTES</small><b>侦探日志</b></div><p>“{current.journal}”</p><span>— 林渡，清晨五点二十八分</span></PaperCard>
      </div>
      {result.preparationEcho && <PaperCard className="preparation-echo"><div><small>PACKED OBJECT · 随身物回响</small><h3>{preparation?.title}</h3></div><p>“{result.preparationEcho}”</p></PaperCard>}
      <section className="route-report"><div className="dark-heading"><span>02</span><div><small>LAST NIGHT ROUTE</small><h3>昨夜路线</h3></div></div><CityRoute compact /></section>
      <section className="discoveries"><div className="dark-heading"><span>03</span><div><small>NEW EVIDENCE</small><h3>新发现</h3></div></div><div className="evidence-row">{foundClues.map((clue) => <PaperCard key={clue.id} className="evidence-card"><div className="evidence-icon">{clue.type === "contradiction" ? <Lightbulb /> : <FileText />}</div><Seal>{clue.type === "contradiction" ? "矛盾" : "线索"}</Seal><h4>{clue.title}</h4><p>{clue.detail}</p></PaperCard>)}{foundItems.map((item) => { const art = getAsset(item.assetId); return <PaperCard key={item.id} className="evidence-card collectible"><div className="evidence-art"><Image src={art.src} alt={art.alt} width={180} height={180} /></div><Seal>收藏 · {item.rarity}</Seal><h4>{item.title}</h4><p>{item.surfaceDescription}</p></PaperCard>; })}</div></section>
      <PaperCard className="contradiction"><span>NEW QUESTION · 新的矛盾</span><blockquote>“{current.contradiction}”</blockquote><p>把它带回案件板。白天的推理由你完成。</p></PaperCard>
      <div className="report-action"><button className="primary-button" onClick={onContinue}>{chapter === 5 ? "做出最终决定" : "整理线索，准备下一夜"}<ArrowRight size={18} /></button></div>
    </div>
  );
}

function CaseBoard() {
  const { unlockedClueIds, confirmedRelations, confirmRelation } = useGameStore();
  const available = nightShiftCase.clues.filter((clue) => unlockedClueIds.includes(clue.id));
  const nodes = useMemo<Node[]>(() => available.map((clue, index) => ({
    id: clue.id,
    position: { x: 70 + (index % 4) * 240 + (index % 2) * 20, y: 70 + Math.floor(index / 4) * 180 },
    data: { label: <div className={`board-node ${clue.type}`}><span className="pin" /><small>{clue.type.toUpperCase()} · 0{clue.chapter}</small><b>{clue.title}</b><p>{clue.summary}</p></div> },
    style: { background: "transparent", border: 0, padding: 0, width: 190 },
  })), [available]);
  const edges = useMemo<Edge[]>(() => available.slice(1).map((clue, i) => ({ id: `e-${i}`, source: available[i].id, target: clue.id, animated: i === available.length - 2, style: { stroke: i % 3 === 0 ? "#a86158" : "#698d89", strokeWidth: 2 } })), [available]);
  const relations = [
    ["line-institution", "43号线", "私人收藏机构"], ["mina-evelyn", "米娜", "伊芙琳仍然活着"], ["gideon-escape", "吉迪恩", "主动协助逃离"],
  ];
  return <div className="board-page"><div className="page-title"><div><p className="eyebrow">CASE BOARD · 证物关系图</p><h2>把城市说过的谎，<br />一根根连起来。</h2></div><p>拖动证物整理桌面。确认三条核心关系，才能把最后的选择交还给伊芙琳。</p></div><div className="board-shell">{nodes.length ? <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.5} maxZoom={1.6} proOptions={{ hideAttribution: true }}><Background color="#988d73" gap={28} size={1} variant={BackgroundVariant.Dots} /><Controls showInteractive={false} /></ReactFlow> : <div className="board-empty"><Search /><h3>案件板还很安静</h3><p>完成第一夜调查，林渡带回的证物会出现在这里。</p></div>}<aside className="relation-panel"><small>关键推论 · {confirmedRelations.length}/3</small>{relations.map(([id, from, to]) => <button key={id} className={confirmedRelations.includes(id) ? "done" : ""} onClick={() => unlockedClueIds.length >= 5 && confirmRelation(id)}><span>{confirmedRelations.includes(id) ? <Check /> : <i />}</span><b>{from}</b><ArrowRight /><b>{to}</b></button>)}</aside></div></div>;
}

function Collection() {
  const { unlockedCollectibleIds, nightSealIds, chapter } = useGameStore();
  return <div className="collection-page"><div className="page-title"><div><p className="eyebrow">NIGHT CABINET · 夜间陈列柜</p><h2>时间没有消失。<br />它留下了证物。</h2></div><p>每次等待都会形成一枚夜印；每件旧物也会在故事推进后显露第二层含义。</p></div><section className="night-seal-shelf"><div className="shelf-heading"><small>FIVE NIGHTS · {nightSealIds.length}/5</small><h3>五夜印记</h3></div><div className="night-seal-row">{nightShiftCase.chapters.map((entry) => { const art = getNightSealAsset(entry.number); const unlocked = nightSealIds.includes(entry.number); return <div className={unlocked ? "night-seal unlocked" : "night-seal locked"} key={entry.number}><Image src={art.src} alt={unlocked ? art.alt : "尚未形成的夜印"} width={160} height={160} /><span>夜 0{entry.number}</span><b>{unlocked ? entry.title : "尚未成形"}</b></div>; })}</div></section><div className="collection-grid">{nightShiftCase.collectibles.map((item, index) => { const unlocked = unlockedCollectibleIds.includes(item.id); const revealed = unlocked && chapter >= Math.min(5, item.chapter + 2); const art = getAsset(item.assetId); return <motion.article whileHover={unlocked ? { y: -5, rotate: index % 2 ? .3 : -.3 } : {}} key={item.id} className={`collectible-card ${unlocked ? "unlocked" : "locked"}`}><div className="item-number">0{index + 1}</div><div className="item-art"><Image src={art.src} alt={unlocked ? art.alt : "尚未发现的物品"} width={438} height={438} /></div><div className="item-meta"><small>{unlocked ? `${item.district} · ${item.rarity}` : "尚未发现"}</small><h3>{unlocked ? item.title : "未归档物品"}</h3><p>{unlocked ? (revealed ? item.revealedDescription : item.surfaceDescription) : "下一次夜间调查，也许会让它出现在林渡的口袋里。"}</p>{revealed && <Seal>隐藏含义已揭示</Seal>}</div></motion.article>; })}</div></div>;
}

function ArchivePage() {
  const { completedReports, unlockedClueIds } = useGameStore();
  return <div className="archive-page"><div className="page-title"><div><p className="eyebrow">CASE ARCHIVE · 001</p><h2>零点四十三分<br />的末班车</h2></div><Seal>{Math.round((unlockedClueIds.length / 12) * 100)}% 已查明</Seal></div><div className="archive-folders">{nightShiftCase.chapters.map((chapter) => <PaperCard key={chapter.number} className={completedReports.includes(chapter.number) ? "folder complete" : "folder"}><span className="folder-tab">NIGHT 0{chapter.number}</span><small>{completedReports.includes(chapter.number) ? "REPORT FILED" : "SEALED"}</small><h3>{chapter.title}</h3><p>{chapter.subtitle}</p><div>{completedReports.includes(chapter.number) ? <><Check /> 调查完成</> : <><KeyRound /> 尚未开启</>}</div></PaperCard>)}</div></div>;
}

function EmptyReport({ setView }: { setView: (view: View) => void }) {
  const { completedReports } = useGameStore();
  return <div className="empty-report"><Coffee /><p>{completedReports.length ? "最新晨报已经归档。" : "第一份晨报还在路上。"}</p><h2>{completedReports.length ? "城市的清晨已经留下记录。" : "先把今晚的任务交给林渡。"}</h2><button className="primary-button" onClick={() => setView(completedReports.length ? "archive" : "tonight")}>{completedReports.length ? "查看档案" : "准备今晚"}<ArrowRight /></button></div>;
}

function Ending() {
  const { unlockedClueIds, unlockedCollectibleIds, confirmedRelations, endingId, chooseEnding, reset } = useGameStore();
  const trueReady = unlockedClueIds.length === 12 && unlockedCollectibleIds.length >= 7 && confirmedRelations.length >= 3;
  const endings = [
    { id: "public", icon: <FileText />, title: "公开档案", theme: "真相属于所有人。", result: "全部证据被公开，私人收藏机构受到调查，部分资产陆续归还。伊芙琳再次消失。" },
    { id: "protect", icon: <KeyRound />, title: "保护证人", theme: "真相不应以牺牲证人为代价。", result: "证据被交给可信档案机构，伊芙琳的身份暂不公布。一张没有目的地的车票寄到了事务所。" },
    { id: "return", icon: <Flower2 />, title: "让失踪者自己决定", theme: "把证据，也把选择权交还给她。", result: "数周后，伊芙琳亲自署名的调查报告公开。林渡收到第九件藏品：一卷尚未冲洗的胶卷。", locked: !trueReady },
  ];
  const selected = endings.find((item) => item.id === endingId);
  if (selected) return <main className="ending-reveal"><div className="ending-light" /><div className="ending-tram"><TramFront /></div><Seal>{selected.id === "return" ? "TRUE ENDING" : "CASE CLOSED"}</Seal><h1>{selected.title}</h1><p className="ending-theme">{selected.theme}</p><PaperCard><p>{selected.result}</p><hr /><p>林渡最后一封信：</p><blockquote>“我们总以为破案是替一件事写下句号。后来才明白，有些真相只是把笔还给真正应该写下它的人。”</blockquote></PaperCard><h2>城市里仍有许多灯，<br />只在你睡着以后亮起。</h2><button className="ghost-button" onClick={reset}><RotateCcw /> 重新调查</button></main>;
  return <main className="ending-choice"><div className="page-title"><div><p className="eyebrow">FINAL DECISION · 05:43</p><h2>最后的决定，<br />由你写进档案。</h2></div><p>伊芙琳把账册留在站台，却没有把决定也留下。三种真相，都有各自的代价。</p></div><div className="ending-cards">{endings.map((ending) => <button key={ending.id} disabled={ending.locked} onClick={() => chooseEnding(ending.id)} className={ending.id === "return" ? "true-ending" : ""}><span>{ending.icon}</span><small>{ending.locked ? `尚需 ${12 - unlockedClueIds.length} 条线索 / ${3 - confirmedRelations.length} 条关系` : "可选择"}</small><h3>{ending.title}</h3><p>{ending.theme}</p><ArrowRight /></button>)}</div></main>;
}

function DemoDrawer({ onClose, setView }: { onClose: () => void; setView: (view: View) => void }) {
  const { jumpToChapter, unlockBoard, reset } = useGameStore();
  return <><motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} /><motion.aside className="demo-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}><div className="drawer-header"><div><small>DEMO MODE</small><h2>演示控制台</h2></div><button onClick={onClose}><X /></button></div><p>用几分钟浏览完整五夜剧情。快捷键：<kbd>Shift</kbd> + <kbd>D</kbd></p><div className="demo-section"><small>跳到章节</small><div className="chapter-jumps">{nightShiftCase.chapters.map((chapter) => <button key={chapter.number} onClick={() => { jumpToChapter(chapter.number); setView("tonight"); onClose(); }}><b>0{chapter.number}</b><span>{chapter.title}</span></button>)}</div></div><div className="demo-section"><small>现场演示</small><button className="drawer-action" onClick={() => { unlockBoard(); setView("board"); onClose(); }}><Search /> 解锁完整案件板 <ChevronRight /></button><button className="drawer-action" onClick={() => { jumpToChapter(5); unlockBoard(); setView("tonight"); onClose(); }}><Sparkles /> 跳到真结局条件 <ChevronRight /></button></div><button className="reset-button" onClick={() => { reset(); onClose(); }}><RotateCcw /> 重置本地存档</button></motion.aside></>;
}

export default function HomePage() {
  const game = useGameStore();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [intro, setIntro] = useState(false);
  const [view, setView] = useState<View>("tonight");
  const [demo, setDemo] = useState(false);
  const activeView: View = game.phase === "morning" ? "report" : view;
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.shiftKey && event.key.toLowerCase() === "d") setDemo((value) => !value); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, []);
  if (!game.started && !intro) return <><Hero interactive={hydrated} onStart={() => setIntro(true)} onDemo={() => { game.begin(); setDemo(true); }} /><AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={setView} />}</AnimatePresence></>;
  if (intro && !game.started) return <Intro onDone={() => { game.begin(); setIntro(false); }} />;
  if (game.phase === "night") return <NightRun onFinish={game.finishNight} />;
  if (game.phase === "ending") return <Ending />;
  return <div className="app-shell"><TopBar chapter={game.chapter} onDemo={() => setDemo(true)} onHome={() => { game.reset(); setIntro(false); }} /><main className="app-content">{activeView === "tonight" && <Tonight onLaunch={game.startNight} />}{activeView === "report" && (game.phase === "morning" ? <MorningReport onContinue={() => { game.continueDay(); setView(game.chapter >= 5 ? "tonight" : "board"); }} /> : <EmptyReport setView={setView} />)}{activeView === "board" && <CaseBoard />}{activeView === "collection" && <Collection />}{activeView === "archive" && <ArchivePage />}</main><BottomNav view={activeView} setView={setView} /><AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={setView} />}</AnimatePresence></div>;
}
