"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, ChevronRight, Moon, TramFront, Zap } from "lucide-react";
import { getAsset } from "@/src/content/assets";
import { campaignRegistry, getCampaign } from "@/src/content/campaigns/registry";
import { useGameStore } from "@/src/stores/game-store";

export function Hero({ onStart, onDemo, interactive }: { onStart: () => void; onDemo: () => void; interactive: boolean }) {
  const { campaignId, started, switchCampaign } = useGameStore();
  const campaign = getCampaign(campaignId);
  const isSandbox = campaign.format === "sandbox-expedition";
  const heroAsset = getAsset(campaign.presentation.heroAssetId);
  return (
    <main className="hero-shell">
      <div className="rain" aria-hidden="true" />
      <Image className="hero-art" src={heroAsset.src} alt={heroAsset.alt} fill priority sizes="100vw" />
      <div className="hero-vignette" />
      <nav className="landing-nav">
        <div className="brand-mark"><span>NS</span><div><b>夜班侦探</b><small>NIGHT SHIFT</small></div></div>
        <button className="ghost-button" disabled={!interactive} onClick={onDemo}><Zap size={15} /> {isSandbox ? "CASE FILE" : "DEMO MODE"}</button>
      </nav>
      <section className="hero-copy">
        <p className="eyebrow"><Moon size={14} /> 一款与你轮班生活的异步侦探游戏</p>
        <h1>你睡着以后，<br /><em>他才开始工作。</em></h1>
        <p className="hero-lede">白天分析线索，晚上把调查交给侦探。等你醒来，雾灯城会留下一份新的报告。</p>
        <div className="hero-actions">
          <button className="primary-button" disabled={!interactive} onClick={onStart}>{started ? "继续当前案件" : `开始第 ${campaign.presentation.archiveNumber} 宗案件`} <ArrowRight size={18} /></button>
          <button className="text-button" disabled={!interactive} onClick={onDemo}><BookOpen size={17} /> {isSandbox ? "查看案件说明" : "观看 90 秒演示"}</button>
        </div>
        <div className="shift-rule"><span>{isSandbox ? "你负责调度调查小队" : "你负责白天推理"}</span><i /><span>{isSandbox ? "山谷按行动改变" : "林渡负责夜晚调查"}</span></div>
      </section>
      <section className="campaign-shelf" aria-label="案件剧本选择">
        <small>CASE LIBRARY · 选择剧本</small>
        <div>{campaignRegistry.map((item) => <button type="button" aria-pressed={item.id === campaignId} className={item.id === campaignId ? "active" : ""} key={item.id} onClick={() => switchCampaign(item.id)}><span>CASE {item.presentation.archiveNumber}</span><b>{item.case.title}</b><p>{item.presentation.teaser}</p></button>)}</div>
      </section>
      <div className="case-teaser"><span className="case-index">CASE {campaign.presentation.archiveNumber}</span><b>{campaign.case.title}</b><small>{campaign.presentation.teaser}</small></div>
    </main>
  );
}

export function Intro({ onDone }: { onDone: () => void }) {
  const campaign = getCampaign(useGameStore((state) => state.campaignId));
  const [step, setStep] = useState(0);
  const lines = [
    ["你们从未同时醒着。", "当你合上眼睛，林渡才穿上外套。"],
    ["白天，你整理他带回的线索。", `${campaign.case.title}的证物与矛盾，都在等你连接。`],
    ["夜晚，他替你进入城市。", "今晚的调查，交给他吧。"],
  ];
  return (
    <motion.div className="intro-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="intro-window"><TramFront /><span className="window-light" /></div>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="intro-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <span>0{step + 1} / 03</span><h2>{lines[step][0]}</h2><p>{lines[step][1]}</p>
        </motion.div>
      </AnimatePresence>
      <div className="intro-footer"><div className="intro-dots">{lines.map((_, i) => <i className={i === step ? "active" : ""} key={i} />)}</div><button className="primary-button" onClick={() => step < 2 ? setStep(step + 1) : onDone()}>{step < 2 ? "继续" : "进入事务所"}<ChevronRight size={18} /></button></div>
    </motion.div>
  );
}
