"use client";

import { LoadingScreenFrame } from "@/src/components/game/loading-screen";
import { useRequestLocale } from "@/src/i18n/request-locale-provider";

export default function Loading() {
  const locale = useRequestLocale();
  return <LoadingScreenFrame locale={locale} />;
}
