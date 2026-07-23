"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, ChevronRight, Languages, Moon, TramFront, Zap } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { campaignRegistry, DEFAULT_CAMPAIGN_ID } from "@/src/content/campaigns/registry";
import { useGameStore } from "@/src/stores/game-store";
import { campaignSupportsLocale, localizeCampaign } from "@/src/i18n/core";
import { useI18n } from "@/src/i18n/provider";

export function Hero({ onStart, onDemo, interactive }: { onStart: () => void; onDemo: () => void; interactive: boolean }) {
  const { campaignId, campaignSaves, chapter, completedReports, started, switchCampaign } = useGameStore();
  const { campaign, locale, preferredLocale, setLocale, t } = useI18n();
  const heroAsset = getAsset(campaign.presentation.heroAssetId);
  const otherCampaigns = campaignRegistry.filter((item) => item.id !== campaignId);
  const progressLabel = started
    ? locale === "en"
      ? `Night ${Math.min(chapter, campaign.case.chapters.length)} of ${campaign.case.chapters.length}`
      : `第 ${Math.min(chapter, campaign.case.chapters.length)} / ${campaign.case.chapters.length} 夜`
    : locale === "en"
      ? `${campaign.case.chapters.length}-night complete case`
      : `${campaign.case.chapters.length} 夜完整案件`;
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
        <div className="landing-watch" aria-hidden="true"><i /><span>AGENCY WATCH</span><b>00:43</b></div>
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
          <button
            className="primary-button"
            aria-label={started ? t("继续当前案件") : locale === "en" ? `Begin Case ${campaign.presentation.archiveNumber}` : `开始第 ${campaign.presentation.archiveNumber} 宗案件`}
            disabled={!interactive}
            onClick={onStart}
          >{primaryLabel} <ArrowRight size={18} /></button>
          <button className="text-button" disabled={!interactive} onClick={onDemo}><BookOpen size={17} /> {t("观看 90 秒演示")}</button>
        </div>
        <div className="shift-rule"><span>{t("你负责白天推理")}</span><i /><span>{t("林渡负责夜晚调查")}</span></div>
      </section>
      <section className="campaign-shelf" aria-label={t("案件剧本选择")}>
        <header>
          <div><small>CASE LIBRARY · 02 FILES</small><h2>{t("今晚从哪一宗开始？")}</h2></div>
          <span>{t("本地独立存档")}</span>
        </header>
        <motion.article className="featured-case" key={campaign.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
          <div className="featured-case-index">
            <span>CASE {campaign.presentation.archiveNumber}</span>
            <div>
              {campaign.id === DEFAULT_CAMPAIGN_ID && <i>{t("推荐起点")}</i>}
              <b>{started ? t("继续调查") : t("尚未开封")}</b>
            </div>
          </div>
          <h3>{campaign.case.title}</h3>
          <p>{campaign.presentation.teaser}</p>
          <footer>
            <span>{progressLabel}</span>
            <span>{completedReports.length > 0 ? `${completedReports.length} REPORTS` : campaign.id === DEFAULT_CAMPAIGN_ID ? "ZH · EN" : "ZH"}</span>
          </footer>
        </motion.article>
        <div className="campaign-alternates"><small>{t("其他卷宗")}</small>{otherCampaigns.map((source) => {
          const supported = campaignSupportsLocale(source.id, preferredLocale);
          const item = localizeCampaign(source, supported ? preferredLocale : "zh-CN");
          const saved = campaignSaves[source.id];
          return <button type="button" aria-pressed="false" key={item.id} onClick={() => switchCampaign(source.id)}>
            <span><small>CASE {item.presentation.archiveNumber}{preferredLocale === "en" && !supported ? " · 中文版" : ""}</small><b>{item.case.title}</b><em>{saved?.started ? t("已有进度") : item.id === DEFAULT_CAMPAIGN_ID ? t("推荐起点") : t("新卷宗")}</em></span>
            <ChevronRight />
          </button>;
        })}</div>
        <p className="campaign-save-note">{t("切换案件不会覆盖各自的调查进度。")}</p>
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
