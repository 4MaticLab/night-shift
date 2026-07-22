"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
  const [view, setView] = useState<GameView>("tonight");
  const [demo, setDemo] = useState(false);
  const activeView: GameView = game.phase === "morning" ? "report" : view;

  useEffect(() => {
    const toggleDemo = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === "d") setDemo((value) => !value);
    };
    window.addEventListener("keydown", toggleDemo);
    return () => window.removeEventListener("keydown", toggleDemo);
  }, []);

  if (!game.started && !intro) {
    return <><Hero interactive={hydrated} onStart={() => setIntro(true)} onDemo={() => { game.begin(); setDemo(true); }} /><AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={setView} />}</AnimatePresence></>;
  }
  if (intro && !game.started) return <Intro onDone={() => { game.begin(); setIntro(false); }} />;
  if (game.phase === "night") return <NightRun onFinish={game.finishNight} />;
  if (game.phase === "ending") return <Ending />;

  return (
    <div className="app-shell">
      <TopBar chapter={game.chapter} onDemo={() => setDemo(true)} onHome={() => { game.reset(); setIntro(false); }} />
      <main className="app-content">
        {activeView === "tonight" && <Tonight onLaunch={game.startNight} />}
        {activeView === "report" && (game.phase === "morning" ? <MorningReport onContinue={() => { game.continueDay(); setView(game.chapter >= 5 ? "tonight" : "board"); }} /> : <EmptyReport setView={setView} />)}
        {activeView === "board" && <CaseBoard />}
        {activeView === "collection" && <Collection />}
        {activeView === "archive" && <ArchivePage />}
      </main>
      <BottomNav view={activeView} setView={setView} />
      <AnimatePresence>{demo && <DemoDrawer onClose={() => setDemo(false)} setView={setView} />}</AnimatePresence>
    </div>
  );
}
