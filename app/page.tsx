"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { Hero, Intro } from "@/src/components/game/landing";
import { BottomNav, DemoDrawer, TopBar } from "@/src/components/game/shell";
import type { GameView } from "@/src/components/game/types";
import { useGameStore } from "@/src/stores/game-store";
import { ClueGiftNotice, type ClueGiftNoticeData } from "@/src/components/game/clue-sharing";
import { readSharedClueQuery, removeSharedClueQuery } from "@/src/lib/game-engine/clue-sharing";
import { getCampaign } from "@/src/content/campaigns/registry";
import { getAsset } from "@/src/content/assets";
import { I18nProvider, useI18n } from "@/src/i18n/provider";
import { AppBootBoundary, GameSectionLoading } from "@/src/components/game/loading-screen";

const subscribeToHydration = () => () => undefined;
const dynamicLoading = () => <GameSectionLoading />;

const ArchivePage = dynamic(() => import("@/src/components/game/investigation").then((module) => module.ArchivePage), { loading: dynamicLoading });
const CaseBoard = dynamic(() => import("@/src/components/game/investigation").then((module) => module.CaseBoard), { loading: dynamicLoading });
const Collection = dynamic(() => import("@/src/components/game/investigation").then((module) => module.Collection), { loading: dynamicLoading });
const Ending = dynamic(() => import("@/src/components/game/investigation").then((module) => module.Ending), { loading: dynamicLoading });
const EmptyReport = dynamic(() => import("@/src/components/game/night-cycle").then((module) => module.EmptyReport), { loading: dynamicLoading });
const MorningReport = dynamic(() => import("@/src/components/game/night-cycle").then((module) => module.MorningReport), { loading: dynamicLoading });
const NightRun = dynamic(() => import("@/src/components/game/night-cycle").then((module) => module.NightRun), { loading: dynamicLoading });
const Tonight = dynamic(() => import("@/src/components/game/night-cycle").then((module) => module.Tonight), { loading: dynamicLoading });
const SandboxCase = dynamic(() => import("@/src/components/game/sandbox-case").then((module) => module.SandboxCase), { loading: dynamicLoading });
const SleepHardwarePanel = dynamic(() => import("@/src/components/game/sleep-hardware").then((module) => module.SleepHardwarePanel));

export default function HomePage() {
  const campaignId = useGameStore((state) => state.campaignId);
  const campaign = getCampaign(campaignId);
  const heroSrc = getAsset(campaign.presentation.heroAssetId).src;
  return <I18nProvider campaignId={campaignId}><AppBootBoundary heroSrc={heroSrc}><GamePage /></AppBootBoundary></I18nProvider>;
}

