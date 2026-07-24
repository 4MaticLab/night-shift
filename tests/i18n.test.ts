import { describe, expect, it } from "vitest";
import {
  appLocaleFromAcceptLanguage,
  appLocaleFromLanguageTag,
  localizeValue,
  localeCookieFromHeader,
  resolveRequestLocale,
  serializeLocaleCookie,
} from "@/src/i18n/core";
import { preparations } from "@/src/content/preparations";
import { rainRadioCampaign } from "@/src/content/campaigns/rain-radio";

describe("request locale negotiation", () => {
  it("maps supported browser language tags", () => {
    expect(appLocaleFromLanguageTag("en-US")).toBe("en");
    expect(appLocaleFromLanguageTag("zh-Hant-TW")).toBe("zh-CN");
    expect(appLocaleFromLanguageTag("fr-FR")).toBeUndefined();
  });

  it("respects quality weights and ignores unsupported languages", () => {
    expect(appLocaleFromAcceptLanguage("fr-FR, en-US;q=0.8, zh-CN;q=0.9")).toBe("zh-CN");
    expect(appLocaleFromAcceptLanguage("fr-FR, en-GB;q=0.8")).toBe("en");
    expect(appLocaleFromAcceptLanguage("en;q=0, fr-FR;q=1")).toBeUndefined();
  });

  it("lets a valid preference cookie override the browser language", () => {
    expect(resolveRequestLocale("en", "zh-CN,zh;q=0.9")).toBe("en");
    expect(resolveRequestLocale("zh-CN", "en-US,en;q=0.9")).toBe("zh-CN");
  });

  it("falls through invalid cookies to browser language and then Chinese", () => {
    expect(resolveRequestLocale("de", "en-US,en;q=0.9")).toBe("en");
    expect(resolveRequestLocale(undefined, "fr-FR")).toBe("zh-CN");
  });

  it("reads and writes the locale cookie without consuming unrelated cookies", () => {
    expect(localeCookieFromHeader("theme=night; night-shift-locale=en; save=local")).toBe("en");
    expect(localeCookieFromHeader("night-shift-locale=unknown")).toBeUndefined();
    expect(serializeLocaleCookie("zh-CN")).toContain("night-shift-locale=zh-CN; Path=/;");
    expect(serializeLocaleCookie("zh-CN")).toContain("SameSite=Lax");
  });

  it("projects every preparation into English without changing stable IDs", () => {
    const localized = localizeValue(preparations, "en");
    expect(localized.map((item) => item.id)).toEqual(preparations.map((item) => item.id));
    expect(localized.map((item) => `${item.title} ${item.shortTitle} ${item.description}`).join(" ")).not.toMatch(/\p{Script=Han}/u);
  });
});

describe("rain-radio English projection", () => {
  const localized = localizeValue(rainRadioCampaign, "en");

  it("returns a new object, not the same reference", () => {
    expect(localized).not.toBe(rainRadioCampaign);
  });

  it("preserves all stable IDs", () => {
    expect(localized.id).toBe(rainRadioCampaign.id);
    expect(localized.case.clues.map((c) => c.id)).toEqual(rainRadioCampaign.case.clues.map((c) => c.id));
    expect(localized.case.collectibles.map((c) => c.id)).toEqual(rainRadioCampaign.case.collectibles.map((c) => c.id));
    expect(localized.routes.map((r) => r.id)).toEqual(rainRadioCampaign.routes.map((r) => r.id));
    expect(localized.syntheses.map((item) => item.id)).toEqual(rainRadioCampaign.syntheses.map((item) => item.id));
    expect(localized.endings.map((e) => e.id)).toEqual(rainRadioCampaign.endings.map((e) => e.id));
    expect(localized.postcards.map((p) => p.id)).toEqual(rainRadioCampaign.postcards.map((p) => p.id));
    expect(localized.botanicals.map((b) => b.id)).toEqual(rainRadioCampaign.botanicals.map((b) => b.id));
    expect(localized.wakeEchoes.map((w) => w.id)).toEqual(rainRadioCampaign.wakeEchoes.map((w) => w.id));
    expect(localized.districts.map((d) => d.id)).toEqual(rainRadioCampaign.districts.map((d) => d.id));
  });

  it("preserves rules exactly", () => {
    expect(localized.rules).toEqual(rainRadioCampaign.rules);
  });

  it("leaves no Han characters in player-visible strings", () => {
    const json = JSON.stringify(localized);
    expect(json).not.toMatch(/\p{Script=Han}/u);
  });
});
