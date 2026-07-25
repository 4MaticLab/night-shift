import Image from "next/image";
import type { BannerDefinition } from "@/src/content/banners";

export function BannerSheet({ banner, qrSrc }: { banner: BannerDefinition; qrSrc: string }) {
  return (
    <article
      className={`banner-sheet banner-sheet--${banner.layout}`}
      id={`banner-${banner.id}`}
      style={{ "--banner-accent": banner.accent, "--banner-image-position": banner.primaryPosition } as React.CSSProperties}
      aria-labelledby={`banner-title-${banner.id}`}
    >
      <div className="banner-grain" aria-hidden="true" />

      <header className="banner-brand">
        <div className="banner-brand-lockup">
          <Image src="/art/brand/night-shift-logo-v1.png" alt="" width={96} height={96} priority />
          <span><b>{banner.brandName}</b><small>{banner.brandSub}</small></span>
        </div>
        <small className="banner-kicker">{banner.kicker}</small>
      </header>

      <div className="banner-hero">
        <Image src={banner.primaryImage} alt={banner.primaryAlt} fill priority sizes="(max-width: 900px) 100vw, 520px" />
        <div className="banner-hero-veil" aria-hidden="true" />
        <h1 id={`banner-title-${banner.id}`}>
          {banner.headline.split("\n").map((line) => <span key={line}>{line}</span>)}
        </h1>
      </div>

      <div className="banner-body">
        <div className="banner-rule" />
        <p className="banner-lead">
          {banner.lead.split("\n").map((line) => <span key={line}>{line}</span>)}
        </p>

        {banner.steps ? (
          <ol className="banner-steps">
            {banner.steps.map((step, index) => (
              <li key={step}><i>0{index + 1}</i><span>{step}</span></li>
            ))}
          </ol>
        ) : null}

        {banner.pull ? (
          <blockquote className="banner-pull">
            {banner.pull.split("\n").map((line) => <span key={line}>{line}</span>)}
          </blockquote>
        ) : null}

        {banner.promise ? <p className="banner-promise">{banner.promise}</p> : null}
      </div>

      <footer className="banner-footer">
        <div className="banner-qr">
          <Image src={qrSrc} alt={`扫描二维码进入夜班侦探 · ${banner.zone}`} width={240} height={240} unoptimized />
        </div>
        <div className="banner-cta">
          <b>{banner.cta}</b>
          <small>{banner.ctaPath}</small>
        </div>
      </footer>

      <span className="banner-crop-note">800 × 2000 MM · ROLL-UP MASTER</span>
    </article>
  );
}
