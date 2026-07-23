"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import { Hero, Intro } from "@/src/components/game/landing";
import { ArchivePage, CaseBoard, Collection, Ending } from "@/src/components/game/investigation";
import { EmptyReport, MorningReport, NightRun, Tonight } from "@/src/components/game/night-cycle";
import { BottomNav, DemoDrawer, TopBar } from "@/src/components/game/shell";
import type { GameView } from "@/src/components/game/types";
import { useGameStore } from "@/src/stores/game-store";
import { ClueGiftNotice, type ClueGiftNoticeData } from "@/src/components/game/clue-sharing";
import { readSharedClueQuery, removeSharedClueQuery } from "@/src/lib/game-engine/clue-sharing";

const subscribeToHydration = () => () => undefined;

export default function HomePage() {
  const game = useGameStore();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [intro, setIntro] = useState(false);
  const [view, setView] = useState<GameView>(game.phase === "morning" ? "report" : "tonight");
  const [demo, setDemo] = useState(false);
  const [clueGiftNotice, setClueGiftNotice] = useState<ClueGiftNoticeData | null>(null);
  const processedClueQuery = useRef(false);
  const activeView: GameView = game.phase === "morning" && view === "tonight" ? "report" : view;
  const receiveSharedClue = game.receiveSharedClue;

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
      if (!shared.clue) {
        setClueGiftNotice({ kind: "error", title: "这封线索无法归档", message: "链接中的线索编号不存在或已经失效；你的存档没有发生变化。" });
      } else {
        const result = receiveSharedClue(shared.clue.id);
        const notices: Record<typeof result, ClueGiftNoticeData> = {
          received: { kind: "success", title: `好友送来「${shared.clue.title}」`, message: "证物已经放进案件板，并标记为“好友送达”。" },
          "already-received": { kind: "info", title: `「${shared.clue.title}」已经收过`, message: "案件板保留原来那一张，没有重复写入。" },
          "already-owned": { kind: "info", title: `你已经找到「${shared.clue.title}」`, message: "这封线索没有覆盖你的调查记录，也没有重复写入。" },
          invalid: { kind: "error", title: "这封线索无法归档", message: "链接中的线索编号不存在或已经失效；你的存档没有发生变化。" },
        };
        setClueGiftNotice(notices[result]);
        if (result !== "invalid") {
          setIntro(false);
          setView("board");
        }
      }
      window.history.replaceState(window.history.state, "", removeSharedClueQuery(window.location.href));
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, receiveSharedClue]);

  const clueNotice = <AnimatePresence>{clueGiftNotice && <ClueGiftNotice notice={clueGiftNotice} onClose={() => setClueGiftNotice(null)} />}</AnimatePresence>;

  if (!game.started && !intro) {
    return <>{clueNotice}<Hero interactive={hydrated} onStart={() => setIntro(true)} onDemo={() => { game.begin(); setDemo(true); }} /><AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={changeView} />}</AnimatePresence></>;
  }
  if (intro && !game.started) return <>{clueNotice}<Intro onDone={() => { game.begin(); setIntro(false); }} /></>;
  if (game.phase === "night") return <>{clueNotice}<NightRun onFinish={game.finishNight} /></>;
  if (game.phase === "ending") return <>{clueNotice}<Ending /></>;

  return (
    <><div className="app-shell">
      <TopBar chapter={game.chapter} onDemo={() => setDemo(true)} onHome={() => { game.reset(); setIntro(false); }} />
      <main className="app-content">
        {activeView === "tonight" && <Tonight onLaunch={game.startNight} />}
        {activeView === "report" && (game.phase === "morning" ? <MorningReport onContinue={() => { game.continueDay(); changeView(game.chapter >= 5 ? "tonight" : "board"); }} /> : <EmptyReport setView={changeView} />)}
        {activeView === "board" && <CaseBoard />}
        {activeView === "collection" && <Collection />}
        {activeView === "archive" && <ArchivePage />}
      </main>
      <BottomNav view={activeView} setView={changeView} />
      <AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={changeView} />}</AnimatePresence>
    </div>{clueNotice}</>
  );
}
