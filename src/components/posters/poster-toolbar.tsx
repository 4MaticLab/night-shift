"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";
import { translateText } from "@/src/i18n/core";
import { useRequestLocale } from "@/src/i18n/request-locale-provider";

export function PosterToolbar({ activeDay }: { activeDay?: number }) {
  const locale = useRequestLocale();
  const t = (source: string) => translateText(source, locale);
  return (
    <nav className="poster-toolbar" aria-label={t("海报预览工具")}>
      <Link href="/posters"><ArrowLeft /> {t("海报总览")}</Link>
      <div className="poster-day-links">
        {[1, 2, 3, 4, 5].map((day) => <Link className={activeDay === day ? "active" : ""} href={`/posters/${day}`} key={day}>{locale === "en" ? `Day ${day}` : `第 ${day} 日`}</Link>)}
      </div>
      <button type="button" onClick={() => window.print()}><Printer /> {t("打印 / 导出 PDF")}</button>
      <Link href="/" target="_blank">{t("打开游戏")} <ExternalLink /></Link>
    </nav>
  );
}
