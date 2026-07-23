"use client";

import Image from "next/image";
import { ArrowRight, Clock3, Coffee, FileCheck2, House, KeyRound, Link2, MapPinned, Moon, Radio } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import type { CampaignStoryline } from "@/src/content/campaigns/types";
import { useI18n } from "@/src/i18n/provider";
import type { SandboxProgress } from "@/src/lib/sandbox/types";
import { getSandboxProgress, useSandboxStore } from "@/src/stores/sandbox-store";

function storylineSaveId(campaignId: string, storylineId: string) {
  return `${campaignId}:${storylineId}`;
}

function progressLabel(progress: SandboxProgress, english = false) {
  if (progress.endingId) return english ? "Thread complete" : "故事线已完结";
  if (progress.phase === "night") return english ? "Night shift in progress" : "夜班计时中";
  if (progress.phase === "morning") return english ? "Report waiting" : "晨报待归档";
  if (!progress.started) return english ? "Not started" : "尚未开线";
  return progress.log.length ? (english ? "Ready for the next storylet" : "可安排下一段") : (english ? "Entry selected" : "入口已选");
}

function progressIcon(progress: SandboxProgress) {
  if (progress.endingId) return <FileCheck2 />;
  if (progress.phase === "night") return <Clock3 />;
  if (progress.phase === "morning") return <Coffee />;
  return <Moon />;
}

export function CityChronicle({
  onOpenStoryline,
  onHome,
  onHardware,
}: {
  onOpenStoryline: (storyline: CampaignStoryline) => void;
  onHome: () => void;
  onHardware: () => void;
}) {
  const { locale } = useI18n();
  return (
    <main className="city-chronicle">
      <header className="city-chronicle-topbar">
        <button type="button" onClick={onHome}><House /><span><b>{locale === "en" ? "Night Shift" : "夜班侦探"}</b><small>FOGLIGHT CITY CHRONICLE</small></span></button>
        <div><small>{locale === "en" ? "ONE CITY · CONCURRENT STORY THREADS" : "同一座城市 · 多条故事线并行"}</small><b>{locale === "en" ? "The city keeps moving while you are away." : "你离开时，城市仍在继续。"} </b></div>
        <button type="button" onClick={onHardware}><Radio /><span>{locale === "en" ? "Sleep hardware" : "睡眠硬件"}</span></button>
      </header>
      <CityStoryMap onOpenStoryline={onOpenStoryline} />
    </main>
  );
}

