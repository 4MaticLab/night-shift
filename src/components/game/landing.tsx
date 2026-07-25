"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { campaignRegistry } from "@/src/content/campaigns/registry";
import { useGameStore } from "@/src/stores/game-store";
import { campaignSupportsLocale, localizeCampaign } from "@/src/i18n/core";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import { LanguagesIcon } from "@/src/components/ui/languages-icon";
import { OptionWheel } from "./option-wheel";
import { useI18n } from "@/src/i18n/provider";

export function Hero({ onStart, interactive }: { onStart: () => void; interactive: boolean }) {
  const { campaignId, started, switchCampaign } = useGameStore();
  const { campaign, locale, preferredLocale, setLocale, t } = useI18n();
  const heroAsset = getAsset(campaign.presentation.heroAssetId);
  const wheelEntries: { label: string; id?: (typeof campaignRegistry)[number]["id"] }[] = [
    { label: t("选择剧本") },
    ...campaignRegistry.map((source) => ({ label: localizeCampaign(source, campaignSupportsLocale(source.id, preferredLocale) ? preferredLocale : "zh-CN").case.title, id: source.id })),
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
          <Image className="hero-art" src={heroAsset.src} alt={heroAsset.alt} fill preload sizes="100vw" />
        </motion.div>
      </AnimatePresence>
      <div className="hero-vignette" />
      <nav className="landing-nav">
        <div className="landing-nav-actions">
          <button className="ghost-button language-button" disabled={!interactive} aria-label={preferredLocale === "en" ? "切换到中文" : "Switch to English"} title={preferredLocale === "en" ? "切换到中文" : "Switch to English"} onClick={() => setLocale(preferredLocale === "en" ? "zh-CN" : "en")}><LanguagesIcon size={28} /></button>
        </div>
      </nav>
      <section className="hero-copy">
        <h1>{locale === "en" ? <><span className="hero-title-hand hero-title-hand-lead">When you fall asleep,</span><em className="hero-title-hand">his work begins.</em></> : <><span className="hero-title-hand hero-title-hand-lead">你睡着以后，</span><em className="hero-title-hand">他才开始工作。</em></>}</h1>
        <p className="hero-lede hero-lede-note">{locale === "en" ? "Analyze clues by day, hand the night to the detective." : "白天分析线索，晚上把调查交给侦探"}</p>
        <div className="hero-actions">
          <ShinyButton
            className="primary-button"
            aria-label={started ? t("继续当前案件") : locale === "en" ? `Begin Case ${campaign.presentation.archiveNumber}` : `开始第 ${campaign.presentation.archiveNumber} 宗案件`}
            disabled={!interactive}
            onClick={onStart}
          >{primaryLabel} <ArrowRight size={18} /></ShinyButton>
        </div>
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
          soundUrl="/audio/click-soft.mp3"
          soundVolume={1}
          onChange={(index) => { const id = wheelEntries[index]?.id; if (id) switchCampaign(id); }}
        />
        {preferredLocale === "en" && <p className="locale-availability">English edition available for Case 001. Other cases remain in Chinese.</p>}
      </section>
      <div className="landing-footnote" aria-hidden="true"><span>LOCAL-FIRST</span><i /><span>NO ACCOUNT</span><i /><span>SAVE ON THIS DEVICE</span></div>
    </main>
  );
}
