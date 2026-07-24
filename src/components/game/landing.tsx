"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, ChevronRight, Languages, Moon, TramFront, Zap } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { campaignRegistry } from "@/src/content/campaigns/registry";
import { useGameStore } from "@/src/stores/game-store";
import { campaignSupportsLocale, localizeCampaign } from "@/src/i18n/core";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import { OptionWheel } from "./option-wheel";
import { useI18n } from "@/src/i18n/provider";

export function Hero({ onStart, onDemo, interactive }: { onStart: () => void; onDemo: () => void; interactive: boolean }) {
  const { campaignId, started, switchCampaign } = useGameStore();
  const { campaign, locale, preferredLocale, setLocale, t } = useI18n();
  const heroAsset = getAsset(campaign.presentation.heroAssetId);
  const wheelEntries: { label: string; id?: (typeof campaignRegistry)[number]["id"] }[] = [
    { label: t("选择剧本") },
    ...campaignRegistry.map((source) => ({ label: localizeCampaign(source, campaignSupportsLocale(source.id, preferredLocale) ? preferredLocale : "zh-CN").case.title, id: source.id })),
    { label: "雾灯城失物招领处" },
    { label: "第七盏路灯的告别" },
    { label: "凌晨三点的无人书店" },
    { label: "货运电梯里的十一月" },
    { label: "潮汐旅馆的最后一位房客" },
  ];
  const selectedCampaignIndex = Math.max(1, wheelEntries.findIndex((entry) => entry.id === campaignId));
  const primaryLabel = started
    ? locale === "en" ? `Continue ${campaign.case.title}` : `继续《${campaign.case.title}》`
    : locale === "en" ? `Begin ${campaign.case.title}` : `开始《${campaign.case.title}》`;
  return (
    <main className="hero-shell">
      <div className="rain" aria-hidden="true" />
      <AnimatePresence initial={false}>
        <motion.div className="hero-art-layer" style={{ position: "absolute", inset: 0 }} key={campaign.id} initial={{ opacity: 0, scale: 1.015 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .55, ease: "easeOut" }}>
          <Image className="hero-art" src={heroAsset.src} alt={heroAsset.alt} fill priority sizes="100vw" />
        </motion.div>
      </AnimatePresence>
      <div className="hero-vignette" />
      <nav className="landing-nav">
        <div className="brand-mark"><span aria-hidden="true" /><div><b>{t("夜班侦探")}</b><small>NIGHT SHIFT</small></div></div>
        <div className="landing-nav-actions">
          <button className="ghost-button language-button" disabled={!interactive} onClick={() => setLocale(preferredLocale === "en" ? "zh-CN" : "en")}><Languages size={15} /> {preferredLocale === "en" ? "中文" : "ENGLISH"}</button>
          <button className="ghost-button" disabled={!interactive} onClick={onDemo}><Zap size={15} /> DEMO MODE</button>
        </div>
      </nav>
      <section className="hero-copy">
        <p className="eyebrow"><Moon size={14} /> {t("一款与你轮班生活的异步侦探游戏")}</p>
        <h1>{locale === "en" ? <>When you fall asleep,<br /><em>his work begins.</em></> : <>你睡着以后，<br /><em>他才开始工作。</em></>}</h1>
        <p className="hero-lede">{t("白天分析线索，晚上把调查交给侦探。等你醒来，雾灯城会留下一份新的报告。")}</p>
        <div className="hero-actions">
          <ShinyButton
            className="primary-button"
            aria-label={started ? t("继续当前案件") : locale === "en" ? `Begin Case ${campaign.presentation.archiveNumber}` : `开始第 ${campaign.presentation.archiveNumber} 宗案件`}
            disabled={!interactive}
            onClick={onStart}
          >{primaryLabel} <ArrowRight size={18} /></ShinyButton>
        </div>
        <div className="shift-rule"><span>{t("你负责白天推理")}</span><i /><span>{t("林渡负责夜晚调查")}</span></div>
      </section>
      <section className={interactive ? "campaign-wheel" : "campaign-wheel inert"} aria-label={t("案件剧本选择")}>
        <OptionWheel
          items={wheelEntries.map((entry) => entry.label)}
          defaultSelected={selectedCampaignIndex}
          side="right"
          fontSize={2.6}
          spacing={1.8}
          curve={1}
          tilt={7}
          blur={1.2}
          fade={0.22}
          smoothing={160}
          inset={140}
          loop
          textColor="#9da8b5"
          activeColor="#f7f4ef"
          onChange={(index) => { const id = wheelEntries[index]?.id; if (id) switchCampaign(id); }}
        />
        {preferredLocale === "en" && <p className="locale-availability">English edition available for Case 001. Other cases remain in Chinese.</p>}
      </section>
      <div className="landing-footnote" aria-hidden="true"><span>LOCAL-FIRST</span><i /><span>NO ACCOUNT</span><i /><span>SAVE ON THIS DEVICE</span></div>
    </main>
  );
}

export function Intro({ onDone }: { onDone: () => void }) {
  useGameStore((state) => state.campaignId);
  const { campaign, locale, t } = useI18n();
  const [step, setStep] = useState(0);
  const lines = [
    [t("你们从未同时醒着。"), t("当你合上眼睛，林渡才穿上外套。")],
    [t("白天，你整理他带回的线索。"), locale === "en" ? `The evidence and contradictions of ${campaign.case.title} are waiting for you to connect them.` : `${campaign.case.title}的证物与矛盾，都在等你连接。`],
    [t("夜晚，他替你进入城市。"), t("今晚的调查，交给他吧。")],
  ];
  return (
    <motion.div className="intro-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="intro-window"><TramFront /><span className="window-light" /></div>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="intro-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <span>0{step + 1} / 03</span><h2>{lines[step][0]}</h2><p>{lines[step][1]}</p>
        </motion.div>
      </AnimatePresence>
      <div className="intro-footer"><div className="intro-dots">{lines.map((_, i) => <i className={i === step ? "active" : ""} key={i} />)}</div><button className="primary-button" onClick={() => step < 2 ? setStep(step + 1) : onDone()}>{step < 2 ? t("继续") : t("进入事务所")}<ChevronRight size={18} /></button></div>
    </motion.div>
  );
}
