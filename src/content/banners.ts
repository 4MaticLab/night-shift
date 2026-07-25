export type BannerLayout = "proposition" | "loop";

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
  promise?: string;
  primaryImage: string;
  primaryAlt: string;
  primaryPosition: string;
  cta: string;
  ctaPath: string;
  accent: string;
  qrContent: string;
}

export const bannerSeries: BannerDefinition[] = [
  {
    id: "proposition",
    layout: "proposition",
    zone: "信号带 · A 命题款",
    kicker: "ASYNC DETECTIVE · 异步侦探",
    brandName: "夜班侦探",
    brandSub: "NIGHT SHIFT DETECTIVE",
    headline: "你睡着以后，\n他才开始工作。",
    lead: "白天，你读晨报、整理线索、决定方向。\n睡着以后，侦探林渡替你进入城市调查。",
    pull: "我想早点睡，\n因为我想知道他今晚会发现什么。",
    primaryImage: "/art/headers/shift-handoff-v2.webp",
    primaryAlt: "林渡站在夜班事务所窗前，桌上摊着城市地图",
    primaryPosition: "56% center",
    cta: "扫码，接下第一宗案件",
    ctaPath: "night-shift.app",
    accent: "#698d89",
    qrContent: "banner-proposition",
  },
  {
    id: "loop",
    layout: "loop",
    zone: "理解带 · B 循环款",
    kicker: "NOT A SLEEP SCORE · 反睡眠评分",
    brandName: "夜班侦探",
    brandSub: "NIGHT SHIFT DETECTIVE",
    headline: "不是睡眠分数，\n是一座城市。",
    lead: "不是连续签到。是一座只在你休息时继续生活的城市。",
    steps: [
      "白天 · 读晨报，连接线索",
      "睡前 · 选择方向与一件随身物",
      "夜里 · 林渡进入城市",
      "清晨 · 新的报告已经送达",
    ],
    promise: "睡得短不会失败。无账号、无硬件，也能完整游玩。",
    primaryImage: "/art/headers/night-expedition-v1.webp",
    primaryAlt: "雨夜高架上的城市调查场景",
    primaryPosition: "center",
    cta: "扫码，回家继续这一夜",
    ctaPath: "night-shift.app",
    accent: "#c59a5a",
    qrContent: "banner-loop",
  },
];

export function getBanner(id: string) {
  return bannerSeries.find((banner) => banner.id === id);
}