export function CityStoryMap({ onOpenStoryline }: { onOpenStoryline: (storyline: CampaignStoryline) => void }) {
  const { campaign, locale } = useI18n();
  const sandboxStore = useSandboxStore();
  const storylines = campaign.storylines ?? [];
  if (!storylines.length) return null;

  const progressById = Object.fromEntries(storylines.map((storyline) => [
    storyline.id,
    getSandboxProgress(sandboxStore, storylineSaveId(campaign.id, storyline.id), storyline.content),
  ])) as Record<string, SandboxProgress>;
  const sharedClueIds = Array.from(new Set(Object.values(progressById).flatMap((progress) => progress.clueIds)));
  const isUnlocked = (storyline: CampaignStoryline) => storyline.role === "main"
    || storyline.unlockClueIds.length === 0
    || storyline.unlockClueIds.some((clueId) => sharedClueIds.includes(clueId));
  const activeCount = Object.values(progressById).filter((progress) => progress.phase === "night").length;
  const reportCount = Object.values(progressById).filter((progress) => progress.phase === "morning").length;
  const mainStoryline = storylines.find((storyline) => storyline.role === "main") ?? storylines[0];
  const sideStorylines = storylines.filter((storyline) => storyline.role === "side");
  const visibleStorylines = locale === "en" ? [mainStoryline] : storylines;
  const sideStoryline = sideStorylines[0];
  const sideProgress = sideStoryline ? progressById[sideStoryline.id] : undefined;
  const sideUnlocked = sideStoryline ? isUnlocked(sideStoryline) : false;
  const sideHero = sideStoryline?.content.presentation.heroAssetId
    ? getAsset(sideStoryline.content.presentation.heroAssetId)
    : null;
  const completedConnections = sideStoryline?.connections.filter((connection) => (
    sharedClueIds.includes(connection.campaignClueId)
    && sideProgress?.clueIds.includes(connection.storylineClueId)
  )).length ?? 0;

  return (
    <section className="city-story-map-section city-chronicle-map-section">
      <div className="city-chronicle-heading">
        <div>
          <small>FOGLIGHT STORY MAP · LIVE CONTENT WORLD</small>
          <h1>{locale === "en" ? "Foglight City Chronicle" : "雾灯城纪事地图"}</h1>
          <p>{locale === "en"
            ? "Each thread advances through timed investigations and reaches its own ending. Lin Du can work on several threads at once; updates add storylines to this city instead of adding case numbers."
            : "每条主线与支线都由计时调查推进，并拥有自己的完结剧情。林渡可以同时推进多条线；版本更新往这座城市里补 storylet，不再增加案件编号。"}
          </p>
        </div>
        <dl>
          <div><dt>{locale === "en" ? "In progress" : "夜班进行中"}</dt><dd>{activeCount}</dd></div>
          <div><dt>{locale === "en" ? "Reports waiting" : "晨报待拆"}</dt><dd>{reportCount}</dd></div>
          <div><dt>{locale === "en" ? "Story threads" : "故事线"}</dt><dd>{storylines.length}</dd></div>
        </dl>
      </div>

      <div className="city-thread-shelf">
        {visibleStorylines.map((storyline) => {
          const progress = progressById[storyline.id];
          const unlocked = isUnlocked(storyline);
          return <article className={`${storyline.role} ${unlocked ? "unlocked" : "locked"} phase-${progress.phase}`} key={storyline.id}>
            <header>{progressIcon(progress)}<span><small>{storyline.role === "main" ? (locale === "en" ? "MAIN THREAD" : "雾灯城主线") : storyline.archiveLabel}</small><b>{storyline.title}</b></span></header>
            <p>{unlocked ? (locale === "en" && storyline.role === "main" ? "Trace Line 43 through timed investigations. Each returned report opens the next storylet without imposing a fixed night count." : storyline.teaser) : storyline.unlockHint}</p>
            <footer><span>{progressLabel(progress, locale === "en")} · {progress.completedActionIds.length}/{storyline.content.locations.length === 5 ? 5 : storyline.content.locations.flatMap((location) => location.actions).length}</span><button type="button" disabled={!unlocked} onClick={() => onOpenStoryline(storyline)}>{locale === "en" ? (progress.phase === "night" ? "View timer" : progress.phase === "morning" ? "Open report" : progress.started ? "Continue thread" : "Start thread") : (progress.phase === "night" ? "查看计时" : progress.phase === "morning" ? "拆开晨报" : progress.started ? "继续推进" : "开始这条线")} <ArrowRight /></button></footer>
          </article>;
        })}
        {locale === "en" && sideStoryline && <article className="side locale-locked"><header><KeyRound /><span><small>CHINESE STORYLINE</small><b>Lower-River Ward</b></span></header><p>This storyline belongs to the same city and is unlocked by evidence from the main thread. Its English edition is still in production.</p><footer><span>{sideUnlocked ? "Unlocked · Chinese edition" : "Hidden beneath the city map"}</span><button type="button" disabled={!sideUnlocked} onClick={() => onOpenStoryline(sideStoryline)}>Open Chinese edition <ArrowRight /></button></footer></article>}
      </div>

      <div className={`city-story-map ${sideUnlocked ? "storyline-unlocked" : "storyline-locked"}`}>
        <div className="city-story-map-water" aria-hidden="true" />
        <div className="city-story-map-core-label"><MapPinned /><span><small>MAIN THREAD · ROUTE 43</small><b>{mainStoryline.title}</b></span></div>
        {mainStoryline.content.locations.map((location) => {
          const progress = progressById[mainStoryline.id];
          const unlocked = progress.unlockedLocationIds.includes(location.id) || (!progress.started && location.order === 1);
          return <button type="button" className={`city-core-node interactive ${progress.visitedLocationIds.includes(location.id) ? "visited" : "unvisited"}`} style={{ left: `${4 + location.coordinates.x * .82}%`, top: `${8 + location.coordinates.y * .84}%` }} disabled={!unlocked} onClick={() => onOpenStoryline(mainStoryline)} key={location.id}><span>{String(location.order).padStart(2, "0")}</span><b>{unlocked ? location.name : locale === "en" ? "Awaiting evidence" : "证物尚未显影"}</b></button>;
        })}

        {locale !== "en" && sideStoryline && <>
          <div className="city-storyline-region" style={{ position: "absolute" }}>
            {sideHero && <Image src={sideHero.src} alt="" fill sizes="(max-width: 720px) 100vw, 65vw" />}
            <div className="city-storyline-wash" />
            <div className="city-storyline-title"><small>{sideStoryline.archiveLabel} · STORY THREAD</small><b>{sideUnlocked ? sideStoryline.title : "河下区尚未显影"}</b><p>{sideUnlocked ? sideStoryline.teaser : sideStoryline.unlockHint}</p></div>
          </div>
          {sideStoryline.content.locations.map((location) => (
            <button type="button" className={`city-storyline-node ${sideProgress?.visitedLocationIds.includes(location.id) ? "visited" : ""}`} style={{ left: `${47 + location.coordinates.x * .48}%`, top: `${8 + location.coordinates.y * .82}%` }} disabled={!sideUnlocked} onClick={() => onOpenStoryline(sideStoryline)} key={location.id}><span>{String(location.order).padStart(2, "0")}</span><b>{sideUnlocked ? location.name : "未显影"}</b></button>
          ))}
        </>}
      </div>

      {locale !== "en" && sideStoryline && <div className="city-thread-connections">
        <header><Link2 /><span><small>CROSS-THREAD INFERENCES · {completedConnections}/{sideStoryline.connections.length}</small><b>主线与河下区互相作证</b></span></header>
        <div>{sideStoryline.connections.map((connection) => {
          const campaignClue = mainStoryline.content.clues.find((clue) => clue.id === connection.campaignClueId)!;
          const storylineClue = sideStoryline.content.clues.find((clue) => clue.id === connection.storylineClueId)!;
          const sourceReady = sharedClueIds.includes(connection.campaignClueId);
          const targetReady = sideProgress?.clueIds.includes(connection.storylineClueId) ?? false;
          return <article className={sourceReady && targetReady ? "connected" : sourceReady ? "half-connected" : "locked"} key={`${connection.campaignClueId}:${connection.storylineClueId}`}><small>{connection.label}</small><div><b>{sourceReady ? campaignClue.title : "主线证物未归档"}</b><ArrowRight /><b>{targetReady ? storylineClue.title : "河下区证物待追查"}</b></div><p>{sourceReady && targetReady ? connection.inference : sourceReady ? "这条主线证物正在把地图指向河下区。" : sideStoryline.unlockHint}</p></article>;
        })}</div>
      </div>}
    </section>
  );
}
