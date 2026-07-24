"use client";

import { useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { Check, Link2, QrCode, X } from "lucide-react";
import type { Clue, EvidenceRelation } from "@/src/lib/game-engine/schema";
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
  relations,
  detectiveName,
  onClose,
  onShare,
}: {
  clue: Clue;
  received: boolean;
  relations: EvidenceRelation[];
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
    {relations.length > 0 && <footer className="evidence-letter-footer">
      <small>{t("这份证物已经参与作证")}</small>
      {relations.map((relation) => <b key={relation.id}><Link2 /> {relation.statement}</b>)}
    </footer>}
  </EvidenceLetterLayer>;
}

export function RelationRevealDialog({
  relation,
  onClose,
}: {
  relation: EvidenceRelation;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return <EvidenceLetterLayer labelledBy="evidence-relation-title" onClose={onClose}>
    <button className="evidence-letter-close" type="button" data-dialog-initial-focus aria-label={t("关闭核心推论")} onClick={onClose}><X /></button>
    <div className="evidence-letter-seal confirmed" aria-hidden="true"><span /><Check /></div>
    <header className="evidence-letter-head">
      <small>CORE INFERENCE · {t("核心推论")}</small>
      <span>CONFIRMED · {t("核对成立")}</span>
      <h2 id="evidence-relation-title">{relation.statement}</h2>
    </header>
    <p className="evidence-letter-body">{relation.explanation}</p>
    <footer className="evidence-letter-footer soft">
      <small>{t("论断已经归入屏幕底端的核心推论栏，并在案件板上留下连线。")}</small>
    </footer>
  </EvidenceLetterLayer>;
}
