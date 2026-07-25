"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Moon } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { campaignRegistry } from "@/src/content/campaigns/registry";
import { useGameStore } from "@/src/stores/game-store";
import { campaignSupportsLocale, localizeCampaign } from "@/src/i18n/core";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import { LanguagesIcon } from "@/src/components/ui/languages-icon";
import { OptionWheel } from "./option-wheel";
import { useI18n } from "@/src/i18n/provider";

const heroCopyTransition = { duration: 0.38, ease: "easeOut" as const };

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
        <p className="eyebrow"><Moon size={14} /> {t("一款与你轮班生活的异步侦探游戏")}<span className="shift-rule"><span className="shift-rule-face shift-rule-day"><b aria-hidden="true">●</b>{t("你负责白天推理")}</span><span className="shift-rule-face shift-rule-night"><b aria-hidden="true">☾</b>{t("林渡负责夜晚调查")}</span></span></p>
        <div className="hero-copy-swap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={campaign.id}
              className="hero-copy-swap-inner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={heroCopyTransition}
            >
              <h1>
                {campaign.presentation.headlineMain}<br /><em>{campaign.presentation.headlineAccent}</em>
              </h1>
              <p className="hero-lede">{campaign.presentation.teaser}</p>
            </motion.div>
          </AnimatePresence>
        </div>
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
