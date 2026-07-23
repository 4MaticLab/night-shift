"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Archive, ChevronRight, Coffee, Gift, Moon, RotateCcw, Search, Sparkles, X, Zap } from "lucide-react";
import { useGameStore } from "@/src/stores/game-store";
import { useI18n } from "@/src/i18n/provider";
import type { GameView } from "./types";
import { SleepHardwareStatus } from "./sleep-hardware";

export function TopBar({ chapter, onDemo, onHome, onHardware }: { chapter: number; onDemo: () => void; onHome: () => void; onHardware: () => void }) {
  useGameStore((state) => state.campaignId);
  const { campaign, locale, t } = useI18n();
  return (
    <header className="topbar">
      <button className="brand-mark compact" onClick={onHome}><span aria-hidden="true" /><div><b>{t("夜班侦探")}</b><small>NIGHT SHIFT</small></div></button>
      <div className="case-heading"><small>CASE {campaign.presentation.archiveNumber} · {locale === "en" ? `NIGHT ${chapter}` : `第 ${chapter} 夜`}</small><b>{campaign.case.title}</b></div>
      <div className="topbar-actions"><SleepHardwareStatus onOpen={onHardware} /><button className="demo-pill" onClick={onDemo}><Zap size={14} /> DEMO</button></div>
    </header>
  );
}

export function BottomNav({ view, setView }: { view: GameView; setView: (view: GameView) => void }) {
  const { t } = useI18n();
  const items: [GameView, ReactNode, string][] = [
    ["report", <Coffee key="c" />, t("今晨")], ["board", <Search key="s" />, t("案件板")], ["tonight", <Moon key="m" />, t("今晚")], ["collection", <Gift key="g" />, t("收藏")], ["archive", <Archive key="a" />, t("档案")],
  ];
  return <nav className="bottom-nav" aria-label={t("主要导航")}>{items.map(([id, icon, label]) => <button type="button" aria-current={view === id ? "page" : undefined} className={view === id ? "active" : ""} key={id} onClick={() => setView(id)}>{icon}<span>{label}</span></button>)}</nav>;
}

export function DemoDrawer({ onClose, setView }: { onClose: () => void; setView: (view: GameView) => void }) {
  const { jumpToChapter, unlockBoard, reset } = useGameStore();
  const { campaign, locale, t } = useI18n();
  const finalChapter = campaign.case.chapters.at(-1)!.number;
  return <><motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} /><motion.aside className="demo-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}><div className="drawer-header"><div><small>DEMO MODE · CASE {campaign.presentation.archiveNumber}</small><h2>{t("演示控制台")}</h2></div><button onClick={onClose}><X /></button></div><p>{locale === "en" ? `Browse all ${campaign.case.chapters.length} nights of ${campaign.case.title} in a few minutes.` : `用几分钟浏览《${campaign.case.title}》完整 ${campaign.case.chapters.length} 夜剧情。`} {locale === "en" ? "Shortcut:" : "快捷键："}<kbd>Shift</kbd> + <kbd>D</kbd></p><div className="demo-section"><small>{t("跳到章节")}</small><div className="chapter-jumps">{campaign.case.chapters.map((chapter) => <button key={chapter.number} onClick={() => { jumpToChapter(chapter.number); setView("tonight"); onClose(); }}><b>0{chapter.number}</b><span>{chapter.title}</span></button>)}</div></div><div className="demo-section"><small>{t("现场演示")}</small><button className="drawer-action" onClick={() => { unlockBoard(); setView("board"); onClose(); }}><Search /> {t("解锁完整案件板")} <ChevronRight /></button><button className="drawer-action" onClick={() => { jumpToChapter(finalChapter); unlockBoard(true); setView("tonight"); onClose(); }}><Sparkles /> {t("跳到真结局条件")} <ChevronRight /></button></div><button className="reset-button" onClick={() => { reset(); onClose(); }}><RotateCcw /> {t("重置当前案件存档")}</button></motion.aside></>;
}
