"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { useI18n } from "@/src/i18n/provider";

export function CasePrologue({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { campaign, t } = useI18n();
  const [step, setStep] = useState(0);
  const scenes = campaign.presentation.prologue.scenes;
  const scene = scenes[step];
  const art = getAsset(scene.assetId);
  const isLast = step === scenes.length - 1;

  return (
    <motion.main className="case-prologue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <AnimatePresence mode="wait">
        <motion.div
          className="case-prologue-art"
          key={scene.assetId}
          initial={{ opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .55, ease: "easeOut" }}
        >
          <Image src={art.src} alt={art.alt} fill priority sizes="100vw" />
        </motion.div>
      </AnimatePresence>
      <div className="case-prologue-vignette" />

      <header className="case-prologue-header">
        <button type="button" onClick={onBack}><ArrowLeft /> <span>{t("返回案件库")}</span></button>
        <div>
          <small>CASE {campaign.presentation.archiveNumber} · INTAKE</small>
          <b>{campaign.case.title}</b>
        </div>
        <span>0{step + 1} / 0{scenes.length}</span>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          className="case-prologue-copy"
          key={scene.stage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: .34, ease: "easeOut" }}
        >
          <div className="case-prologue-stage"><span>0{step + 1}</span><i />{scene.eyebrow}</div>
          <h1>{scene.title}</h1>
          <p>{scene.body}</p>
          <blockquote>{scene.aside}</blockquote>
          {isLast && <div className="case-prologue-shift-rule"><span>{t("你负责白天推理")}</span><i /><span>{campaign.presentation.detectiveName}{t("负责夜晚调查")}</span></div>}
        </motion.section>
      </AnimatePresence>

      <footer className="case-prologue-footer">
        <div className="case-prologue-dots" aria-label={t("案件导入进度")}>
          {scenes.map((item, index) => <i className={index === step ? "active" : index < step ? "passed" : ""} key={item.stage} />)}
        </div>
        <div className="case-prologue-actions">
          {step > 0 && <button type="button" className="prologue-back-button" onClick={() => setStep(step - 1)}><ChevronLeft /> {t("上一幕")}</button>}
          <button type="button" className="primary-button" onClick={() => isLast ? onDone() : setStep(step + 1)}>
            {isLast ? campaign.presentation.prologue.acceptLabel : t("继续")}<ChevronRight />
          </button>
        </div>
      </footer>
    </motion.main>
  );
}
