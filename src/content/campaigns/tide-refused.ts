import { caseSchema } from "@/src/lib/game-engine/schema";
import { lastTramCampaign } from "./last-tram";
import { tideRefusedSandbox } from "./tide-refused-data";
import { defineCampaign } from "./types";

export const TIDE_REFUSED_CAMPAIGN_ID = "case-004";

const tideRefusedArchiveShell = caseSchema.parse({
  id: TIDE_REFUSED_CAMPAIGN_ID,
  title: "潮汐不肯归档",
  englishTitle: "The Tide Refused to Be Filed",
  chapters: [{
    number: 1,
    title: "低潮卷宗",
    subtitle: "雾灯历四十一年，第七码头。",
    cityAside: "这宗案件使用七地点沙盒，而非连续五夜。",
    question: "从哪一份委托进入河下区？",
    choices: [
      { id: "source", label: "市政打捞", note: "核对无编号档案箱。" },
      { id: "flower", label: "家属接人", note: "完成拖欠的返程。" },
      { id: "track", label: "等待退潮", note: "先观察河下区如何显影。" },
    ],
    clueIds: ["tide-archive-docket"],
    collectibleIds: ["tide-archive-tag"],
    route: ["夜班档案桌", "第七码头", "河下区低潮层"],
    events: ["返程票亮起。", "第七闸震动。", "低潮灯点燃。", "街名从盐里显现。", "河下区等待被叫出名字。"],
    journal: "这是一宗雾灯城原创沙盒卷宗。玩家可从两种身份进入，在七个地点间自由调查。",
    contradiction: "市政档案里不存在的街区，为什么仍能寄出有效返程票？",
  }],
  clues: [{
    id: "tide-archive-docket",
    title: "河下区低潮卷宗",
    summary: "两份委托、七个地点和四十三户不肯被删去的人家。",
    detail: "该条目只用于案件书架兼容；实际证物由原创沙盒案件契约管理。",
    cityObjection: "雾灯城承认水位，不承认水位下面仍有地址。",
    marginNote: "先找人，再决定怎样处置一座城的错误。",
    type: "place",
    chapter: 1,
    relatedIds: [],
  }],
  collectibles: [{
    id: "tide-archive-tag",
    title: "低潮卷宗签",
    glyph: "Ⅳ",
    assetId: "collectible.torn-ticket",
    surfaceDescription: "一张边缘析盐、写着 CASE 004 的返程卷宗签。",
    revealedDescription: "背面提醒档案员：地图删去道路，不等于道路不再通向人家。",
    district: "河下区",
    rarity: "unusual",
    chapter: 1,
  }],
});

export const tideRefusedCampaign = defineCampaign({
  id: TIDE_REFUSED_CAMPAIGN_ID,
  version: 1,
  format: "sandbox-expedition",
  sandbox: tideRefusedSandbox,
  case: tideRefusedArchiveShell,
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
    archiveNumber: "004",
    teaser: "一片被市政删去的街区，连续七晚把返程票送回岸上。",
    description: "双身份入口、七地点自由调查、冗余证据路径与四种后果收束构成的原创沙盒卷宗。",
    cityName: "雾灯城河下区",
    detectiveName: "低潮调查队",
    heroAssetId: "sandbox.tide.hero",
    nightAssetId: "header.night-expedition",
    morningAssetId: "header.morning-report",
    endingAssetId: "ending.hidden-platform",
    nightSealAssetIds: ["night-seal.01"],
    endingQuestion: "城市会先承认人，还是先保护自己的档案？",
    endingPrompt: "收场由名单、返程路线、工程责任与第七闸的处置共同决定。",
    closingRefrain: "潮水可以退去，地址不该被带走。",
  },
});
