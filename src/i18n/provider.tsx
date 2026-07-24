"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCampaign } from "@/src/content/campaigns/registry";
import type { CampaignManifest } from "@/src/content/campaigns/types";
import {
  campaignSupportsLocale,
  DEFAULT_LOCALE,
  isAppLocale,
  localizeCampaign,
  localizeValue,
  localeCookieFromHeader,
  LOCALE_STORAGE_KEY,
  serializeLocaleCookie,
  translateText,
  type AppLocale,
} from "./core";
import { useRequestLocale } from "./request-locale-provider";

interface I18nContextValue {
  locale: AppLocale;
  preferredLocale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (source: string) => string;
  localize: <T>(value: T) => T;
  campaign: CampaignManifest;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const requestLocale = useRequestLocale();
  const [preferredLocale, setPreferredLocale] = useState<AppLocale>(requestLocale);
  const locale = campaignSupportsLocale(campaignId, preferredLocale) ? preferredLocale : DEFAULT_LOCALE;
  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.cookie = serializeLocaleCookie(nextLocale);
    setPreferredLocale(nextLocale);
  }, []);
  const t = useCallback((source: string) => translateText(source, locale), [locale]);
  const localize = useCallback(<T,>(value: T) => localizeValue(value, locale), [locale]);
  const campaign = useMemo(() => localizeCampaign(getCampaign(campaignId), locale), [campaignId, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    const cookieLocale = localeCookieFromHeader(document.cookie);
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const legacyLocale = isAppLocale(storedLocale) ? storedLocale : undefined;

    if (cookieLocale) {
      if (legacyLocale !== cookieLocale) window.localStorage.setItem(LOCALE_STORAGE_KEY, cookieLocale);
      return;
    }
    if (!legacyLocale) return;

    document.cookie = serializeLocaleCookie(legacyLocale);
    if (legacyLocale !== requestLocale) {
      queueMicrotask(() => {
        if (!cancelled) setPreferredLocale(legacyLocale);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [requestLocale]);

  useEffect(() => {
    const syncLocale = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY || !isAppLocale(event.newValue)) return;
      document.cookie = serializeLocaleCookie(event.newValue);
      setPreferredLocale(event.newValue);
    };
    window.addEventListener("storage", syncLocale);
    return () => window.removeEventListener("storage", syncLocale);
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    preferredLocale,
    setLocale,
    t,
    localize,
    campaign,
  }), [campaign, locale, localize, preferredLocale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
