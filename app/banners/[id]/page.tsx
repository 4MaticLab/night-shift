import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BannerSheet } from "@/src/components/banners/banner-sheet";
import { BannerToolbar } from "@/src/components/banners/banner-toolbar";
import { bannerSeries, getBanner } from "@/src/content/banners";

type BannerPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return bannerSeries.map((banner) => ({ id: banner.id }));
}

export async function generateMetadata({ params }: BannerPageProps): Promise<Metadata> {
  const { id } = await params;
  const banner = getBanner(id);
  if (!banner) return {};
  return {
    title: `易拉宝 · ${banner.zone} · 夜班侦探`,
    description: banner.lead.replace("\n", " "),
  };
}

export default async function BannerDetailPage({ params }: BannerPageProps) {
  const { id } = await params;
  const banner = getBanner(id);
  if (!banner) notFound();

  return (
    <main className="banner-site banner-site--single">
      <BannerToolbar activeId={banner.id} />
      <div className="banner-print-stack">
        <BannerSheet banner={banner} />
      </div>
      <p className="banner-print-hint">这是一款独立 800 × 2000 mm 易拉宝。截图导出前请把浏览器缩放保持 100%，页面导航不会进入成品。</p>
    </main>
  );
}
