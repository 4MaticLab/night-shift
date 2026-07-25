import type { Metadata } from "next";
import "./banners.css";

export const metadata: Metadata = {
  title: "展台易拉宝预览 · 夜班侦探",
  description: "Night Shift 展台 800 × 2000 mm 易拉宝命题款与循环款印刷预览。",
};

export default function BannersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
