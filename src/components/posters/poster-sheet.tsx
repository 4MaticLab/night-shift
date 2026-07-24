import Image from "next/image";
import type { PosterDefinition } from "@/src/content/posters";

export function PosterSheet({ poster, qrSrc, previewPath }: { poster: PosterDefinition; qrSrc: string; previewPath: string }) {
  const day = String(poster.day).padStart(2, "0");
  return (
    <article
      className={`poster-sheet poster-sheet--${poster.layout}`}
      id={`poster-${poster.day}`}
      style={{ "--poster-accent": poster.accent, "--poster-image-position": poster.primaryPosition } as React.CSSProperties}
      aria-labelledby={`poster-title-${poster.day}`}
    >
      <div className="poster-grain" aria-hidden="true" />
      <header className="poster-brand">
        <div className="poster-brand-lockup">
          <Image src="/art/brand/night-shift-logo-v1.png" alt="" width={84} height={84} priority={poster.day === 1} />
          <span><b>夜班侦探</b><small>NIGHT SHIFT DETECTIVE</small></span>
        </div>
        <div className="poster-release"><small>FIVE NIGHTS · 0{poster.day}/05</small><b>{poster.release}</b></div>
      </header>

      <div className="poster-hero">
        <div className="poster-hero-image">
          <Image src={poster.primaryImage} alt={poster.primaryAlt} fill priority sizes="(max-width: 900px) 100vw, 820px" />
          <span className="poster-image-index" aria-hidden="true">{day}</span>
        </div>
        <div className="poster-title-block">
          <small>{poster.archiveCode}</small>
          <p>{poster.eyebrow}</p>
          <h1 id={`poster-title-${poster.day}`}>{poster.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
          <div className="poster-rule" />
          <strong>{poster.subtitle}</strong>
        </div>
      </div>

      <div className="poster-evidence-band">
        <figure className="poster-inset">
          <Image src={poster.secondaryImage} alt={poster.secondaryAlt} fill sizes="220px" />
        </figure>
        <section className="poster-fragment">
          <small>{poster.fragmentLabel}</small>
          <p>{poster.fragment}</p>
          <blockquote>{poster.quote}</blockquote>
        </section>
        <aside className="poster-subject">
          <small>{poster.subjectLabel}</small>
          <b>{poster.subjectName}</b>
          <p>{poster.subjectNote}</p>
        </aside>
      </div>

      <footer className="poster-footer">
        <div className="poster-onboarding">
          <span className="poster-onboarding-label">HOW TO ENTER · 玩家引导</span>
          <ol>{poster.steps.map((step, index) => <li key={step}><i>0{index + 1}</i><span>{step}</span></li>)}</ol>
        </div>
        <div className="poster-qr">
          <Image src={qrSrc} alt={`扫描二维码进入夜班侦探，第 ${poster.day} 日海报`} width={220} height={220} unoptimized />
          <span><b>{poster.cta}</b><small>{previewPath}</small></span>
        </div>
      </footer>

      <span className="poster-crop-note">A3 · 297 × 420 MM · PRINT MASTER</span>
    </article>
  );
}
