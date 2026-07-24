"use client";

import { useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { Check, Link2, QrCode, X } from "lucide-react";
import type { Clue, EvidenceSynthesis } from "@/src/lib/game-engine/schema";
import { useAccessibleDialog } from "@/src/lib/use-accessible-dialog";
import { useI18n } from "@/src/i18n/provider";

function EvidenceLetterLayer({
  children,
  labelledBy,
  onClose,
}: {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useAccessibleDialog(dialogRef, onClose);

  return <motion.div
    className="evidence-letter-scrim"
    data-dialog-layer
    role="presentation"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <motion.section
      ref={dialogRef}
      className="evidence-letter"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      initial={{ opacity: 0, y: 22, scale: .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: .98 }}
    >
      {children}
    </motion.section>
  </motion.div>;
}

export function ClueDossierDialog({
  clue,
  received,
  syntheses,
  detectiveName,
  onClose,
  onShare,
}: {
  clue: Clue;
  received: boolean;
  syntheses: EvidenceSynthesis[];
  detectiveName: string;
  onClose: () => void;
  onShare: () => void;
}) {
  const { t } = useI18n();

  return <EvidenceLetterLayer labelledBy="evidence-dossier-title" onClose={onClose}>
    <button className="evidence-letter-close" type="button" data-dialog-initial-focus aria-label={t("关闭证物档案")} onClick={onClose}><X /></button>
    <div className="evidence-letter-seal" aria-hidden="true"><span /><span /></div>
    <header className="evidence-letter-head">
      <small>OPEN DOSSIER · NIGHT 0{clue.chapter}</small>
      <span>{clue.type.toUpperCase()}{received ? ` · ${t("好友送达")}` : ""}</span>
      <h2 id="evidence-dossier-title">{clue.title}</h2>
    </header>
    <button className="evidence-letter-share" type="button" onClick={onShare}><QrCode /> {t("送给好友")}</button>
    <p className="evidence-letter-body">{clue.detail}</p>
    <blockquote className="evidence-letter-quote"><small>{t("城市异议")}</small>“{clue.cityObjection}”</blockquote>
    <div className="evidence-letter-note"><small>{detectiveName} · {t("页边批注")}</small>{clue.marginNote}</div>
    {syntheses.length > 0 && <footer className="evidence-letter-footer">
      <small>{t("这份证物已经参与作证")}</small>
      {syntheses.map((synthesis) => <b key={synthesis.id}><Link2 /> {synthesis.title}</b>)}
    </footer>}
  </EvidenceLetterLayer>;
}

export function SynthesisRevealDialog({
  synthesis,
  inputTitles,
  onClose,
}: {
  synthesis: EvidenceSynthesis;
  inputTitles: string[];
  onClose: () => void;
}) {
  const { locale, t } = useI18n();

  return <EvidenceLetterLayer labelledBy="evidence-relation-title" onClose={onClose}>
    <button className="evidence-letter-close" type="button" data-dialog-initial-focus aria-label={t("关闭核心推论")} onClick={onClose}><X /></button>
    <div className="evidence-letter-seal confirmed" aria-hidden="true"><span /><Check /></div>
    <header className="evidence-letter-head">
      <small>CORE INFERENCE · {t("核心推论")}</small>
      <span>FILED · {locale === "en" ? "SYNTHESIS COMPLETE" : "推论已归档"}</span>
      <h2 id="evidence-relation-title">{synthesis.title}</h2>
    </header>
    <div className="evidence-letter-inputs" aria-label={locale === "en" ? "Evidence used" : "采用的证物"}>
      {inputTitles.map((title, index) => <span key={`${index}-${title}`}>{index > 0 && <i aria-hidden="true">+</i>}<b>{title}</b></span>)}
    </div>
    <p className="evidence-letter-body">{synthesis.explanation}</p>
    <footer className="evidence-letter-footer soft">
      <small>{locale === "en" ? "This inference is now a searchable case file and may support a later synthesis." : "这条推论已经进入可检索档案，也可以继续作为后续推理的证物。"}</small>
    </footer>
  </EvidenceLetterLayer>;
}
