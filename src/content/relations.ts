import { evidenceRelationSchema, type EvidenceRelation } from "@/src/lib/game-engine/schema";

export const evidenceRelations: EvidenceRelation[] = [
  {
    id: "mina-evelyn",
    clueIds: ["flower-cycle", "postcard"],
    statement: "米娜知道伊芙琳仍然活着",
    explanation: "四十三天一次的花单与伊芙琳亲笔明信片，共同证明米娜一直替她维持联络。",
  },
  {
    id: "gideon-escape",
    clueIds: ["missing-log", "evelyn-message"],
    statement: "吉迪恩协助伊芙琳主动离开",
    explanation: "失踪夜被撕掉的维修日志，与伊芙琳承认主动消失的留言互相补全。",
  },
  {
    id: "line-institution",
    clueIds: ["transport-photo", "museum-tag"],
    statement: "43号线把物件运往私人收藏机构",
    explanation: "运输照片中的箱号与玻璃丘寄存牌完全一致，路线的终点因此浮出水面。",
  },
].map((relation) => evidenceRelationSchema.parse(relation));

export function matchEvidenceRelation(firstClueId: string, secondClueId: string): EvidenceRelation | undefined {
  const selected = new Set([firstClueId, secondClueId]);
  if (selected.size !== 2) return undefined;
  return evidenceRelations.find((relation) => relation.clueIds.every((clueId) => selected.has(clueId)));
}
