"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";
import { bannerSeries } from "@/src/content/banners";

const shortLabel: Record<string, string> = {
  proposition: "命题款",
  loop: "循环款",
  cases: "五案款",
  manifesto: "主张款",
  value: "差异点",
};

export function BannerToolbar({ activeId }: { activeId?: string }) {
  return (
    <nav className="banner-toolbar" aria-label="易拉宝预览工具">
      <Link href="/posters"><ArrowLeft /> 海报总览</Link>
      <div className="banner-id-links">
        {bannerSeries.map((banner) => (
          <Link className={activeId === banner.id ? "active" : ""} href={`/banners/${banner.id}`} key={banner.id}>
            {shortLabel[banner.id] ?? banner.id}
          </Link>
        ))}
        <Link className={!activeId ? "active" : ""} href="/banners">总览</Link>
      </div>
      <button type="button" onClick={() => window.print()}><Printer /> 打印 / 导出 PDF</button>
      <Link href="/" target="_blank">打开游戏 <ExternalLink /></Link>
    </nav>
  );
}
