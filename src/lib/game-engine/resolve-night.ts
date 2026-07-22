import { nightShiftCase } from "@/src/content/case";
import type { SleepQuality } from "./schema";

export function resolveNight(chapterNumber: number, quality: SleepQuality) {
  const chapter = nightShiftCase.chapters[chapterNumber - 1];
  if (!chapter) throw new Error(`Unknown chapter ${chapterNumber}`);
  const clueCount = quality === "restful" ? chapter.clueIds.length : Math.min(2, chapter.clueIds.length);
  const collectibleCount = quality === "interrupted" ? 1 : quality === "regular" ? 1 : 2;
  return {
    clueIds: chapter.clueIds.slice(0, clueCount),
    collectibleIds: chapter.collectibleIds.slice(0, collectibleCount),
    route: quality === "interrupted" ? chapter.route.slice(0, 3) : chapter.route,
    echo: quality === "interrupted" ? "03:06 — 你短暂醒来时，远处的铃声也停了一次。" : null,
    observation: quality === "restful" ? "天亮前，林渡还记下了窗台积水里倒映出的第二条轨道。" : null,
  };
}

