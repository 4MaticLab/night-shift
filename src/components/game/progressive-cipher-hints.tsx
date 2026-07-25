"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { useI18n } from "@/src/i18n/provider";

export type CipherHintStage = 0 | 1 | 2;

export function nextCipherHintStage(stage: CipherHintStage): CipherHintStage {
  return stage < 2 ? (stage + 1) as CipherHintStage : 2;
}

export function ProgressiveCipherHints({ hints, relay = false }: { hints: [string, string]; relay?: boolean }) {
  const { locale } = useI18n();
  const [stage, setStage] = useState<CipherHintStage>(0);
  const buttonLabel = stage === 0
    ? locale === "en" ? "Reveal a gentle hint" : relay ? "展开第一条接线提示" : "展开第一条提示"
    : locale === "en" ? "Reveal the second hint" : relay ? "再看一条接线提示" : "再看一条提示";

  return <section className={`cipher-progressive-hints${relay ? " cipher-relay-hints" : ""}`} aria-label={locale === "en" ? "Progressive cipher hints" : relay ? "渐进接线提示" : "渐进密文提示"}>
    {stage < 2 && <button
      type="button"
      aria-expanded={stage > 0}
      onClick={() => setStage((current) => nextCipherHintStage(current))}
    ><Lightbulb /> {buttonLabel}</button>}
    {stage > 0 && <ol aria-live="polite">
      {hints.slice(0, stage).map((hint, index) => <li key={hint}><span>{index + 1}</span><p>{hint}</p></li>)}
    </ol>}
    {stage === 2 && <small>{locale === "en" ? "Both hints are open. Nothing was deducted or recorded." : "两条提示均已展开；不会扣除任何东西，也不会写入存档。"}</small>}
  </section>;
}
