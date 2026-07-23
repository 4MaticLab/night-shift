import type { CampaignManifest } from "@/src/content/campaigns/types";
import { LAST_TRAM_CAMPAIGN_ID } from "@/src/content/campaigns/last-tram";
import { englishText } from "./en";

export const appLocales = ["zh-CN", "en"] as const;
export type AppLocale = (typeof appLocales)[number];
export const DEFAULT_LOCALE: AppLocale = "zh-CN";
export const LOCALE_STORAGE_KEY = "night-shift-locale";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && appLocales.includes(value as AppLocale);
}

export function campaignSupportsLocale(campaignId: string, locale: AppLocale): boolean {
  return locale === "zh-CN" || campaignId === LAST_TRAM_CAMPAIGN_ID;
}

export function translateText(source: string, locale: AppLocale): string {
  if (locale !== "en") return source;
  const translated = englishText[source] ?? source;
  return translated
    .replace(/\bFog Lights? City\b|\bFog Lamp City\b/g, "Foglight City")
    .replace(/\bMina Soler\b/g, "Mina Solair")
    .replace(/\bGideon (?:Weil|Weir)\b/g, "Gideon Vale")
    .replace(/\bEvelyn (?:Quill|Quayle)\b/g, "Evelyn Quell")
    .replace(/\bDenggang District\b|\bPort District\b/g, "Lantern Wharf")
    .replace(/\bDenggang\b/g, "Lantern Wharf")
    .replace(/\bThe old Ziwu District\b/g, "Old Meridian")
    .replace(/\bnight shift office\b/gi, "Night Shift Agency")
    .replace(/\blast (?:bus|train)\b/gi, (match) => match[0] === "L" ? "Last tram" : "last tram")
    .replace(/\bbus shelter\b/gi, "tram shelter");
}

export function localizeValue<T>(value: T, locale: AppLocale): T {
  if (locale !== "en") return value;
  if (typeof value === "string") return translateText(value, locale) as T;
  if (Array.isArray(value)) return value.map((item) => localizeValue(item, locale)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, localizeValue(item, locale)]),
    ) as T;
  }
  return value;
}

const englishCampaignCache = new WeakMap<CampaignManifest, CampaignManifest>();

export function localizeCampaign(campaign: CampaignManifest, locale: AppLocale): CampaignManifest {
  if (locale !== "en" || !campaignSupportsLocale(campaign.id, locale)) return campaign;
  const cached = englishCampaignCache.get(campaign);
  if (cached) return cached;
  const localized = localizeValue(campaign, locale);
  englishCampaignCache.set(campaign, localized);
  return localized;
}
