import { caseSchema } from "@/src/lib/game-engine/schema";
import { lastTramCampaign } from "./last-tram";
import { blackwaterCreekSandbox } from "./blackwater-creek-data";
import { defineCampaign } from "./types";

export const BLACKWATER_CREEK_CAMPAIGN_ID = "case-003";

const blackwaterArchiveShell = caseSchema.parse({
  id: BLACKWATER_CREEK_CAMPAIGN_ID,
  title: "黑水溪",
  englishTitle: "Blackwater Creek",
  chapters: [{
    number: 1,
    title: "异地卷宗",
    subtitle: "1926 年，密斯卡托尼克谷地。",
    cityAside: "这宗案件使用地点沙盒，而非连续五夜。",
    question: "从哪一份委托进入山谷？",
    choices: [
      { id: "source", label: "大学搜救", note: "寻找失联的罗德斯夫妇。" },
      { id: "flower", label: "私酒委托", note: "接管卡莫迪家的供货。" },
      { id: "track", label: "阅览卷宗", note: "先理解山谷的风险。" },
    ],
    clueIds: ["blackwater-archive-docket"],
    collectibleIds: ["blackwater-archive-tag"],
    route: ["夜班档案桌", "阿卡姆或波士顿", "密斯卡托尼克谷地"],
    events: ["委托归档。", "身份确认。", "车辆离城。", "山路变窄。", "黑水溪在黄昏出现。"],
    journal: "这是一宗来自异地与旧时代的封存卷宗。玩家不按固定章节推进，而是在九个地点之间自由调查。",
    contradiction: "两份目的相反的委托，为什么都指向同一条重新流淌的溪水？",
  }],
  clues: [{
    id: "blackwater-archive-docket",
    title: "黑水溪异地卷宗",
    summary: "两份委托、九个地点和一条活着的溪流。",
    detail: "该占位条目只用于与既有案件书架兼容；实际证物由沙盒案件契约管理。",
    cityObjection: "雾灯城拒绝为另一个时代的山谷作证，但允许它把档案暂放一夜。",
    marginNote: "不要把地点沙盒压缩成唯一一条路。",
    type: "place",
    chapter: 1,
    relatedIds: [],
  }],
  collectibles: [{
    id: "blackwater-archive-tag",
    title: "异地卷宗签",
    glyph: "Ⅲ",
    assetId: "collectible.torn-ticket",
    surfaceDescription: "一张写着 1926 与 Blackwater Creek 的临时卷宗签。",
    revealedDescription: "签条提醒档案员：实际案件使用独立沙盒存档。",
    district: "密斯卡托尼克谷地",
    rarity: "unusual",
    chapter: 1,
  }],
});

export const blackwaterCreekCampaign = defineCampaign({
  id: BLACKWATER_CREEK_CAMPAIGN_ID,
  version: 1,
  format: "sandbox-expedition",
  sandbox: blackwaterCreekSandbox,
  case: blackwaterArchiveShell,
  routes: lastTramCampaign.routes.filter((route) => route.chapter === 1),
  relations: [],
  endings: lastTramCampaign.endings,
  postcards: lastTramCampaign.postcards.filter((item) => item.chapter === 1),
  botanicals: lastTramCampaign.botanicals.filter((item) => item.chapter === 1),
  watchEchoes: lastTramCampaign.watchEchoes.filter((item) => item.chapter === 1),
  wakeEchoes: lastTramCampaign.wakeEchoes.filter((item) => item.chapter === 1),
  characters: [],
  districts: [],
  rules: {
    trueEndingId: "return",
    requiredClueCount: 0,
    requiredCollectibleCount: 0,
    requiredRelationCount: 0,
  },
  presentation: {
    archiveNumber: "003",
    teaser: "1926 年，一条重新流淌的黑色溪水让整座山谷共享同一个梦。",
    description: "双身份入口、九地点自由调查、动态势力与渐进污染构成的完整沙盒卷宗。",
    cityName: "密斯卡托尼克谷地",
    detectiveName: "调查小队",
    heroAssetId: "header.night-expedition",
    nightAssetId: "header.night-expedition",
    morningAssetId: "header.morning-report",
    endingAssetId: "ending.hidden-platform",
    nightSealAssetIds: ["night-seal.01"],
    endingQuestion: "谁能把真相带出黑水溪？",
    endingPrompt: "这宗案件的收场由地点、人物、污染和行动共同决定。",
    closingRefrain: "山谷不要求被相信，只要求被带回。",
  },
});
