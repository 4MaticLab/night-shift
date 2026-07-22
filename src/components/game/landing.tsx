"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, ChevronRight, Moon, TramFront, Zap } from "lucide-react";
import { assets } from "@/src/content/assets";

export function Hero({ onStart, onDemo, interactive }: { onStart: () => void; onDemo: () => void; interactive: boolean }) {
  return (
    <main className="hero-shell">
      <div className="rain" aria-hidden="true" />
      <Image className="hero-art" src={assets.nightShiftHero.src} alt={assets.nightShiftHero.alt} fill priority sizes="100vw" />
      <div className="hero-vignette" />
      <nav className="landing-nav">
        <div className="brand-mark"><span>NS</span><div><b>夜班侦探</b><small>NIGHT SHIFT</small></div></div>
        <button className="ghost-button" disabled={!interactive} onClick={onDemo}><Zap size={15} /> DEMO MODE</button>
      </nav>
      <section className="hero-copy">
        <p className="eyebrow"><Moon size={14} /> 一款与你轮班生活的异步侦探游戏</p>
        <h1>你睡着以后，<br /><em>他才开始工作。</em></h1>
        <p className="hero-lede">白天分析线索，晚上把调查交给侦探。等你醒来，雾灯城会留下一份新的报告。</p>
        <div className="hero-actions">
          <button className="primary-button" disabled={!interactive} onClick={onStart}>开始第一宗案件 <ArrowRight size={18} /></button>
          <button className="text-button" disabled={!interactive} onClick={onDemo}><BookOpen size={17} /> 观看 90 秒演示</button>
        </div>
        <div className="shift-rule"><span>你负责白天推理</span><i /><span>林渡负责夜晚调查</span></div>
      </section>
      <div className="case-teaser"><span className="case-index">CASE 001</span><b>零点四十三分的末班车</b><small>一辆不存在的电车，每晚仍在穿过这座城市。</small></div>
    </main>
  );
}

export function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = [
    ["你们从未同时醒着。", "当你合上眼睛，林渡才穿上外套。"],
    ["白天，你整理他带回的线索。", "旧车票、花粉、被刮掉的地图，都在等你连接。"],
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
