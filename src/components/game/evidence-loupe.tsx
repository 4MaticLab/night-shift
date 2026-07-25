"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Search } from "lucide-react";
import { computeLoupe, type LoupeGeometry } from "@/src/lib/ui/loupe";
import { useI18n } from "@/src/i18n/provider";

interface EvidenceLoupeProps {
  src: string;
  alt: string;
  caption?: string;
  /** Extra class appended to the figure so callers can reuse existing frames. */
  className?: string;
  /** Magnification inside the lens. */
  zoom?: number;
  /** Lens diameter in pixels. */
  lensSize?: number;
}

/**
 * A reusable investigative loupe: hover (desktop) or press-and-drag (touch)
 * over an evidence image to inspect a magnified circular detail. Screen-only —
 * the underlying image stays intact for print and reduced-motion contexts.
 */
export function EvidenceLoupe({ src, alt, caption, className, zoom = 2.2, lensSize = 156 }: EvidenceLoupeProps) {
  const { locale } = useI18n();
  const frameRef = useRef<HTMLElement>(null);
  const [geo, setGeo] = useState<LoupeGeometry | null>(null);
  const pinnedRef = useRef(false);

  const track = useCallback((clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setGeo(computeLoupe({
      pointerX: clientX - rect.left,
      pointerY: clientY - rect.top,
      width: rect.width,
      height: rect.height,
      lensSize,
      zoom,
    }));
  }, [lensSize, zoom]);

  const hint = locale === "en" ? "Move closer to inspect" : "移近查看细节";

  return (
    <figure
      ref={frameRef}
      className={className ? `evidence-loupe ${className}` : "evidence-loupe"}
      data-active={geo ? "true" : undefined}
      onMouseMove={(event) => track(event.clientX, event.clientY)}
      onMouseLeave={() => {
        if (!pinnedRef.current) setGeo(null);
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (!touch) return;
        pinnedRef.current = true;
        track(touch.clientX, touch.clientY);
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        if (touch) track(touch.clientX, touch.clientY);
      }}
      onTouchEnd={() => {
        pinnedRef.current = false;
        setGeo(null);
      }}
    >
      <Image className="report-hero-art" src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 60vw" />
      {geo && (
        <span
          className="evidence-loupe-lens"
          aria-hidden="true"
          style={{
            left: `${geo.lensLeft}px`,
            top: `${geo.lensTop}px`,
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            backgroundImage: `url("${src}")`,
            backgroundSize: `${geo.backgroundSize}%`,
            backgroundPosition: `${geo.backgroundX}% ${geo.backgroundY}%`,
          }}
        />
      )}
      <span className="evidence-loupe-hint" aria-hidden="true"><Search size={12} /> {hint}</span>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
