"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Moon } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { campaignRegistry, getCampaign } from "@/src/content/campaigns/registry";
import type { CampaignManifest } from "@/src/content/campaigns/types";
import { useGameStore } from "@/src/stores/game-store";
import { localizeValue, translateText, type AppLocale } from "@/src/i18n/core";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import { LanguagesIcon } from "@/src/components/ui/languages-icon";
import { OptionWheel } from "./option-wheel";
import { useI18n } from "@/src/i18n/provider";

const heroCopyTransition = { duration: 0.38, ease: "easeOut" as const };

/** Prefer a mapped English string, then the campaign's stable englishTitle. */
function displayCaseTitle(source: CampaignManifest, preferredLocale: AppLocale): string {
  if (preferredLocale !== "en") return source.case.title;
  const translated = translateText(source.case.title, "en");
  if (translated !== source.case.title) return translated;
  return source.case.englishTitle;
}

export function Hero({ onStart, interactive }: { onStart: () => void; interactive: boolean }) {
  const { campaignId, started, switchCampaign } = useGameStore();
  const { campaign, preferredLocale, setLocale } = useI18n();
  const heroAsset = getAsset(campaign.presentation.heroAssetId);
  // Landing chrome and rotating copy follow the user's preferred locale so that
  // switching to a Chinese-only case does not yank the whole page back to zh-CN.
  const tUi = (source: string) => translateText(source, preferredLocale);
  const rawCampaign = getCampaign(campaignId);
  const heroPresentation = preferredLocale === "en"
    ? localizeValue(rawCampaign.presentation, "en")
    : rawCampaign.presentation;
  const displayTitle = displayCaseTitle(rawCampaign, preferredLocale);
  const wheelEntries: { label: string; id?: (typeof campaignRegistry)[number]["id"] }[] = [
    { label: tUi("选择剧本") },
    ...campaignRegistry.map((source) => ({ label: displayCaseTitle(source, preferredLocale), id: source.id })),
  ];
  const selectedCampaignIndex = Math.max(1, wheelEntries.findIndex((entry) => entry.id === campaignId));
  const primaryLabel = started
    ? preferredLocale === "en" ? `Continue ${displayTitle}` : `继续《${displayTitle}》`
    : preferredLocale === "en" ? `Begin ${displayTitle}` : `开始《${displayTitle}》`;

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
        <p className="eyebrow"><Moon size={14} /> {tUi("一款与你轮班生活的异步侦探游戏")}<span className="shift-rule"><span className="shift-rule-face shift-rule-day"><b aria-hidden="true">●</b>{tUi("你负责白天推理")}</span><span className="shift-rule-face shift-rule-night"><b aria-hidden="true">☾</b>{tUi("林渡负责夜晚调查")}</span></span></p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={campaign.id}
            className="hero-copy-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={heroCopyTransition}
          >
            <h1>
              {heroPresentation.headlineMain}<br /><em>{heroPresentation.headlineAccent}</em>
            </h1>
            <p className="hero-lede">{heroPresentation.teaser}</p>
          </motion.div>
        </AnimatePresence>
        <div className="hero-actions">
          <ShinyButton
            className="primary-button"
            aria-label={started ? tUi("继续当前案件") : preferredLocale === "en" ? `Begin Case ${heroPresentation.archiveNumber}` : `开始第 ${heroPresentation.archiveNumber} 宗案件`}
            disabled={!interactive}
            onClick={onStart}
          >{primaryLabel} <ArrowRight size={18} /></ShinyButton>
        </div>
      </section>
      <section className={interactive ? "campaign-wheel" : "campaign-wheel inert"} aria-label={tUi("案件剧本选择")}>
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
        {preferredLocale === "en" && (
          <p className="locale-availability">English edition available for Cases 001–002. Other cases keep Chinese in-game text; landing titles and teasers are translated for browsing.</p>
        )}
      </section>
      <div className="landing-footnote" aria-hidden="true"><span>LOCAL-FIRST</span><i /><span>NO ACCOUNT</span><i /><span>SAVE ON THIS DEVICE</span></div>
    </main>
  );
}
