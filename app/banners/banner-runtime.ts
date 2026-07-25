import { headers } from "next/headers";
import QRCode from "qrcode";
import type { BannerDefinition } from "@/src/content/banners";

export async function getBannerOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function createBannerQr(origin: string, banner: BannerDefinition) {
  const target = new URL("/", origin);
  target.searchParams.set("utm_source", "print-banner");
  target.searchParams.set("utm_medium", "offline");
  target.searchParams.set("utm_campaign", "booth-roll-up");
  target.searchParams.set("utm_content", banner.qrContent);
  return QRCode.toDataURL(target.toString(), {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 480,
    color: { dark: "#0e1628", light: "#f4f7f9" },
  });
}
