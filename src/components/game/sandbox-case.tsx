"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  FileText,
  Footprints,
  Gauge,
  House,
  Map,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { availableSandboxEndings, requirementMet } from "@/src/lib/sandbox/engine";
import type {
  SandboxCampaignContent,
  SandboxHandout,
  SandboxLocation,
  SandboxProgress,
  SandboxRisk,
} from "@/src/lib/sandbox/types";
import { getSandboxProgress, useSandboxStore } from "@/src/stores/sandbox-store";

type SandboxView = "map" | "evidence" | "people" | "ending";

const subscribeToHydration = () => () => undefined;
const riskLabels: Record<SandboxRisk, string> = {
  quiet: "低暴露",
  exposed: "会引起注意",
  dangerous: "高风险",
  terminal: "不可逆",
};
const npcStateLabels: Record<string, string> = {
  unknown: "尚未接触",
  wary: "戒备",
  helpful: "愿意协助",
  hostile: "敌对",
  rescued: "已救出",
  lost: "已失去",
  transformed: "已异变",
};

export function SandboxCase({
  campaignId,
  content,
  onHome,
}: {
  campaignId: string;
  content: SandboxCampaignContent;
  onHome: () => void;
}) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const sandboxStore = useSandboxStore();
  const progress = getSandboxProgress(sandboxStore, campaignId, content);
  const [view, setView] = useState<SandboxView>("map");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedHandout, setSelectedHandout] = useState<SandboxHandout | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const ending = content.endings.find((item) => item.id === progress.endingId);

  if (!hydrated) return <main className="sandbox-loading"><span>CASE 003</span><h1>正在展开黑水溪地图</h1></main>;
  if (!progress.started || !progress.originId) {
    return <OriginBriefing content={content} reducedHorror={progress.reducedHorror} onHome={onHome} onToggle={() => sandboxStore.toggleReducedHorror(campaignId, content)} onStart={(originId) => sandboxStore.start(campaignId, content, originId)} />;
  }
  if (ending && view !== "evidence") {
    return <SandboxEnding content={content} progress={progress} endingId={ending.id} onHome={onHome} onReview={() => setView("evidence")} onReset={() => { sandboxStore.reset(campaignId, content); setSelectedLocationId(null); }} />;
  }

  const origin = content.origins.find((item) => item.id === progress.originId)!;
  const corruption = content.corruptionStages[progress.corruption];
  const availableEndings = availableSandboxEndings(content, progress);
  const effectiveLocationId = selectedLocationId ?? progress.unlockedLocationIds[0];
  const selectedLocation = content.locations.find((location) => location.id === effectiveLocationId) ?? null;

  return (
    <div className="sandbox-shell">
      <header className="sandbox-topbar">
        <button type="button" className="sandbox-brand" onClick={onHome}><span>NS</span><div><b>夜班侦探</b><small>异地卷宗 · 003</small></div></button>
        <div className="sandbox-case-title"><small>{content.year} · {content.place}</small><b>{content.title}</b></div>
        <button type="button" className="sandbox-brief-button" onClick={() => setShowBriefing(true)}><BookOpen /> 委托</button>
      </header>

      <section className="sandbox-statusbar">
        <div><Footprints /><span><small>行动记录</small><b>{progress.completedActionIds.length}</b></span></div>
        <div className={`corruption-level corruption-${progress.corruption}`}><Sparkles /><span><small>污染 · {corruption.name}</small><b>{progress.corruption} / 7</b></span></div>
        <div className={`threat-level threat-${progress.threat}`}><Gauge /><span><small>山谷警觉</small><b>{progress.threat} / 6</b></span></div>
        <button type="button" aria-pressed={progress.reducedHorror} onClick={() => sandboxStore.toggleReducedHorror(campaignId, content)}><ShieldAlert /><span><small>表现强度</small><b>{progress.reducedHorror ? "低刺激" : "完整"}</b></span></button>
      </section>

      <main className="sandbox-main">
        {view === "map" && <MapView content={content} progress={progress} selected={selectedLocation} onSelect={(location) => setSelectedLocationId(location.id)} onAction={(actionId) => sandboxStore.resolveAction(campaignId, content, actionId)} />}
        {view === "evidence" && <EvidenceView content={content} progress={progress} onHandout={setSelectedHandout} />}
        {view === "people" && <PeopleView content={content} progress={progress} />}
        {view === "ending" && <EndingDesk content={content} progress={progress} onChoose={(endingId) => sandboxStore.chooseEnding(campaignId, content, endingId)} />}
      </main>

      <nav className="sandbox-nav" aria-label="黑水溪卷宗导航">
        <button type="button" className={view === "map" ? "active" : ""} onClick={() => setView("map")}><Map /><span>地点</span></button>
        <button type="button" className={view === "evidence" ? "active" : ""} onClick={() => setView("evidence")}><FileText /><span>证物</span><i>{progress.clueIds.length}</i></button>
        <button type="button" className={view === "people" ? "active" : ""} onClick={() => setView("people")}><Users /><span>人物</span></button>
        <button type="button" className={view === "ending" ? "active" : ""} onClick={() => setView("ending")}><Sparkles /><span>收场</span>{availableEndings.length > 0 && <i>{availableEndings.length}</i>}</button>
      </nav>

      {selectedHandout && <HandoutModal handout={selectedHandout} onClose={() => setSelectedHandout(null)} />}
      {showBriefing && <BriefingModal content={content} originTitle={origin.title} objective={origin.objective} onClose={() => setShowBriefing(false)} onReset={() => setShowReset(true)} />}
      {showReset && <ConfirmReset onClose={() => setShowReset(false)} onConfirm={() => { sandboxStore.reset(campaignId, content); setSelectedLocationId(null); setShowReset(false); setShowBriefing(false); }} />}
    </div>
  );
}

