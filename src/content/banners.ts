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
}

export const bannerSeries: BannerDefinition[] = [
  {
    id: "proposition",
    layout: "proposition",
    zone: "信号带 · 命题款",
    kicker: "ASYNC DETECTIVE · 异步侦探",
    brandName: "夜班侦探",
    brandSub: "NIGHT SHIFT DETECTIVE",
    headline: "你睡着以后，\n他才开始工作。",
    lead: "白天，你读晨报、整理线索、决定方向。\n睡着以后，侦探林渡替你进入城市调查。",
    pull: "我想早点睡，\n因为我想知道他今晚会发现什么。",
    footerLead: "一款与你轮班生活的异步侦探游戏",
    footerNote: "NIGHT SHIFT · 现场演示台就在这里",
    primaryImage: "/art/headers/shift-handoff-v2.webp",
    primaryAlt: "林渡站在夜班事务所窗前，桌上摊着城市地图",
    primaryPosition: "56% center",
    accent: "#698d89",
  },
  {
    id: "loop",
    layout: "loop",
    zone: "理解带 · 循环款",
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
    footerLead: "关掉屏幕，世界继续行动",
    footerNote: "NIGHT SHIFT · 你睡着以后，他才开始工作",
    primaryImage: "/art/headers/night-expedition-v1.webp",
    primaryAlt: "雨夜高架上的城市调查场景",
    primaryPosition: "center",
    accent: "#c59a5a",
  },
  {
    id: "cases",
    layout: "cases",
    zone: "展示带 · 五案款",
    kicker: "FIVE CASES · 25 NIGHTS",
    brandName: "夜班侦探",
    brandSub: "NIGHT SHIFT DETECTIVE",
    headline: "五套案件，\n一条昼夜循环。",
    lead: "共用同一条“交接—等待—晨报”的循环，却各自拥有独立线索、推理与结局。",
    cases: [
      { tag: "CASE 001", name: "零点四十三分的末班车" },
      { tag: "CASE 002", name: "只在雨中播出的电台" },
      { tag: "CASE 003", name: "黎明前出炉的第十三个面包" },
      { tag: "CASE 004", name: "千早诺亚的第十三次旅行" },
      { tag: "CASE 005", name: "雾中无狼" },
    ],
    footerLead: "每案三幕序章 · 五夜循环 · 三种结局",
    footerNote: "NIGHT SHIFT · 五套完整案件已可游玩",
    primaryImage: "/art/headers/morning-report-v1.webp",
    primaryAlt: "黎明归来的城市与晨报画面",
    primaryPosition: "center",
    accent: "#8fb2bb",
  },
  {
    id: "manifesto",
    layout: "manifesto",
    zone: "主张带 · 重新创造休息",
    kicker: "HACK THE REST · 重新创造休息",
    brandName: "夜班侦探",
    brandSub: "NIGHT SHIFT DETECTIVE",
    headline: "别人让 AI 替你工作，\n我们让世界\n在你休息时生活。",
    lead: "大多数产品用分数告诉你“昨晚够不够好”，只制造新的焦虑。Night Shift 不评价休息，只给你一个愿意离开屏幕的理由。",
    pull: "休息本身，\n就是推动世界前进的行动。",
    footerLead: "把休息变成世界输入，而不是健康分数",
    footerNote: "NIGHT SHIFT · Hack the Rest",
    primaryImage: "/art/endings/hidden-platform-tableau-v1.webp",
    primaryAlt: "隐藏站台的决定场景",
    primaryPosition: "center",
    accent: "#8b4f4c",
  },
  {
    id: "value",
    layout: "value",
    zone: "评审带 · 三个差异点",
    kicker: "WHY IT WINS · 三个差异点",
    brandName: "夜班侦探",
    brandSub: "NIGHT SHIFT DETECTIVE",
    headline: "不评价睡眠，\n重写休息的理由。",
    lead: "无后端可玩、真实时间恢复、非惩罚设计——都是工程事实，不是概念拼接。",
    points: [
      "把休息变成世界输入，而不是健康分数",
      "把 AI 放在情绪表达层，不改写悬疑真相",
      "local-first：无账号、无硬件、离线也能演示",
    ],
    promise: "三套案件形态、真实夜班恢复与多案件存档均已实现。",
    footerLead: "现场无网也能完整演示核心循环",
    footerNote: "NIGHT SHIFT · 夜班侦探",
    primaryImage: "/art/districts/lantern-wharf-v1.webp",
    primaryAlt: "灯港区的雨夜城市版画",
    primaryPosition: "center",
    accent: "#b8894e",
  },
];

export function getBanner(id: string) {
  return bannerSeries.find((banner) => banner.id === id);
}
