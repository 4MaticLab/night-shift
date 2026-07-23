import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_KEY, resolveRequestLocale } from "./core";

export async function getRequestLocale() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  return resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE_KEY)?.value,
    requestHeaders.get("accept-language"),
  );
}
