import Image from "next/image";
import type { BannerDefinition } from "@/src/content/banners";

function renderHeadlineLine(line: string, staggerWord?: string) {
  if (!staggerWord || !line.includes(staggerWord)) return line;
  const index = line.indexOf(staggerWord);
  const before = line.slice(0, index);
  const after = line.slice(index + staggerWord.length);
  return (
    <>
      {before}
      <span className="banner-h1-stagger">
        {Array.from(staggerWord).map((char, i) => (
          <span key={`${char}-${i}`} data-i={i % 2}>{char}</span>
        ))}
      </span>
      {after}
    </>
  );
}

export function BannerSheet({ banner }: { banner: BannerDefinition }) {
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
          {banner.headline.split("\n").map((line) => <span key={line}>{renderHeadlineLine(line, banner.staggerWord)}</span>)}
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

        {banner.cases ? (
          <ul className="banner-cases">
            {banner.cases.map((item) => (
              <li key={item.tag}><i>{item.tag}</i><span>{item.name}</span></li>
            ))}
          </ul>
        ) : null}

        {banner.points ? (
          <ul className="banner-points">
            {banner.points.map((point) => (
              <li key={point}><span aria-hidden="true" className="banner-point-mark" />{point}</li>
            ))}
          </ul>
        ) : null}

        {banner.pull ? (
          <blockquote className="banner-pull">
            {banner.pull.split("\n").map((line) => <span key={line}>{line}</span>)}
          </blockquote>
        ) : null}

        {banner.promise ? <p className="banner-promise">{banner.promise}</p> : null}
      </div>

      <footer className="banner-footer">
        <span className="banner-footer-tick" aria-hidden="true" />
        <div className="banner-footer-copy">
          <b>{banner.footerLead}</b>
          <small>{banner.footerNote}</small>
        </div>
      </footer>

      <span className="banner-crop-note">800 × 2000 MM · ROLL-UP MASTER</span>
    </article>
  );
}
