"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Footprints } from "lucide-react";
import type { RouteDirection, SleepQuality, SocietyId } from "@/src/lib/game-engine/schema";
import { growthStageFromProgress } from "@/src/content/botany";
import { getAsset } from "@/src/content/assets";
import { getCitySociety } from "@/src/content/societies";
import { getCampaign } from "@/src/content/campaigns/registry";
import { getCampaignBotanical } from "@/src/content/campaigns/types";
import { useGameStore } from "@/src/stores/game-store";

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

const ROUTE_STOPS: Record<string, { x: number; y: number }[]> = {
  river: [{ x: 10, y: 56 }, { x: 34, y: 44 }, { x: 60, y: 39 }, { x: 84, y: 23 }],
  market: [{ x: 10, y: 38 }, { x: 34, y: 45 }, { x: 61, y: 50 }, { x: 84, y: 56 }],
  heights: [{ x: 10, y: 64 }, { x: 34, y: 52 }, { x: 61, y: 36 }, { x: 84, y: 22 }],
};

export function CityRoute({ progress = 100, compact = false, routeNodes = ["事务所", "灯港", "旧子午", "玻璃丘"], variant = "river" }: { progress?: number; compact?: boolean; routeNodes?: string[]; variant?: RouteDirection["mapVariant"] }) {
  const stops = Array.from({ length: 4 }, (_, index) => routeNodes[index] ?? "未抵达");
  const points = ROUTE_STOPS[variant] ?? ROUTE_STOPS.river;
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(0);
  const d = useMemo(() => points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" "), [points]);
  useEffect(() => { if (pathRef.current) setPathLen(pathRef.current.getTotalLength()); }, [d]);
  const marker = useMemo(() => {
    if (!pathLen || !pathRef.current) return { x: points[0].x, y: points[0].y };
    const pt = pathRef.current.getPointAtLength((Math.max(0, Math.min(100, progress)) / 100) * pathLen);
    return { x: pt.x, y: pt.y };
  }, [pathLen, progress, points]);
  return (
    <div className={`city-map route-${variant} ${compact ? "compact" : ""}`}>
      <div className="river" />
      <svg className="route-path" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={d} className="route-line-bg" pathLength={100} />
        <path ref={pathRef} d={d} className="route-line-progress" pathLength={100} style={{ strokeDasharray: "100", strokeDashoffset: `${100 - Math.max(0, Math.min(100, progress))}` }} />
      </svg>
      <div className="detective-marker" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}><Footprints /></div>
      {stops.map((stop, index) => <div className={`route-stop s${index + 1}`} key={`${stop}-${index}`}><i />{stop}</div>)}
      <span className="map-label ml1">{stops[0]}</span><span className="map-label ml2">{stops[1]}</span><span className="map-label ml3">{stops[3]}</span>
    </div>
  );
}

export function BotanicalSpecimen({ chapter, progress = 100, compact = false }: { chapter: number; progress?: number; compact?: boolean }) {
  const campaign = getCampaign(useGameStore((state) => state.campaignId));
  const botanical = getCampaignBotanical(campaign, chapter);
  const art = getAsset(botanical.assetId);
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const visibleProgress = Math.max(7, normalizedProgress);
  const stage = growthStageFromProgress(normalizedProgress);
  return <div className={`botanical-specimen ${compact ? "compact" : ""}`} data-stage={stage}><Image className="botanical-ghost" src={art.src} alt="" width={256} height={384} /><span className="botanical-fill" style={{ clipPath: `inset(${100 - visibleProgress}% 0 0)` }}><Image src={art.src} alt={art.alt} width={256} height={384} /></span><div><small>{stage.toUpperCase()} · {Math.round(normalizedProgress)}%</small><b>{botanical.name}</b></div></div>;
}

export function SocietyCrest({ societyId, compact = false }: { societyId: SocietyId; compact?: boolean }) {
  const society = getCitySociety(societyId);
  const art = getAsset(society.assetId);
  return <div className={`society-crest ${compact ? "compact" : ""}`}><Image src={art.src} alt={art.alt} width={240} height={240} /></div>;
}
