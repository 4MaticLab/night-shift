import Image from "next/image";
import type { PosterDefinition } from "@/src/content/posters";
import { translateText, type AppLocale } from "@/src/i18n/core";

export function PosterSheet({ poster, qrSrc, previewPath, locale = "zh-CN" }: { poster: PosterDefinition; qrSrc: string; previewPath: string; locale?: AppLocale }) {
  const t = (source: string) => translateText(source, locale);
  const day = String(poster.day).padStart(2, "0");
  const qrAlt = locale === "en"
    ? `Scan the QR code to enter Night Shift Detective, Day ${poster.day} poster`
    : `扫描二维码进入夜班侦探，第 ${poster.day} 日海报`;
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
          <span><b>{t("夜班侦探")}</b><small>NIGHT SHIFT DETECTIVE</small></span>
        </div>
        <div className="poster-release"><small>FIVE NIGHTS · 0{poster.day}/05</small><b>{t(poster.release)}</b></div>
      </header>

      <div className="poster-hero">
        <div className="poster-hero-image">
          <Image src={poster.primaryImage} alt={t(poster.primaryAlt)} fill priority sizes="(max-width: 900px) 100vw, 820px" />
          <span className="poster-image-index" aria-hidden="true">{day}</span>
        </div>
        <div className="poster-title-block">
          <small>{poster.archiveCode}</small>
          <p>{t(poster.eyebrow)}</p>
          <h1 id={`poster-title-${poster.day}`}>{t(poster.title).split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
          <div className="poster-rule" />
          <strong>{t(poster.subtitle)}</strong>
        </div>
      </div>

      <div className="poster-evidence-band">
        <figure className="poster-inset">
          <Image src={poster.secondaryImage} alt={t(poster.secondaryAlt)} fill sizes="220px" />
        </figure>
        <section className="poster-fragment">
          <small>{t(poster.fragmentLabel)}</small>
          <p>{t(poster.fragment)}</p>
          <blockquote>{t(poster.quote)}</blockquote>
        </section>
        <aside className="poster-subject">
          <small>{t(poster.subjectLabel)}</small>
          <b>{t(poster.subjectName)}</b>
          <p>{t(poster.subjectNote)}</p>
        </aside>
      </div>

      <footer className="poster-footer">
        <div className="poster-onboarding">
          <span className="poster-onboarding-label">{t("HOW TO ENTER · 玩家引导")}</span>
          <ol>{poster.steps.map((step, index) => <li key={step}><i>0{index + 1}</i><span>{t(step)}</span></li>)}</ol>
        </div>
        <div className="poster-qr">
          <Image src={qrSrc} alt={qrAlt} width={220} height={220} unoptimized />
          <span><b>{t(poster.cta)}</b><small>{previewPath}</small></span>
        </div>
      </footer>

      <span className="poster-crop-note">A3 · 297 × 420 MM · PRINT MASTER</span>
    </article>
  );
}
