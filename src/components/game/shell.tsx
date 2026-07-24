"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Archive, ChevronRight, Coffee, Gift, Moon, RotateCcw, Search, Sparkles, X, Zap } from "lucide-react";
import { useGameStore } from "@/src/stores/game-store";
import { useI18n } from "@/src/i18n/provider";
import type { GameView } from "./types";
import { SleepHardwareStatus } from "./sleep-hardware-status";
import { useAccessibleDialog } from "@/src/lib/use-accessible-dialog";
import { getReadyEvidenceSyntheses } from "@/src/lib/game-engine/evidence-synthesis";

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
  const { unlockedClueIds, synthesizedEvidenceIds } = useGameStore();
  const { campaign, locale, t } = useI18n();
  const readyCount = getReadyEvidenceSyntheses({
    syntheses: campaign.syntheses,
    unlockedClueIds,
    synthesizedEvidenceIds,
  }).length;
  const items: [GameView, ReactNode, string][] = [
    ["report", <Coffee key="c" />, t("今晨")], ["board", <Search key="s" />, t("案件板")], ["tonight", <Moon key="m" />, t("今晚")], ["collection", <Gift key="g" />, t("收藏")], ["archive", <Archive key="a" />, t("档案")],
  ];
  return <nav className="bottom-nav" aria-label={t("主要导航")}>{items.map(([id, icon, label]) => <button type="button" aria-current={view === id ? "page" : undefined} className={view === id ? "active" : ""} key={id} onClick={() => setView(id)}>{icon}<span>{label}</span>{id === "board" && readyCount > 0 && <i className="nav-ready-badge" aria-label={locale === "en" ? `${readyCount} inferences ready` : `${readyCount} 条推论可以整理`}>{readyCount}</i>}</button>)}</nav>;
}

export function DemoDrawer({ onClose, setView }: { onClose: () => void; setView: (view: GameView) => void }) {
  const { begin, jumpToChapter, unlockBoard, reset } = useGameStore();
  const { campaign, locale, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const confirmationRef = useRef<HTMLButtonElement>(null);
  const [pendingAction, setPendingAction] = useState<{ title: string; note: string; confirmLabel: string; run: () => void } | null>(null);
  const finalChapter = campaign.case.chapters.at(-1)!.number;
  useAccessibleDialog(dialogRef, onClose);

  useEffect(() => {
    if (!pendingAction) return;
    const frame = window.requestAnimationFrame(() => confirmationRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pendingAction]);

  const confirmPendingAction = () => {
    const action = pendingAction;
    setPendingAction(null);
    action?.run();
  };

  return <motion.div className="demo-layer" data-dialog-layer initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}>
    <motion.button type="button" tabIndex={-1} aria-label={locale === "en" ? "Close demo controls" : "关闭演示控制台"} className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside ref={dialogRef} className="demo-drawer" role="dialog" aria-modal="true" aria-labelledby="demo-drawer-title" aria-describedby="demo-drawer-description demo-impact-note" tabIndex={-1} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}>
      <div className="drawer-header"><div><small>DEMO MODE · CASE {campaign.presentation.archiveNumber}</small><h2 id="demo-drawer-title">{t("演示控制台")}</h2></div><button type="button" data-dialog-initial-focus aria-label={locale === "en" ? "Close demo controls" : "关闭演示控制台"} onClick={onClose}><X /></button></div>
      <p id="demo-drawer-description">{locale === "en" ? `Browse all ${campaign.case.chapters.length} nights of ${campaign.case.title} in a few minutes.` : `用几分钟浏览《${campaign.case.title}》完整 ${campaign.case.chapters.length} 夜剧情。`} {locale === "en" ? "Shortcut:" : "快捷键："}<kbd>Shift</kbd> + <kbd>D</kbd></p>
      <div id="demo-impact-note" className="demo-impact-note"><Sparkles /><div><b>{locale === "en" ? "Opening this desk changes nothing." : "只打开控制台，不会改动存档。"}</b><p>{locale === "en" ? "A shortcut replaces this case with a staged demo snapshot only after you confirm it. Saves for every other case remain untouched." : "选择快捷操作后，会先向你确认，再把当前案件替换成演示快照；其他案件的独立存档不会改变。"}</p></div></div>
      <div className="demo-section"><small>{t("跳到章节")}</small><div className="chapter-jumps">{campaign.case.chapters.map((chapter) => <button type="button" disabled={Boolean(pendingAction)} key={chapter.number} onClick={() => setPendingAction({
        title: locale === "en" ? `Stage Night ${chapter.number}: ${chapter.title}?` : `切到第 ${chapter.number} 夜「${chapter.title}」？`,
        note: locale === "en" ? "This replaces the current case progress with a deterministic demo snapshot at the start of this night." : "这会把当前案件进度替换成该夜开始时的固定演示快照。",
        confirmLabel: locale === "en" ? `Stage Night ${chapter.number}` : `确认切到第 ${chapter.number} 夜`,
        run: () => { jumpToChapter(chapter.number); setView("tonight"); onClose(); },
      })}><b>0{chapter.number}</b><span>{chapter.title}</span></button>)}</div></div>
      <div className="demo-section"><small>{t("现场演示")}</small><button type="button" disabled={Boolean(pendingAction)} className="drawer-action" onClick={() => setPendingAction({
        title: locale === "en" ? "Stage the complete caseboard?" : "载入完整案件板演示？",
        note: locale === "en" ? "This fills the current case with a staged evidence snapshot so every inference can be demonstrated." : "这会用固定证物快照改写当前案件，便于现场演示全部推论合成。",
        confirmLabel: locale === "en" ? "Stage the caseboard" : "确认载入案件板",
        run: () => { begin(); unlockBoard(); setView("board"); onClose(); },
      })}><Search /> {t("解锁完整案件板")} <ChevronRight /></button><button type="button" disabled={Boolean(pendingAction)} className="drawer-action" onClick={() => setPendingAction({
        title: locale === "en" ? "Stage the true-ending conditions?" : "载入真结局条件演示？",
        note: locale === "en" ? "This replaces the current case with a final-night snapshot containing the evidence and inferences needed for the ending demo." : "这会把当前案件替换为最终夜快照，并写入演示结局所需的证物与推论。",
        confirmLabel: locale === "en" ? "Stage the ending demo" : "确认载入结局演示",
        run: () => { jumpToChapter(finalChapter); unlockBoard(true); setView("tonight"); onClose(); },
      })}><Sparkles /> {t("跳到真结局条件")} <ChevronRight /></button></div>
      <button type="button" disabled={Boolean(pendingAction)} className="reset-button" onClick={() => setPendingAction({
        title: locale === "en" ? "Reset this case save?" : "重置当前案件存档？",
        note: locale === "en" ? "This permanently clears progress for this case on this browser. Every other case save remains untouched." : "这会永久清除当前浏览器里的本案件进度；其他案件的独立存档不会改变。",
        confirmLabel: locale === "en" ? "Reset this case" : "确认重置当前案件",
        run: () => { reset(); onClose(); },
      })}><RotateCcw /> {t("重置当前案件存档")}</button>
      {pendingAction && <div className="demo-confirmation" role="alert" aria-live="assertive"><small>CONFIRM LOCAL SAVE CHANGE</small><h3>{pendingAction.title}</h3><p>{pendingAction.note}</p><div><button ref={confirmationRef} type="button" onClick={() => setPendingAction(null)}>{locale === "en" ? "Cancel" : "取消"}</button><button type="button" className="danger" onClick={confirmPendingAction}>{pendingAction.confirmLabel}</button></div></div>}
    </motion.aside>
  </motion.div>;
}
