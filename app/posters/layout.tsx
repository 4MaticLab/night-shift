import type { Metadata } from "next";
import "./posters.css";

export const metadata: Metadata = {
  title: "五夜案件碎片海报 · 夜班侦探",
  description: "Night Shift 五日案件碎片、角色设计与玩家引导印刷海报。",
};

export default function PostersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
