import { evidenceSynthesisSchema, type EvidenceSynthesis } from "@/src/lib/game-engine/schema";

export const evidenceSyntheses: EvidenceSynthesis[] = [
  {
    id: "mina-evelyn",
    inputIds: ["flower-cycle", "postcard"],
    title: "米娜知道伊芙琳仍然活着",
    explanation: "四十三天一次的花单与伊芙琳亲笔明信片，共同证明米娜一直替她维持联络。",
  },
  {
    id: "gideon-escape",
    inputIds: ["missing-log", "evelyn-message"],
    title: "吉迪恩协助伊芙琳主动离开",
    explanation: "失踪夜被撕掉的维修日志，与伊芙琳承认主动消失的留言互相补全。",
  },
  {
    id: "line-institution",
    inputIds: ["transport-photo", "museum-tag"],
    title: "43号线把物件运往私人收藏机构",
    explanation: "运输照片中的箱号与玻璃丘寄存牌完全一致，路线的终点因此浮出水面。",
  },
].map((synthesis) => evidenceSynthesisSchema.parse(synthesis));
