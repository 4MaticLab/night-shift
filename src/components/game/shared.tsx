"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Footprints } from "lucide-react";
import type { SleepQuality } from "@/src/lib/game-engine/schema";

export const qualityCopy: Record<SleepQuality, { label: string; time: string; note: string }> = {
  interrupted: { label: "4小时 · 断续", time: "短程调查", note: "会听见一次特别的城市回声" },
  regular: { label: "6.5小时 · 普通", time: "标准调查", note: "一条完整路线与一件藏品" },
  restful: { label: "8小时 · 安稳", time: "深入调查", note: "更完整的观察与稀有说明" },
};

export function Seal({ children }: { children: ReactNode }) {
  return <span className="seal">{children}</span>;
}

export function PaperCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`paper-card ${className}`}><span className="tape" />{children}</div>;
}

export function CityRoute({ progress = 100, compact = false }: { progress?: number; compact?: boolean }) {
  return <div className={`city-map ${compact ? "compact" : ""}`}><div className="river" /><div className="tram-line"><span style={{ width: `${progress}%` }} /></div><div className="route-stop s1"><i />事务所</div><div className="route-stop s2"><i />灯港</div><div className="route-stop s3"><i />旧子午</div><div className="route-stop s4"><i />玻璃丘</div><motion.div className="detective-marker" animate={{ left: `${Math.max(4, Math.min(90, progress))}%` }} transition={{ duration: 1.2 }}><Footprints /></motion.div><span className="map-label ml1">LANTERN WHARF</span><span className="map-label ml2">OLD MERIDIAN</span><span className="map-label ml3">GLASS HILL</span></div>;
}
