import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PosterSheet } from "@/src/components/posters/poster-sheet";
import { PosterToolbar } from "@/src/components/posters/poster-toolbar";
import { getPoster, posterSeries } from "@/src/content/posters";
import { createPosterQr, getPosterOrigin } from "../poster-runtime";

type PosterPageProps = { params: Promise<{ day: string }> };

export function generateStaticParams() {
  return posterSeries.map((poster) => ({ day: String(poster.day) }));
}

export async function generateMetadata({ params }: PosterPageProps): Promise<Metadata> {
  const { day } = await params;
  const poster = getPoster(Number(day));
  if (!poster) return {};
  return {
    title: `第 ${poster.day} 日 · ${poster.title.replace("\n", " ")} · 夜班侦探`,
    description: poster.fragment,
  };
}

export default async function PosterDayPage({ params }: PosterPageProps) {
  const { day } = await params;
  const poster = getPoster(Number(day));
  if (!poster || String(poster.day) !== day) notFound();

  const origin = await getPosterOrigin();
  const qrSrc = await createPosterQr(origin, poster);

  return (
    <main className="poster-site">
      <PosterToolbar activeDay={poster.day} />
      <div className="poster-print-stack">
        <PosterSheet poster={poster} qrSrc={qrSrc} previewPath={`/posters/${poster.day}`} />
      </div>
      <p className="poster-print-hint">这是一张独立 A3 打印页。打印时请选择边距“无”、缩放 100% 并开启背景图形；页面导航不会进入成品。</p>
    </main>
  );
}
