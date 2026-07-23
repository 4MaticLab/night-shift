import { describe, expect, it } from "vitest";
import {
  appLocaleFromAcceptLanguage,
  appLocaleFromLanguageTag,
  localeCookieFromHeader,
  resolveRequestLocale,
  serializeLocaleCookie,
} from "@/src/i18n/core";

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
});
