"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, ChevronRight, Languages, Moon, TramFront, Zap } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { campaignShelf, LAST_TRAM_CAMPAIGN_ID } from "@/src/content/campaigns/registry";
import { useWorldStore } from "@/src/stores/world-store";
import { campaignSupportsLocale, localizeCampaign } from "@/src/i18n/core";
import { useI18n } from "@/src/i18n/provider";

export function Hero({ onStart, onDemo, interactive }: { onStart: () => void; onDemo: () => void; interactive: boolean }) {
  const { campaignId, started, switchCampaign } = useWorldStore();
  const { campaign, locale, preferredLocale, setLocale, t } = useI18n();
  const isSandbox = campaign.format === "sandbox-expedition";
  const heroAsset = getAsset(campaign.presentation.heroAssetId);
  return (
    <main className="hero-shell">
      <div className="rain" aria-hidden="true" />
      <Image className="hero-art" src={heroAsset.src} alt={heroAsset.alt} fill priority sizes="100vw" />
      <div className="hero-vignette" />
      <nav className="landing-nav">
        <div className="brand-mark"><span aria-hidden="true" /><div><b>{t("夜班侦探")}</b><small>NIGHT SHIFT</small></div></div>
        <div className="landing-nav-actions">
          <button className="ghost-button language-button" disabled={!interactive} onClick={() => setLocale(preferredLocale === "en" ? "zh-CN" : "en")}><Languages size={15} /> {preferredLocale === "en" ? "中文" : "ENGLISH"}</button>
          <button className="ghost-button" disabled={!interactive} onClick={onDemo}><Zap size={15} /> {isSandbox ? "CASE FILE" : locale === "en" ? "CITY MAP" : "城市地图"}</button>
        </div>
      </nav>
      <section className="hero-copy">
        <p className="eyebrow"><Moon size={14} /> {t("一款与你轮班生活的异步侦探游戏")}</p>
        <h1>{locale === "en" ? <>When you fall asleep,<br /><em>his work begins.</em></> : <>你睡着以后，<br /><em>他才开始工作。</em></>}</h1>
        <p className="hero-lede">{t("白天分析线索，晚上把调查交给侦探。等你醒来，雾灯城会留下一份新的报告。")}</p>
        <div className="hero-actions">
          <button className="primary-button" disabled={!interactive} onClick={onStart}>{started ? t("继续当前案件") : locale === "en" ? `Begin Case ${campaign.presentation.archiveNumber}` : `开始第 ${campaign.presentation.archiveNumber} 宗案件`} <ArrowRight size={18} /></button>
          <button className="text-button" disabled={!interactive} onClick={onDemo}><BookOpen size={17} /> {isSandbox ? t("查看案件说明") : locale === "en" ? "Open the city chronicle" : "打开城市纪事"}</button>
        </div>
        <div className="shift-rule"><span>{isSandbox ? t("你负责调度调查小队") : t("你负责白天推理")}</span><i /><span>{isSandbox ? t("世界按行动改变") : t("林渡负责夜晚调查")}</span></div>
      </section>
      <section className="campaign-shelf" aria-label="主案与结构样板选择">
        <small>STORY WORLD · 主案与结构样板</small>
        <div>{campaignShelf.map((source) => {
          const supported = campaignSupportsLocale(source.id, preferredLocale);
          const item = localizeCampaign(source, supported ? preferredLocale : "zh-CN");
          const primary = source.id === LAST_TRAM_CAMPAIGN_ID;
          return <button type="button" aria-pressed={item.id === campaignId} className={item.id === campaignId ? "active" : ""} key={item.id} onClick={() => switchCampaign(source.id)}><span>{primary ? `MAIN CASE · CASE ${item.presentation.archiveNumber}` : `STRUCTURE SAMPLE · CASE ${item.presentation.archiveNumber}`}{preferredLocale === "en" && !supported ? " · 中文版" : ""}</span><b>{item.case.title}</b><p>{primary ? (locale === "en" ? "One city, one main mystery, and storylines revealed by the evidence you connect." : "同一座城市、同一宗主案；证物会让新的城区与支线逐步显影。") : item.presentation.teaser}</p></button>;
        })}</div>
        {preferredLocale === "en" && <p className="locale-availability">The Last Tram main thread is fully playable in English. The Lower-River branch and Blackwater Creek structure sample currently remain in Chinese.</p>}
      </section>
      <div className="case-teaser"><span className="case-index">CASE {campaign.presentation.archiveNumber}</span><b>{campaign.case.title}</b><small>{campaign.presentation.teaser}</small></div>
    </main>
  );
}

export function Intro({ onDone }: { onDone: () => void }) {
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
