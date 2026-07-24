import { headers } from "next/headers";
import QRCode from "qrcode";
import type { PosterDefinition } from "@/src/content/posters";

export async function getPosterOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function createPosterQr(origin: string, poster: PosterDefinition) {
  const target = new URL("/", origin);
  target.searchParams.set("utm_source", "print-poster");
  target.searchParams.set("utm_medium", "offline");
  target.searchParams.set("utm_campaign", "five-night-case-fragments");
  target.searchParams.set("utm_content", poster.qrContent);
  return QRCode.toDataURL(target.toString(), {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 440,
    color: { dark: "#0e1628", light: "#f4f7f9" },
  });
}