function OriginBriefing({
  content,
  reducedHorror,
  onHome,
  onToggle,
  onStart,
}: {
  content: SandboxCampaignContent;
  reducedHorror: boolean;
  onHome: () => void;
  onToggle: () => void;
  onStart: (originId: string) => void;
}) {
  return (
    <main className="sandbox-origin">
      <div className="sandbox-origin-backdrop" />
      <header><button type="button" onClick={onHome}><ArrowLeft /> 回到案件书架</button><span>CASE 003 · NON-COMMERCIAL PROTOTYPE</span></header>
      <section className="sandbox-origin-copy">
        <p className="eyebrow">1926 · Miskatonic Valley</p>
        <h1>{content.title}</h1>
        <p>{content.premise}</p>
        <div className="sandbox-warning"><CircleAlert /><div><b>内容提示</b><p>{content.contentWarnings.join("、")}。</p></div><button type="button" aria-pressed={reducedHorror} onClick={onToggle}>{reducedHorror ? "已启用低刺激表现" : "切换到低刺激表现"}</button></div>
      </section>
      <section className="origin-cards">
        {content.origins.map((origin) => <article key={origin.id}>
          <small>{origin.id === "university" ? "ENTRY A · SEARCH PARTY" : "ENTRY B · BOOTLEGGERS"}</small>
          <h2>{origin.title}</h2>
          <b>{origin.subtitle}</b>
          <p>{origin.briefing}</p>
          <dl><div><dt>任务</dt><dd>{origin.objective}</dd></div><div><dt>身份特质</dt><dd>{origin.trait}</dd></div></dl>
          <button type="button" onClick={() => onStart(origin.id)}>以此身份进入山谷 <ChevronRight /></button>
        </article>)}
      </section>
      <footer><span>原作者 {content.license.originalAuthor} · 译者 {content.license.translator}</span><span>{content.license.usage}</span></footer>
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
  const latest = progress.log.at(-1);
  return (
    <div className="sandbox-map-layout">
      <section className="sandbox-map-panel">
        <div className="sandbox-section-heading"><div><small>FIELD MAP · {progress.unlockedLocationIds.length} / {content.locations.length}</small><h1>密斯卡托尼克谷地</h1></div><p>地点可以乱序调查；亮起的卷宗钉代表你已有足够线索前往。</p></div>
        <div className="sandbox-map" aria-label="黑水溪地点地图">
          <div className="river-line" aria-hidden="true" />
          {content.locations.map((location) => {
            const unlocked = progress.unlockedLocationIds.includes(location.id);
            const visited = progress.visitedLocationIds.includes(location.id);
            return <button type="button" key={location.id} disabled={!unlocked} aria-pressed={selected?.id === location.id} className={`${unlocked ? "unlocked" : "locked"} ${visited ? "visited" : ""}`} style={{ left: `${location.coordinates.x}%`, top: `${location.coordinates.y}%` }} onClick={() => onSelect(location)}><span>{String(location.order).padStart(2, "0")}</span><b>{unlocked ? location.name : "未显影"}</b></button>;
          })}
          <span className="map-north">N</span>
          <p className="map-caption">BLACKWATER CREEK · FIELD SURVEY 1926</p>
        </div>
        <div className="location-strip">
          {content.locations.map((location) => {
            const unlocked = progress.unlockedLocationIds.includes(location.id);
            return <button type="button" key={location.id} disabled={!unlocked} className={selected?.id === location.id ? "active" : ""} onClick={() => onSelect(location)}><small>{location.archiveName}</small><b>{unlocked ? location.name : "尚未显影"}</b></button>;
          })}
        </div>
      </section>
      <aside className="sandbox-location-panel">
        {selected ? <>
          <header><small>{selected.archiveName} · {progress.visitedLocationIds.includes(selected.id) ? "VISITED" : "UNVISITED"}</small><h2>{selected.name}</h2><b>{selected.subtitle}</b><p>{selected.atmosphere}</p></header>
          {latest?.locationId === selected.id && <blockquote className="latest-result"><small>最新归档</small><b>{latest.title}</b><p>{latest.result}</p>{(latest.corruptionDelta !== 0 || latest.threatDelta !== 0) && <span>{latest.corruptionDelta ? `污染 +${latest.corruptionDelta}` : ""}{latest.corruptionDelta && latest.threatDelta ? " · " : ""}{latest.threatDelta ? `警觉 +${latest.threatDelta}` : ""}</span>}</blockquote>}
          <div className="sandbox-action-list">
            {selected.actions.map((action) => {
              const completed = progress.completedActionIds.includes(action.id);
              const allowed = requirementMet(progress, action.requires);
              return <article className={`${completed ? "completed" : ""} risk-${action.risk}`} key={action.id}>
                <div><span>{riskLabels[action.risk]}</span>{completed && <i><Check /> 已归档</i>}</div>
                <h3>{action.title}</h3><p>{action.intent}</p>
                {!allowed && action.requirementHint && <small>{action.requirementHint}</small>}
                {completed ? <details><summary>重看结果</summary><p>{progress.log.find((entry) => entry.actionId === action.id)?.result}</p></details> : <button type="button" disabled={!allowed} onClick={() => onAction(action.id)}>{allowed ? "执行这次调查" : "条件尚未满足"} <ChevronRight /></button>}
              </article>;
            })}
          </div>
        </> : <div className="sandbox-empty-panel"><Map /><h2>选择一个已显影地点</h2><p>线索会打开新的道路；不必按编号前进。</p></div>}
      </aside>
    </div>
  );
}

function EvidenceView({ content, progress, onHandout }: { content: SandboxCampaignContent; progress: SandboxProgress; onHandout: (handout: SandboxHandout) => void }) {
  const unlockedClues = content.clues.filter((clue) => progress.clueIds.includes(clue.id));
  const handouts = content.handouts.filter((handout) => progress.handoutIds.includes(handout.id));
  const items = content.items.filter((item) => progress.itemIds.includes(item.id));
  return (
    <div className="sandbox-document-page">
      <div className="sandbox-section-heading"><div><small>EVIDENCE DESK · {unlockedClues.length} / {content.clues.length}</small><h1>证物与展示材料</h1></div><p>关键事实拥有多条获取路径；一次错过不会锁死卷宗。</p></div>
      <section className="sandbox-handout-shelf">
        <h2>展示材料 <span>{handouts.length} / {content.handouts.length}</span></h2>
        <div>{content.handouts.map((handout) => {
          const unlocked = progress.handoutIds.includes(handout.id);
          return <button type="button" key={handout.id} disabled={!unlocked} onClick={() => onHandout(handout)}><small>HANDOUT {String(handout.number).padStart(2, "0")}</small><b>{unlocked ? handout.title : "封存材料"}</b><p>{unlocked ? handout.source : "在对应地点找到后可阅读"}</p></button>;
        })}</div>
      </section>
      <section className="sandbox-clue-grid">
        {unlockedClues.map((clue) => <article key={clue.id}><small>{clue.category}</small><h3>{clue.title}</h3><b>{clue.summary}</b><p>{clue.detail}</p><div>{clue.relatedIds.filter((id) => progress.clueIds.includes(id)).map((id) => <span key={id}>{content.clues.find((item) => item.id === id)?.title}</span>)}</div></article>)}
      </section>
      <section className="sandbox-inventory"><h2>随队物品</h2><div>{items.map((item) => <article key={item.id}><b>{item.name}</b><p>{item.description}</p></article>)}</div></section>
    </div>
  );
}

function PeopleView({ content, progress }: { content: SandboxCampaignContent; progress: SandboxProgress }) {
  const origin = content.origins.find((item) => item.id === progress.originId)!;
  const corruption = content.corruptionStages[progress.corruption];
  return (
    <div className="sandbox-document-page">
      <div className="sandbox-section-heading"><div><small>PEOPLE & CONDITION</small><h1>人物与队伍状态</h1></div><p>{origin.title} · {origin.trait}</p></div>
      <section className="corruption-ledger">
        <header><div><small>CURRENT EXPOSURE · {progress.corruption}/7</small><h2>{corruption.name}</h2></div><span>{progress.reducedHorror ? "低刺激表现已启用" : "完整恐怖表现"}</span></header>
        <div>{content.corruptionStages.map((stage) => <article className={`${stage.stage <= progress.corruption ? "reached" : ""} ${stage.stage === progress.corruption ? "current" : ""}`} key={stage.stage}><span>{stage.stage}</span><div><b>{stage.name}</b><p>{stage.stage <= progress.corruption ? stage.benefit : "尚未抵达"}</p><small>{stage.stage <= progress.corruption ? stage.cost : "进一步接触溪水、受污染食物或洞穴才会推进。"}</small></div></article>)}</div>
      </section>
      <section className="npc-ledger">
        {content.npcs.map((npc) => {
          const state = progress.npcStates[npc.id] ?? "unknown";
          return <article className={`npc-${state}`} key={npc.id}><div><small>{npc.faction}</small><span>{npcStateLabels[state]}</span></div><h3>{npc.name}</h3><b>{npc.role}</b><p>{state === "unknown" ? npc.publicFace : npc.privateDrive}</p></article>;
        })}
      </section>
    </div>
  );
}

function EndingDesk({ content, progress, onChoose }: { content: SandboxCampaignContent; progress: SandboxProgress; onChoose: (endingId: string) => void }) {
  const available = availableSandboxEndings(content, progress);
  return (
    <div className="sandbox-document-page ending-desk">
      <div className="sandbox-section-heading"><div><small>CLOSING ROUTES · {available.length} AVAILABLE</small><h1>给故事一个收场</h1></div><p>逃离、交易、封锁与摧毁都不是同一份答案；卷宗只展示你真正抵达的选择。</p></div>
      {available.length === 0 ? <section className="no-ending-yet"><CircleAlert /><h2>还没有可收束的路线</h2><p>继续调查溪源、卡莫迪农场或北坡逃生路线。至少一条明确退路出现后，卷宗才允许结案。</p></section> : <section className="sandbox-ending-grid">{available.map((ending) => <article className={ending.terminal ? "terminal" : ""} key={ending.id}><small>{ending.archiveLabel}</small><h2>{ending.title}</h2><b>{ending.theme}</b><p>{ending.result}</p><button type="button" onClick={() => onChoose(ending.id)}>以此收场 <ChevronRight /></button></article>)}</section>}
      <section className="ending-readiness">
        <h2>尚未归档的收场</h2>
        <div>{content.endings.filter((ending) => !available.some((item) => item.id === ending.id)).map((ending) => <article key={ending.id}><b>{ending.title}</b><span>条件尚未满足</span><p>{ending.theme}</p></article>)}</div>
      </section>
    </div>
  );
}

function HandoutModal({ handout, onClose }: { handout: SandboxHandout; onClose: () => void }) {
  return <div className="sandbox-modal-scrim" role="presentation" onClick={onClose}><article className="handout-modal" role="dialog" aria-modal="true" aria-label={handout.title} onClick={(event) => event.stopPropagation()}><button type="button" onClick={onClose}><X /></button><small>BLACKWATER CREEK · HANDOUT {String(handout.number).padStart(2, "0")}</small><h2>{handout.title}</h2><b>{handout.source}</b><p className="handout-summary">{handout.summary}</p>{handout.archiveText.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<footer>交互改编摘要 · 非原 PDF 逐字转录</footer></article></div>;
}

function BriefingModal({ content, originTitle, objective, onClose, onReset }: { content: SandboxCampaignContent; originTitle: string; objective: string; onClose: () => void; onReset: () => void }) {
  return <div className="sandbox-modal-scrim" role="presentation" onClick={onClose}><article className="briefing-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={onClose}><X /></button><small>ACTIVE BRIEFING</small><h2>{originTitle}</h2><p>{objective}</p><hr /><h3>改编与使用说明</h3><p>{content.license.adaptation}</p><p>{content.license.notice}</p><p><b>{content.license.usage}</b></p><button type="button" className="reset-case-button" onClick={onReset}><RotateCcw /> 重新开始本案</button></article></div>;
}

function ConfirmReset({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return <div className="sandbox-modal-scrim high" role="presentation" onClick={onClose}><article className="confirm-reset" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><CircleAlert /><h2>重新开始《黑水溪》？</h2><p>这会清除本案的身份、地点、手札、污染和结局进度；另外两宗案件不受影响。</p><div><button type="button" onClick={onClose}>保留存档</button><button type="button" onClick={onConfirm}>确认重新开始</button></div></article></div>;
}

function SandboxEnding({ content, progress, endingId, onHome, onReview, onReset }: { content: SandboxCampaignContent; progress: SandboxProgress; endingId: string; onHome: () => void; onReview: () => void; onReset: () => void }) {
  const ending = content.endings.find((item) => item.id === endingId)!;
  const rescued = Object.values(progress.npcStates).filter((state) => state === "rescued").length;
  return <main className="sandbox-ending-reveal"><div className="ending-pulse" /><header><span>CASE 003 · {ending.archiveLabel}</span><button type="button" onClick={onHome}><House /> 案件书架</button></header><section><small>{content.year} · BLACKWATER CREEK</small><h1>{ending.title}</h1><b>{ending.theme}</b><p>{ending.result}</p><blockquote>{ending.coda}</blockquote><dl><div><dt>调查行动</dt><dd>{progress.completedActionIds.length}</dd></div><div><dt>带回线索</dt><dd>{progress.clueIds.length} / {content.clues.length}</dd></div><div><dt>污染阶段</dt><dd>{progress.corruption} / 7</dd></div><div><dt>救出人物</dt><dd>{rescued}</dd></div></dl><div className="ending-actions"><button type="button" onClick={onReview}><FileText /> 重看证物</button><button type="button" onClick={onReset}><RotateCcw /> 重新调查</button></div></section><footer><span>原作者 {content.license.originalAuthor} · 译者 {content.license.translator}</span><span>{content.license.usage}</span></footer></main>;
}
