"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RouteDirection } from "@/src/lib/game-engine/schema";
import { useI18n } from "@/src/i18n/provider";

type MapVariant = RouteDirection["mapVariant"];
type Roof = "flat" | "spire" | "dome" | "step";
type Building = { x: number; w: number; h: number; roof?: Roof; windows?: boolean };
type WindowLight = { x: number; y: number; seed: number };

const SCENE_H = 420;
const FAR_STRIP_W = 1860;
const MID_STRIP_W = 3000;
const FRONT_STRIP_W = 3600;
const FAR_BASE = 252;
const MID_BASE = 302;

// Roadside signposts (the night's four stops) stand at fixed world positions
// along the mid strip; the camera walks past them in order as progress grows.
const STOP_X = [900, 1400, 1900, 2400];
const FRONT_LAMPS = [240, 840, 1440, 2040, 2640, 3240];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic strip skylines: fixed seeds keep the street identical across
// reloads, so every night walks past the same buildings.
function generateBuildings(seed: number, width: number, hMin: number, hMax: number): Building[] {
  const rand = mulberry32(seed);
  const buildings: Building[] = [];
  let x = -140;
  let lastLandmark = -400;
  while (x < width) {
    const w = 64 + rand() * 158;
    const h = hMin + rand() * (hMax - hMin);
    let roof: Roof | undefined;
    const r = rand();
    if (x - lastLandmark > 780 && r < 0.5) {
      roof = r < 0.26 ? "dome" : "step";
      lastLandmark = x;
    } else if (r < 0.07) roof = "spire";
    else if (r < 0.15) roof = "dome";
    else if (r < 0.3) roof = "step";
    buildings.push({ x, w, h, roof, windows: !(w < 74 || rand() < 0.16) });
    x += w + rand() * 30 - 9;
  }
  return buildings;
}

const FAR_SKYLINE = generateBuildings(7, FAR_STRIP_W + 160, 48, 138);
const MID_SKYLINES: Record<MapVariant, Building[]> = {
  river: generateBuildings(11, MID_STRIP_W + 160, 82, 186),
  market: generateBuildings(23, MID_STRIP_W + 160, 74, 162),
  heights: generateBuildings(37, MID_STRIP_W + 160, 96, 212),
};

function skylinePath(buildings: Building[], base: number): string {
  return buildings.map((b) => {
    const top = base - b.h;
    let d = `M${b.x} ${base} L${b.x} ${top}`;
    switch (b.roof) {
      case "spire":
        d += ` L${b.x + b.w / 2} ${top - b.w * 0.62} L${b.x + b.w} ${top}`;
        break;
      case "dome":
        d += ` A${b.w / 2} ${b.w / 2} 0 0 1 ${b.x + b.w} ${top}`;
        break;
      case "step":
        d += ` L${b.x + b.w * 0.22} ${top} L${b.x + b.w * 0.22} ${top - b.h * 0.22} L${b.x + b.w * 0.78} ${top - b.h * 0.22} L${b.x + b.w * 0.78} ${top} L${b.x + b.w} ${top}`;
        break;
      default:
        d += ` L${b.x + b.w} ${top}`;
    }
    return `${d} L${b.x + b.w} ${base} Z`;
  }).join(" ");
}

// Deterministic window grid: which windows exist is a pure function of the
// skyline; when they light depends on the camera passing them.
function windowsFor(buildings: Building[], base: number): WindowLight[] {
  const lights: WindowLight[] = [];
  buildings.forEach((building, buildingIndex) => {
    if (building.windows === false) return;
    const cols = Math.floor((building.w - 20) / 34);
    const rows = Math.floor((building.h - 26) / 44);
    for (let col = 0; col < cols; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        const seed = buildingIndex * 97 + col * 13 + row * 7;
        if (seed % 3 === 0) continue;
        lights.push({
          x: building.x + 13 + col * 34,
          y: base - building.h + 15 + row * 44,
          seed,
        });
      }
    }
  });
  return lights;
}

function buntingFlags(fromX: number, toX: number, y: number, count: number) {
  const flags: { x: number; y: number }[] = [];
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1);
    flags.push({ x: fromX + (toX - fromX) * t, y: y + Math.sin(Math.PI * t) * 12 });
  }
  return flags;
}

