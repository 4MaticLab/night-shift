"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Archive, ChevronRight, Coffee, Gift, Moon, RotateCcw, Search, Sparkles, X, Zap } from "lucide-react";
import { nightShiftCase } from "@/src/content/case";
import { useGameStore } from "@/src/stores/game-store";
import type { GameView } from "./types";

export function TopBar({ chapter, onDemo, onHome }: { chapter: number; onDemo: () => void; onHome: () => void }) {
  return (
    <header className="topbar">
      <button className="brand-mark compact" onClick={onHome}><span>NS</span><div><b>夜班侦探</b><small>NIGHT SHIFT</small></div></button>
      <div className="case-heading"><small>CASE 001 · 第 {chapter} 夜</small><b>{nightShiftCase.title}</b></div>
      <button className="demo-pill" onClick={onDemo}><Zap size={14} /> DEMO</button>
    </header>
  );
}

export function BottomNav({ view, setView }: { view: GameView; setView: (view: GameView) => void }) {
  const items: [GameView, ReactNode, string][] = [
    ["report", <Coffee key="c" />, "今晨"], ["board", <Search key="s" />, "案件板"], ["tonight", <Moon key="m" />, "今晚"], ["collection", <Gift key="g" />, "收藏"], ["archive", <Archive key="a" />, "档案"],
  ];
  return <nav className="bottom-nav">{items.map(([id, icon, label]) => <button className={view === id ? "active" : ""} key={id} onClick={() => setView(id)}>{icon}<span>{label}</span></button>)}</nav>;
}

export function DemoDrawer({ onClose, setView }: { onClose: () => void; setView: (view: GameView) => void }) {
  const { jumpToChapter, unlockBoard, reset } = useGameStore();
  return <><motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} /><motion.aside className="demo-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}><div className="drawer-header"><div><small>DEMO MODE</small><h2>演示控制台</h2></div><button onClick={onClose}><X /></button></div><p>用几分钟浏览完整五夜剧情。快捷键：<kbd>Shift</kbd> + <kbd>D</kbd></p><div className="demo-section"><small>跳到章节</small><div className="chapter-jumps">{nightShiftCase.chapters.map((chapter) => <button key={chapter.number} onClick={() => { jumpToChapter(chapter.number); setView("tonight"); onClose(); }}><b>0{chapter.number}</b><span>{chapter.title}</span></button>)}</div></div><div className="demo-section"><small>现场演示</small><button className="drawer-action" onClick={() => { unlockBoard(); setView("board"); onClose(); }}><Search /> 解锁完整案件板 <ChevronRight /></button><button className="drawer-action" onClick={() => { jumpToChapter(5); unlockBoard(true); setView("tonight"); onClose(); }}><Sparkles /> 跳到真结局条件 <ChevronRight /></button></div><button className="reset-button" onClick={() => { reset(); onClose(); }}><RotateCcw /> 重置本地存档</button></motion.aside></>;
}
