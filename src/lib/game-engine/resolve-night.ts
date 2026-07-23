import { getPreparation, type PreparationId } from "@/src/content/preparations";
import { getCampaignRouteDirection, type CampaignManifest } from "@/src/content/campaigns/types";
import type { SleepQuality } from "./schema";

export function resolveNight(campaign: CampaignManifest, chapterNumber: number, quality: SleepQuality, preparationId: PreparationId | "" = "", choiceId = "") {
  const chapter = campaign.case.chapters.find((item) => item.number === chapterNumber);
  if (!chapter) throw new Error(`Unknown chapter ${chapterNumber}`);
  const direction = getCampaignRouteDirection(campaign, chapterNumber, choiceId);
  const clueCount = quality === "restful" ? chapter.clueIds.length : Math.min(2, chapter.clueIds.length);
  const collectibleCount = quality === "interrupted" ? 1 : quality === "regular" ? 1 : 2;
  return {
    choiceId: direction.choiceId,
    direction,
    clueIds: chapter.clueIds.slice(0, clueCount),
    collectibleIds: chapter.collectibleIds.slice(0, collectibleCount),
    route: quality === "interrupted" ? direction.routeNodes.slice(0, 3) : direction.routeNodes,
    events: direction.events,
    cityEncounter: direction.cityEncounter,
    returnLetter: direction.returnLetter,
    echo: quality === "interrupted" ? "03:06 — 你短暂醒来时，远处的铃声也停了一次。" : null,
    observation: quality === "restful" ? "天亮前，林渡还记下了窗台积水里倒映出的第二条轨道。" : null,
    preparationEcho: getPreparation(preparationId)?.echoes[chapterNumber] ?? null,
  };
}
