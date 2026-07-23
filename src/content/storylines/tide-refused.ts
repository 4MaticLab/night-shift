import type { CampaignStoryline } from "@/src/content/campaigns/types";
import { tideRefusedSandbox } from "./tide-refused-data";

export const TIDE_REFUSED_STORYLINE_ID = "tide-refused";

export const tideRefusedStoryline = {
  id: TIDE_REFUSED_STORYLINE_ID,
  role: "side",
  archiveLabel: "河下区支线",
  title: "潮汐不肯归档",
  teaser: "沿 43 号线删图与运输箱姓氏继续向下，找回一片被城市从母图抹去的街区。",
  locale: "zh-CN",
  unlockClueIds: ["transport-photo", "scratched-map", "ledger-clasp"],
  unlockHint: "归档“箱子上的姓氏”“被刮掉的轨迹”或“同一批黄铜”后显影。",
  content: tideRefusedSandbox,
  connections: [
    {
      campaignClueId: "transport-photo",
      storylineClueId: "night-ferry-roster",
      label: "被搬走的家庭",
      inference: "维修车箱号与夜渡名册都把“货物”重新写回一个个家庭。",
    },
    {
      campaignClueId: "scratched-map",
      storylineClueId: "salt-nameplates",
      label: "同一种删图手续",
      inference: "43 号线与河下七巷使用同一套刮除笔势；消失不是遗忘，而是制度动作。",
    },
    {
      campaignClueId: "ledger-clasp",
      storylineClueId: "original-engineering-ledger",
      label: "黄铜采购链",
      inference: "账册封扣与水务总账的金属批次相同，把秘密运输接回市政采购链。",
    },
  ],
} satisfies CampaignStoryline;