const STAR_FIELD = Array.from({ length: 16 }, (_, i) => ({
  cx: (i * 173 + 41) % 1200,
  cy: 16 + ((i * 67) % 148),
  opacity: 0.16 + (i % 4) * 0.07,
}));

export function NightDiorama({ progress, routeNodes, variant = "river", watchId }: {
  progress: number;
  routeNodes: string[];
  variant?: MapVariant;
  watchId: string;
}) {
  const { localize, locale } = useI18n();
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const p = Math.max(0, Math.min(100, progress)) / 100;
  const localizedStops = localize(routeNodes);
  const stops = Array.from({ length: 4 }, (_, index) => localizedStops[index] ?? "");
  const [size, setSize] = useState({ w: 1120, h: 460 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) setSize({ w: rect.width, h: rect.height });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Pointer parallax: the stage rotates a few degrees on fine-pointer devices;
  // depth comes from per-layer translateZ. Disabled for reduced motion and
  // coarse pointers, where the scene stays a flat paper print.
  useEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (!frame || !stage) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      stage.style.transform = `rotateX(${(-currentY * 1.8).toFixed(3)}deg) rotateY(${(currentX * 4.2).toFixed(3)}deg)`;
      if (Math.abs(targetX - currentX) > 0.0008 || Math.abs(targetY - currentY) > 0.0008) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };
    const handleMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      schedule();
    };
    const handleLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };

    frame.addEventListener("pointermove", handleMove, { passive: true });
    frame.addEventListener("pointerleave", handleLeave);
    return () => {
      frame.removeEventListener("pointermove", handleMove);
      frame.removeEventListener("pointerleave", handleLeave);
      if (raf) window.cancelAnimationFrame(raf);
      stage.style.transform = "";
    };
  }, []);

  // World geometry. Layers are 110% of the frame (tilt bleed); strips are
  // authored at SCENE_H units tall, scaled to the layer, and scrolled so the
  // camera crosses their full overflow over the night. Nearer strips are
  // wider, so they sweep past faster — the walk itself is the parallax.
  const geo = useMemo(() => {
    const layerW = size.w * 1.1;
    const layerH = size.h * 1.1;
    const scale = layerH / SCENE_H;
    const strip = (units: number) => {
      const px = units * scale;
      return { px, overflow: Math.max(0, px - layerW) };
    };
    return {
      layerW,
      scale,
      far: strip(FAR_STRIP_W),
      mid: strip(MID_STRIP_W),
      front: strip(FRONT_STRIP_W),
    };
  }, [size]);

  const farPath = useMemo(() => skylinePath(FAR_SKYLINE, FAR_BASE), []);
  const midBuildings = MID_SKYLINES[variant] ?? MID_SKYLINES.river;
  const midPath = useMemo(() => skylinePath(midBuildings, MID_BASE), [midBuildings]);
  const midWindows = useMemo(() => windowsFor(midBuildings, MID_BASE), [midBuildings]);
  const farWindows = useMemo(() => windowsFor(FAR_SKYLINE, FAR_BASE).filter((_, index) => index % 4 === 0), []);
  const marketBunting = useMemo(() => [350, 1350, 2250].map((fromX) => ({
    fromX,
    flags: buntingFlags(fromX, fromX + 380, MID_BASE - 4, 9),
  })), []);

  // A window lights once the camera carries it past ~58% of the frame; every
  // fourth window is ambient city life and burns from nightfall.
  const windowLitAt = (worldX: number) => (
    geo.mid.overflow > 0 ? (worldX * geo.scale - geo.layerW * 0.58) / geo.mid.overflow : 0
  );

  // Foreground lamp posts flare as they sweep past the camera.
  const lampGlow = (worldX: number) => {
    if (geo.front.overflow <= 0) return 1;
    const screen = (worldX * geo.scale - p * geo.front.overflow) / geo.layerW;
    const proximity = Math.max(0, 1 - Math.abs(screen - 0.5) / 0.38);
    return 0.3 + 0.7 * proximity;
  };

  const scrollStyle = (offset: number) => ({ transform: `translateX(${(-p * offset).toFixed(1)}px)` });

  // The moon drifts down-left as the night advances and sets behind the
  // rooftops by dawn — another quiet clock, still a pure function of progress.
  const moonX = 968 - p * 200;
  const moonY = 66 + p * 26;

  return (
    <div
      className="night-diorama"
      data-watch={watchId}
      ref={frameRef}
      role="group"
      aria-label={locale === "en"
        ? "Night journey: walking the fog-lit street past tonight's four stops"
        : "夜行图景：提灯穿行夜城街道，途经今晚四个站点"}
    >
      <div className="diorama-stage" ref={stageRef}>
        <div className="diorama-layer" style={{ transform: "translateZ(-220px) scale(1.191)" }}>
          <div className="diorama-sky" />
          <svg className="diorama-svg" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            {STAR_FIELD.map((star) => <circle key={`${star.cx}-${star.cy}`} cx={star.cx} cy={star.cy} r="1.1" className="diorama-star" opacity={star.opacity} />)}
            <mask id="diorama-moon-cut">
              <circle cx={moonX} cy={moonY} r="26" fill="#fff" />
              <circle cx={moonX + 10} cy={moonY - 6} r="23" fill="#000" />
            </mask>
            <circle cx={moonX} cy={moonY} r="27" className="diorama-moon" mask="url(#diorama-moon-cut)" />
          </svg>
        </div>

        <div className="diorama-layer" style={{ transform: "translateZ(-160px) scale(1.139)" }}>
          <div className="diorama-sway diorama-sway-a">
            <div className="diorama-strip" style={{ width: `${geo.far.px.toFixed(0)}px`, ...scrollStyle(geo.far.overflow) }}>
              <svg className="diorama-svg" viewBox={`0 0 ${FAR_STRIP_W} ${SCENE_H}`} preserveAspectRatio="none" aria-hidden="true">
                <path d={farPath} className="diorama-far-fill" />
                {farWindows.map((w, index) => <rect key={`fw-${w.x}-${w.y}`} x={w.x} y={w.y} width="5" height="8" className="diorama-window-far" style={{ animationDelay: `${-(index % 7) * 2.3}s` }} />)}
              </svg>
            </div>
          </div>
        </div>

        <div className="diorama-layer" style={{ transform: "translateZ(-115px) scale(1.1)" }}>
          <div className="diorama-fog diorama-fog-a" />
        </div>

        <div className="diorama-layer" style={{ transform: "translateZ(-85px) scale(1.074)" }}>
          <div className="diorama-sway diorama-sway-b">
            <div className="diorama-strip" style={{ width: `${geo.mid.px.toFixed(0)}px`, ...scrollStyle(geo.mid.overflow) }}>
            <svg className="diorama-svg" viewBox={`0 0 ${MID_STRIP_W} ${SCENE_H}`} preserveAspectRatio="none" aria-hidden="true">
              <path d={midPath} className="diorama-mid-fill" />
              {variant === "river" && [480, 1420, 2360].map((baseX) => (
                <g key={`glints-${baseX}`} className="diorama-water-glints">
                  <rect x={baseX} y={MID_BASE + 14} width="58" height="2.6" />
                  <rect x={baseX + 250} y={MID_BASE + 24} width="86" height="2.6" />
                  <rect x={baseX + 520} y={MID_BASE + 18} width="64" height="2.6" />
                </g>
              ))}
              {variant === "market" && marketBunting.map(({ fromX, flags }) => (
                <g key={`bunting-${fromX}`} className="diorama-bunting">
                  <path d={`M${fromX} ${MID_BASE - 4} Q ${fromX + 180} ${MID_BASE + 14} ${fromX + 380} ${MID_BASE - 4}`} />
                  {flags.map((flag) => (
                    <path key={`flag-${flag.x}`} d={`M${flag.x - 5} ${flag.y} L${flag.x + 5} ${flag.y} L${flag.x} ${flag.y + 8} Z`} />
                  ))}
                </g>
              ))}
              {variant === "heights" && [700, 1900].map((baseX) => (
                <g key={`glass-${baseX}`} className="diorama-glasshouse">
                  <path d={`M${baseX} ${MID_BASE} L${baseX + 58} ${MID_BASE - 128}`} />
                  <path d={`M${baseX + 52} ${MID_BASE} L${baseX + 110} ${MID_BASE - 128}`} />
                  <path d={`M${baseX + 104} ${MID_BASE} L${baseX + 162} ${MID_BASE - 128}`} />
                </g>
              ))}
              {midWindows.map((w) => (
                <rect
                  key={`mw-${w.x}-${w.y}`}
                  x={w.x}
                  y={w.y}
                  width="7"
                  height="11"
                  className={p >= (w.seed % 4 === 0 ? 0 : windowLitAt(w.x)) ? "diorama-window lit" : "diorama-window"}
                />
              ))}
            </svg>
            </div>
          </div>
        </div>

        <div className="diorama-layer" style={{ transform: "translateZ(-48px) scale(1.044)" }}>
          <div className="diorama-sway diorama-sway-b">
            <div className="diorama-strip" style={{ width: `${geo.mid.px.toFixed(0)}px`, ...scrollStyle(geo.mid.overflow) }}>
            {STOP_X.map((worldX, index) => {
              const xPx = worldX * geo.scale;
              const screenX = geo.mid.overflow > 0 ? (xPx - p * geo.mid.overflow) / geo.layerW : 0.5;
              const arrival = geo.mid.overflow > 0
                ? Math.min(0.97, Math.max(0.03, (xPx - geo.layerW / 2) / geo.mid.overflow))
                : 0.5;
              const d = p - arrival;
              const state = d < -0.055 ? "ahead" : d <= 0.055 ? "near" : "passed";
              // Labels swing to the pole's left past mid-frame, stay hidden
              // until the signpost clears the right fog bank (and the growth
              // panel parked there), and tuck away before the left edge.
              const flip = screenX > 0.55 ? " flip" : "";
              const shroud = screenX > 0.84 || screenX < 0.04 ? " shrouded" : "";
              return (
                <div key={`sign-${index}`} className={`diorama-signpost ${state}${flip}${shroud}`} style={{ left: `${xPx.toFixed(1)}px` }}>
                  <span className="diorama-signpost-pole" />
                  <span className="diorama-signpost-lantern"><i /></span>
                  <span className="diorama-signpost-label">{stops[index]}</span>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        <div className="diorama-layer" style={{ transform: "translateZ(32px) scale(0.972)" }}>
          <div className="diorama-fog diorama-fog-b" />
        </div>

        <div className="diorama-layer" style={{ transform: "translateZ(72px) scale(0.937)" }}>
          <div className="diorama-sway diorama-sway-c">
            <div className="diorama-strip" style={{ width: `${geo.front.px.toFixed(0)}px`, ...scrollStyle(geo.front.overflow) }}>
            <svg className="diorama-svg" viewBox={`0 0 ${FRONT_STRIP_W} ${SCENE_H}`} preserveAspectRatio="none" aria-hidden="true">
              <path className="diorama-wire" d="M-60 62 Q 300 96 640 74 T 1300 84 T 1960 72 T 2620 86 T 3280 74 T 3940 84" />
              <path className="diorama-wire" d="M-60 96 Q 360 126 720 100 T 1480 108 T 2200 98 T 2920 110 T 3660 100" />
              {FRONT_LAMPS.map((x) => {
                const glow = lampGlow(x);
                return (
                  <g key={`lamp-${x}`}>
                    <ellipse cx={x + 30} cy="386" rx="46" ry="7" className="diorama-lamp-pool" style={{ opacity: 0.16 * glow }} />
                    <rect x={x - 2.4} y="266" width="4.8" height="120" className="diorama-front-fill" />
                    <path d={`M${x} 268 Q ${x + 24} 260 ${x + 29} 282`} className="diorama-front-stroke" />
                    <path d={`M${x + 20} 282 L${x + 38} 282 L${x + 33} 296 L${x + 25} 296 Z`} className="diorama-front-fill" />
                    <circle cx={x + 29} cy="300" r="17" className="diorama-lamp-glow" style={{ opacity: 0.5 * glow }} />
                    <circle cx={x + 29} cy="299" r="4.6" className="diorama-lamp-bulb" />
                  </g>
                );
              })}
              <path className="diorama-front-fill" d={`M-40 ${SCENE_H} L-40 384 L${FRONT_STRIP_W + 40} 384 L${FRONT_STRIP_W + 40} ${SCENE_H} Z`} />
              <rect x="-40" y="356" width={FRONT_STRIP_W + 80} height="3.4" className="diorama-front-fill" />
              <rect x="-40" y="368" width={FRONT_STRIP_W + 80} height="2.4" className="diorama-front-fill" />
              {Array.from({ length: 92 }, (_, i) => (
                <rect key={`post-${i}`} x={-28 + i * 40} y="356" width="3" height="30" className="diorama-front-fill" />
              ))}
            </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
