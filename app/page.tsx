"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import { Hero, Intro } from "@/src/components/game/landing";
import { ArchivePage, CaseBoard, Collection, Ending } from "@/src/components/game/investigation";
import { EmptyReport, MorningReport, NightRun, Tonight } from "@/src/components/game/night-cycle";
import { BottomNav, DemoDrawer, TopBar } from "@/src/components/game/shell";
import type { GameView } from "@/src/components/game/types";
import { useGameStore } from "@/src/stores/game-store";

const subscribeToHydration = () => () => undefined;

export default function HomePage() {
  const game = useGameStore();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [intro, setIntro] = useState(false);
  const [view, setView] = useState<GameView>(game.phase === "morning" ? "report" : "tonight");
  const [demo, setDemo] = useState(false);
  const activeView: GameView = game.phase === "morning" && view === "tonight" ? "report" : view;

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

  if (!game.started && !intro) {
    return <><Hero interactive={hydrated} onStart={() => setIntro(true)} onDemo={() => { game.begin(); setDemo(true); }} /><AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={changeView} />}</AnimatePresence></>;
  }
  if (intro && !game.started) return <Intro onDone={() => { game.begin(); setIntro(false); }} />;
  if (game.phase === "night") return <NightRun onFinish={game.finishNight} />;
  if (game.phase === "ending") return <Ending />;

  return (
    <div className="app-shell">
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
    </div>
  );
}
