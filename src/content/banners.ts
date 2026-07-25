export type BannerLayout = "proposition" | "loop" | "cases" | "manifesto" | "value";

export interface BannerCase {
  tag: string;
  name: string;
}

export interface BannerDefinition {
  id: string;
  layout: BannerLayout;
  zone: string;
  kicker: string;
  brandName: string;
  brandSub: string;
  headline: string;
  lead: string;
  pull?: string;
  steps?: string[];
  cases?: BannerCase[];
  points?: string[];
  promise?: string;
  footerLead: string;
  footerNote: string;
  primaryImage: string;
  primaryAlt: string;
  primaryPosition: string;
  accent: string;
  staggerWord?: string;
}

export const bannerSeries: BannerDefinition[] = [
  {
    id: "proposition",
    layout: "proposition",
    zone: "信号带 · 命题款",
    kicker: "NIGHT SHIFT",
    brandName: "夜班侦探",
    brandSub: "NIGHT SHIFT DETECTIVE",
    headline: "熄灯之后\n真相苏醒",
    lead: "城市睡去以后，真相才露出痕迹\n他守在黑暗里，等待第一个谎言开口",
    pull: "我不是在等天亮\n我在等破绽……",
    footerLead: "关掉屏幕，世界继续行动",
    footerNote: "NIGHT SHIFT · 你睡着以后，他才开始工作",
    primaryImage: "/art/headers/shift-handoff-v2.webp",
    primaryAlt: "林渡站在夜班事务所窗前，桌上摊着城市地图",
    primaryPosition: "56% center",
    accent: "#698d89",
  },
];

export function getBanner(id: string) {
  return bannerSeries.find((banner) => banner.id === id);
}
