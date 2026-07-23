import { endingEpilogueSchema, type EndingEpilogue } from "@/src/lib/game-engine/schema";
import type { EndingId } from "@/src/lib/game-engine/ending";

export const endingEpilogues: EndingEpilogue[] = [
  {
    id: "public",
    archiveLabel: "CASE CLOSED · PUBLIC RECORD",
    title: "公开档案",
    theme: "真相属于所有人。",
    result: "全部证据进入公开记录，私人收藏机构受到调查，部分资产开始归还。伊芙琳没有出席任何听证会，也没有留下新的地址。",
    detectiveLetter: "你选择把站台上的灯全部点亮。账册终于不必再躲在错误分类里，那些被写在箱子上的姓氏也重新成为人，而不是藏品来源。我仍不知道公开是否尊重了伊芙琳的愿望；正义有时来得像一盏太亮的灯，照见罪证，也让仍在逃亡的人失去阴影。可至少从今晚起，雾灯城必须当众说一次它一直知道的事。",
    closingLine: "档案已经打开。城市再也不能只在熄灯后承认那条线。",
  },
  {
    id: "protect",
    archiveLabel: "CASE CLOSED · WITNESS SEALED",
    title: "保护证人",
    theme: "真相不应以牺牲证人为代价。",
    result: "证据被交给一间可信的独立档案机构，资产追回工作在不公开伊芙琳身份的前提下开始。一张没有目的地的车票随后寄到事务所。",
    detectiveLetter: "我们把账册交给了一间知道锁为什么存在的档案室。它不会永远沉默，却也不会为了证明自己勇敢而先说出证人的名字。那张新车票没有目的地，只剪了一个返程孔；我想伊芙琳是在提醒我们，保护并不等于替她决定永远不回来。真相暂时坐在候车室里。它没有被埋葬，只是先让仍活着的人选一个不会被追上的清晨。",
    closingLine: "有些门关上不是为了藏匿，而是为了让里面的人保留开门的权利。",
  },
  {
    id: "return",
    archiveLabel: "TRUE ENDING · CHOICE RETURNED",
    title: "让失踪者自己决定",
    theme: "把证据，也把选择权交还给她。",
    result: "数周后，一份由伊芙琳亲自署名的调查报告公开。林渡收到第九件隐藏藏品：一卷尚未冲洗的胶卷，外盒只写着事务所的地址。",
    detectiveLetter: "我们没有替伊芙琳按下公开，也没有替她把名字锁回黑暗。账册、照片和那三条终于互相作证的红线，都留在隐藏站台上。第三周，她用自己的名字发表了报告。包裹里的胶卷还没有冲洗；我决定先不碰它，因为这一次，等待本身就是我们答对的部分。破案未必是替一件事写下句号。有时只是把笔、灯和下一页一起还给真正应该写下它的人。",
    closingLine: "末班车没有带走真相。它只把选择权送回了原来的主人。",
  },
].map((ending) => endingEpilogueSchema.parse(ending));

export function getEndingEpilogue(id: EndingId): EndingEpilogue {
  const ending = endingEpilogues.find((item) => item.id === id);
  if (!ending) throw new Error(`Unknown ending epilogue: ${id}`);
  return ending;
}
