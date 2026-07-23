"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type AppLocale } from "./core";

const RequestLocaleContext = createContext<AppLocale>(DEFAULT_LOCALE);

export function RequestLocaleProvider({ initialLocale, children }: { initialLocale: AppLocale; children: ReactNode }) {
  return <RequestLocaleContext.Provider value={initialLocale}>{children}</RequestLocaleContext.Provider>;
}

export function useRequestLocale() {
  return useContext(RequestLocaleContext);
}
