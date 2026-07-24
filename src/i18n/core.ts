import type { CampaignManifest } from "@/src/content/campaigns/types";
import { LAST_TRAM_CAMPAIGN_ID } from "@/src/content/campaigns/last-tram";
import { RAIN_RADIO_CAMPAIGN_ID } from "@/src/content/campaigns/rain-radio";
import { englishText } from "./en";

export const appLocales = ["zh-CN", "en"] as const;
export type AppLocale = (typeof appLocales)[number];
export const DEFAULT_LOCALE: AppLocale = "zh-CN";
export const LOCALE_STORAGE_KEY = "night-shift-locale";
export const LOCALE_COOKIE_KEY = "night-shift-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && appLocales.includes(value as AppLocale);
}

export function appLocaleFromLanguageTag(value: string | null | undefined): AppLocale | undefined {
  const language = value?.trim().toLowerCase().replaceAll("_", "-");
  if (!language) return undefined;
  if (language === "en" || language.startsWith("en-")) return "en";
  if (language === "zh" || language.startsWith("zh-")) return "zh-CN";
  return undefined;
}

export function appLocaleFromAcceptLanguage(value: string | null | undefined): AppLocale | undefined {
  if (!value) return undefined;
  const preferences = value.split(",").flatMap((entry, index) => {
    const [language = "", ...parameters] = entry.trim().split(";");
    const qualityParameter = parameters.find((parameter) => parameter.trim().toLowerCase().startsWith("q="));
    const parsedQuality = qualityParameter ? Number.parseFloat(qualityParameter.split("=")[1] ?? "") : 1;
    const quality = Number.isFinite(parsedQuality) ? Math.min(1, Math.max(0, parsedQuality)) : 0;
    return quality > 0 ? [{ language, quality, index }] : [];
  }).sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const preference of preferences) {
    const locale = appLocaleFromLanguageTag(preference.language);
    if (locale) return locale;
  }
  return undefined;
}

export function localeCookieFromHeader(cookieHeader: string | null | undefined): AppLocale | undefined {
  if (!cookieHeader) return undefined;
  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0) continue;
    const name = entry.slice(0, separator).trim();
    if (name !== LOCALE_COOKIE_KEY) continue;
    const rawValue = entry.slice(separator + 1).trim();
    try {
      const value = decodeURIComponent(rawValue);
      return isAppLocale(value) ? value : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function resolveRequestLocale(cookieLocale: unknown, acceptLanguage: string | null | undefined): AppLocale {
  if (isAppLocale(cookieLocale)) return cookieLocale;
  return appLocaleFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}

export function serializeLocaleCookie(locale: AppLocale): string {
  return `${LOCALE_COOKIE_KEY}=${encodeURIComponent(locale)}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function campaignSupportsLocale(campaignId: string, locale: AppLocale): boolean {
  return locale === "zh-CN" || campaignId === LAST_TRAM_CAMPAIGN_ID || campaignId === RAIN_RADIO_CAMPAIGN_ID;
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
