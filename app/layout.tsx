import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"] });

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
    icons: { icon: "/art/headers/night-shift-hero.png", shortcut: "/art/headers/night-shift-hero.png" },
    openGraph: { title, description, type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1672, height: 941, alt: "Night Shift 夜班侦探" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${manrope.variable} ${newsreader.variable}`}>{children}</body></html>;
}
