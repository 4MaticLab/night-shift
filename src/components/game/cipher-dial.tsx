"use client";

import { Minus, Plus, Radio, TimerReset } from "lucide-react";
import { alignCipherDialValue, cipherDialAnswer, formatCipherDialValue, getCipherDialSignal, stepCipherDialValue, type CipherChallenge } from "@/src/content/ciphers";
import { useI18n } from "@/src/i18n/provider";

export function CipherDialControl({ challenge, value, onChange, onLock }: { challenge: CipherChallenge; value: number; onChange: (value: number) => void; onLock: (answer: string) => void }) {
  const { t } = useI18n();
  const dial = challenge.dial;
  if (!dial) return null;
  const aligned = alignCipherDialValue(dial, value);
  const signal = getCipherDialSignal(dial, aligned);
  const progress = ((aligned - dial.min) / (dial.max - dial.min)) * 100;
  const signalCopy = {
    silent: t("静默 · 只有雨底噪"),
    faint: t("微弱 · 有一段信号靠近"),
    clear: t("清晰 · 几乎对准了"),
    locked: t("已锁定 · 信号完整"),
  }[signal];
  const SignalIcon = dial.mode === "minutes" ? TimerReset : Radio;
  return <div className={`cipher-dial signal-${signal}`}>
    <header><SignalIcon /><div><small>{dial.mode === "minutes" ? t("隐藏站钟") : t("雨中调频仪")}</small><b>{formatCipherDialValue(dial, aligned)}</b></div><span>{signalCopy}</span></header>
    <div className="cipher-dial-scale" aria-hidden="true"><i style={{ left: `${progress}%` }} />{Array.from({ length: 11 }, (_, index) => <span style={{ left: `${index * 10}%` }} key={index} />)}</div>
    <div className="cipher-dial-controls">
      <button type="button" aria-label={dial.decreaseLabel} disabled={aligned <= dial.min} onClick={() => onChange(stepCipherDialValue(dial, aligned, -1))}><Minus /></button>
      <input type="range" aria-label={dial.ariaLabel} min={dial.min} max={dial.max} step={dial.step} value={aligned} onChange={(event) => onChange(alignCipherDialValue(dial, Number(event.target.value)))} />
      <button type="button" aria-label={dial.increaseLabel} disabled={aligned >= dial.max} onClick={() => onChange(stepCipherDialValue(dial, aligned, 1))}><Plus /></button>
    </div>
    <button type="button" className="cipher-dial-lock" onClick={() => onLock(cipherDialAnswer(dial, aligned))}><SignalIcon /> {dial.lockLabel}</button>
    <p>{t("刻度可以反复调整；锁定错误不会损坏信号或记录失败。")}</p>
  </div>;
}
