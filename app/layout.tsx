import type { Metadata } from "next";
import { Libre_Baskerville, Noto_Serif_SC, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import { ClickSpark } from "@/src/components/click-spark";
import { InjectiveWalletProvider } from "@/src/components/injective-wallet-provider";
import { RequestLocaleProvider } from "@/src/i18n/request-locale-provider";
import { getRequestLocale } from "@/src/i18n/server";
import "./globals.css";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "600", "700"] });
const baskerville = Libre_Baskerville({ variable: "--font-baskerville", subsets: ["latin"], weight: ["400", "700"] });
const notoSerifSC = Noto_Serif_SC({ variable: "--font-noto-serif-sc", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "夜班侦探 Night Shift — When You Sleep, He Works";
  const description = "An asynchronous detective game that keeps your hours. 白天分析线索，晚上把调查交给侦探。";
  return {
    metadataBase: new URL(origin),
    title,
    description,
    icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/art/brand/night-shift-logo-v1.png" },
    openGraph: { title, description, type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1672, height: 941, alt: "夜班侦探 Night Shift" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestLocale = await getRequestLocale();
  return <html lang={requestLocale}><body className={`${playfair.variable} ${baskerville.variable} ${notoSerifSC.variable}`}><RequestLocaleProvider initialLocale={requestLocale}><InjectiveWalletProvider>{children}<ClickSpark /></InjectiveWalletProvider></RequestLocaleProvider></body></html>;
}
