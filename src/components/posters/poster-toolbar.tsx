"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";

export function PosterToolbar({ activeDay }: { activeDay?: number }) {
  return (
    <nav className="poster-toolbar" aria-label="海报预览工具">
      <Link href="/posters"><ArrowLeft /> 海报总览</Link>
      <div className="poster-day-links">
        {[1, 2, 3, 4, 5].map((day) => <Link className={activeDay === day ? "active" : ""} href={`/posters/${day}`} key={day}>第 {day} 日</Link>)}
      </div>
      <button type="button" onClick={() => window.print()}><Printer /> 打印 / 导出 PDF</button>
      <Link href="/" target="_blank">打开游戏 <ExternalLink /></Link>
    </nav>
  );
}
