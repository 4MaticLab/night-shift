"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";

export function BannerToolbar({ activeId }: { activeId?: string }) {
  return (
    <nav className="banner-toolbar" aria-label="易拉宝预览工具">
      <Link href="/posters"><ArrowLeft /> 海报总览</Link>
      <div className="banner-id-links">
        <Link className={activeId === "proposition" ? "active" : ""} href="/banners/proposition">命题款</Link>
        <Link className={activeId === "loop" ? "active" : ""} href="/banners/loop">循环款</Link>
        <Link className={!activeId ? "active" : ""} href="/banners">两款并排</Link>
      </div>
      <button type="button" onClick={() => window.print()}><Printer /> 打印 / 导出 PDF</button>
      <Link href="/" target="_blank">打开游戏 <ExternalLink /></Link>
    </nav>
  );
}
