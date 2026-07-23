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
import { tideRefusedStoryline } from "@/src/content/storylines/tide-refused";
import { lastTramStoryline } from "@/src/content/storylines/last-tram";

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
  },
  storylines: [lastTramStoryline, tideRefusedStoryline],
});