function GamePage() {
  const game = useGameStore();
  const { campaign, localize, t } = useI18n();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [intro, setIntro] = useState(false);
  const [view, setView] = useState<GameView>(game.phase === "morning" ? "report" : "tonight");
  const [demo, setDemo] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [clueGiftNotice, setClueGiftNotice] = useState<ClueGiftNoticeData | null>(null);
  const [hardwareOpen, setHardwareOpen] = useState(false);
  const processedClueQuery = useRef(false);
  const sandboxContent = campaign.format === "sandbox-expedition" ? campaign.sandbox : undefined;
  const activeView: GameView = game.phase === "morning" && view === "tonight" ? "report" : view;
  const receiveSharedClue = game.receiveSharedClue;
  const switchCampaign = game.switchCampaign;

  const changeView = (nextView: GameView) => {
    if (nextView === activeView) window.scrollTo({ top: 0, left: 0 });
    setView(nextView);
  };

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [activeView]);

  useEffect(() => {
    const toggleDemo = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === "d") setDemo((value) => !value);
    };
    window.addEventListener("keydown", toggleDemo);
    return () => window.removeEventListener("keydown", toggleDemo);
  }, []);

  useEffect(() => {
    if (!hydrated || processedClueQuery.current) return;
    const shared = readSharedClueQuery(window.location.search);
    if (!shared.present) {
      processedClueQuery.current = true;
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || processedClueQuery.current) return;
      processedClueQuery.current = true;
      if (!shared.clue || !shared.campaignId) {
        setClueGiftNotice({ kind: "error", title: t("这封线索无法归档"), message: t("链接中的线索编号不存在或已经失效；你的存档没有发生变化。") });
      } else {
        switchCampaign(shared.campaignId);
        const result = receiveSharedClue(shared.clue.id);
        const sharedClue = localize(shared.clue);
        const notices: Record<typeof result, ClueGiftNoticeData> = {
          received: { kind: "success", title: `${t("好友送来")}「${sharedClue.title}」`, message: t("证物已经放进案件板，并标记为“好友送达”。") },
          "already-received": { kind: "info", title: `「${sharedClue.title}」${t("已经收过")}`, message: t("案件板保留原来那一张，没有重复写入。") },
          "already-owned": { kind: "info", title: `${t("你已经找到")}「${sharedClue.title}」`, message: t("这封线索没有覆盖你的调查记录，也没有重复写入。") },
          invalid: { kind: "error", title: t("这封线索无法归档"), message: t("链接中的线索编号不存在或已经失效；你的存档没有发生变化。") },
        };
        setClueGiftNotice(notices[result]);
        if (result !== "invalid") {
          setIntro(false);
          setLibraryOpen(false);
          setView("board");
        }
      }
      window.history.replaceState(window.history.state, "", removeSharedClueQuery(window.location.href));
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, localize, receiveSharedClue, switchCampaign, t]);

  const clueNotice = <AnimatePresence>{clueGiftNotice && <ClueGiftNotice notice={clueGiftNotice} onClose={() => setClueGiftNotice(null)} />}</AnimatePresence>;
  const hardwarePanel = <AnimatePresence>{hardwareOpen && <SleepHardwarePanel onClose={() => setHardwareOpen(false)} />}</AnimatePresence>;

  if (libraryOpen || (!game.started && !intro)) {
    return <>{clueNotice}<Hero interactive={hydrated} onStart={() => { setLibraryOpen(false); if (game.started || sandboxContent) { if (!game.started) game.begin(); setIntro(false); } else setIntro(true); }} onDemo={() => { game.begin(); setLibraryOpen(false); if (!sandboxContent) setDemo(true); }} /><AnimatePresence>{demo && !sandboxContent && <DemoDrawer onClose={() => setDemo(false)} setView={changeView} />}</AnimatePresence></>;
  }
  if (sandboxContent) return <>{clueNotice}<SandboxCase campaignId={campaign.id} content={sandboxContent} onHome={() => { setLibraryOpen(true); setIntro(false); }} onHardware={() => setHardwareOpen(true)} />{hardwarePanel}</>;
  if (intro && !game.started) return <>{clueNotice}<Intro onDone={() => { game.begin(); setIntro(false); }} /></>;
  if (game.phase === "night") return <>{clueNotice}<NightRun onFinish={game.finishNight} onHardware={() => setHardwareOpen(true)} />{hardwarePanel}</>;
  if (game.phase === "ending") return <>{clueNotice}<Ending onOpenLibrary={() => setLibraryOpen(true)} /></>;

  return (
    <><div className="app-shell">
      <TopBar chapter={game.chapter} onDemo={() => setDemo(true)} onHome={() => { setLibraryOpen(true); setIntro(false); }} onHardware={() => setHardwareOpen(true)} />
      <main className="app-content">
        {activeView === "tonight" && <Tonight onLaunch={game.startNight} onHardware={() => setHardwareOpen(true)} />}
        {activeView === "report" && (game.phase === "morning" ? <MorningReport onContinue={() => { game.continueDay(); changeView(game.chapter >= getCampaign(game.campaignId).case.chapters.at(-1)!.number ? "tonight" : "board"); }} onHardware={() => setHardwareOpen(true)} /> : <EmptyReport setView={changeView} />)}
        {activeView === "board" && <CaseBoard />}
        {activeView === "collection" && <Collection />}
        {activeView === "archive" && <ArchivePage />}
      </main>
      <BottomNav view={activeView} setView={changeView} />
      <AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={changeView} />}</AnimatePresence>
    </div>{clueNotice}{hardwarePanel}</>
  );
}
