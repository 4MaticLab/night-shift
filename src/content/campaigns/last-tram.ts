import { nightShiftCase } from "@/src/content/case";
import { routeDirections } from "@/src/content/routes";
import { evidenceRelations } from "@/src/content/relations";
import { endingEpilogues } from "@/src/content/endings";
import { journeyPostcards } from "@/src/content/postcards";
import { nightBotanicals } from "@/src/content/botany";
import { cityWatchEchoes } from "@/src/content/watches";
import { wakeEchoes } from "@/src/content/wake-echoes";
import { caseCharacters } from "@/src/content/characters";
import { cityDistricts } from "@/src/content/districts";
import { defineCampaign } from "./types";

export const LAST_TRAM_CAMPAIGN_ID = "case-001";

export const lastTramCampaign = defineCampaign({
  id: LAST_TRAM_CAMPAIGN_ID,
  version: 1,
  case: nightShiftCase,
  routes: routeDirections,
  relations: evidenceRelations,
  endings: endingEpilogues,
  postcards: journeyPostcards,
  botanicals: nightBotanicals,
  watchEchoes: cityWatchEchoes,
  wakeEchoes,
  characters: caseCharacters,
  districts: cityDistricts,
  rules: {
    trueEndingId: "return",
    requiredClueCount: nightShiftCase.clues.length,
    requiredCollectibleCount: 7,
    requiredRelationCount: evidenceRelations.length,
  },
  presentation: {
    archiveNumber: "001",
    teaser: "一辆不存在的电车，每晚仍在穿过这座城市。",
    description: "追查被城市否认的四十三号线，把失踪者的选择权送回原处。",
    cityName: "雾灯城",
    detectiveName: "林渡",
    heroAssetId: "header.night-shift.hero",
    nightAssetId: "header.night-expedition",
    morningAssetId: "header.morning-report",
    endingAssetId: "ending.hidden-platform",
    nightSealAssetIds: nightShiftCase.chapters.map((chapter) => `night-seal.0${chapter.number}`),
    endingQuestion: "最后的决定，由你写进档案。",
    endingPrompt: "伊芙琳把账册留在站台，却没有把决定也留下。三种真相，都有各自的代价。",
    closingRefrain: "城市里仍有许多灯，只在你睡着以后亮起。",
    prologue: {
      scenes: [
        {
          stage: "incident",
          eyebrow: "凌晨 00:43 · 事务所门缝",
          title: "一张来自昨天的旧车票",
          body: "雨停以后，夜班事务所门缝下多出一张四十三号线车票。纸张已经老化七年，油墨却还带着昨夜的潮气；雾灯城市政厅坚持，这条线路从未存在。",
          aside: "车票背面只有一句铅笔字：如果你们还记得终点，请别替我下车。",
          assetId: "header.night-shift.hero",
        },
        {
          stage: "evidence",
          eyebrow: "接案物证 · 被撕掉的终点",
          title: "有人仍在为一条废线守夜",
          body: "票边沾着夜香花粉，剪票孔来自一台断电七年的机器。每隔四十三天，灯港花店都会收到一笔没有姓名的订单；同一个清晨，城里总有人听见电车铃。",
          aside: "你负责在白天连接证词。林渡会在夜里沿着纸、花粉与铁轨继续追查。",
          assetId: "collectible.torn-ticket",
        },
        {
          stage: "handoff",
          eyebrow: "第一夜交接 · 林渡",
          title: "今晚先让纸张开口",
          body: "林渡把车票夹进防水证物袋，肩包里只留一盏灯和一张空地图。他会从封闭维修站出发，赶在清晨以前确认：是谁让一张不存在的车票继续售出。",
          aside: "“你可以去睡。等你醒来，我会把城市撒过的第一句谎带回来。”",
          assetId: "header.night-expedition",
        },
      ],
      acceptLabel: "接下案件，进入事务所",
    },
  },
});
