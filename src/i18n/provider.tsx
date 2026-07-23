"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { getCampaign } from "@/src/content/campaigns/registry";
import type { CampaignManifest } from "@/src/content/campaigns/types";
import {
  campaignSupportsLocale,
  DEFAULT_LOCALE,
  isAppLocale,
  localizeCampaign,
  localizeValue,
  LOCALE_STORAGE_KEY,
  translateText,
  type AppLocale,
} from "./core";

interface I18nContextValue {
  locale: AppLocale;
  preferredLocale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (source: string) => string;
  localize: <T>(value: T) => T;
  campaign: CampaignManifest;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const localeChangeEvent = "night-shift-locale-change";

function subscribeLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(localeChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(localeChangeEvent, onStoreChange);
  };
}

function getLocaleSnapshot(): AppLocale {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isAppLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function I18nProvider({ campaignId, children }: { campaignId: string; children: ReactNode }) {
  const preferredLocale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, () => DEFAULT_LOCALE);
  const locale = campaignSupportsLocale(campaignId, preferredLocale) ? preferredLocale : DEFAULT_LOCALE;
  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    window.dispatchEvent(new Event(localeChangeEvent));
  }, []);
  const t = useCallback((source: string) => translateText(source, locale), [locale]);
  const localize = useCallback(<T,>(value: T) => localizeValue(value, locale), [locale]);
  const campaign = useMemo(() => localizeCampaign(getCampaign(campaignId), locale), [campaignId, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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
