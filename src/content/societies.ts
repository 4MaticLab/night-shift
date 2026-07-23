import { getRouteDirection } from "@/src/content/routes";
import {
  citySocietySchema,
  societyMemoryRecordSchema,
  type CitySociety,
  type SocietyId,
  type SocietyMemoryRecord,
  type SocietyStanding,
  type RouteDirection,
} from "@/src/lib/game-engine/schema";

export const citySocieties: CitySociety[] = [
  {
    id: "misfiled-registry",
    assetId: "society.misfiled-registry",
    name: "错页登记处",
    archiveName: "THE REGISTRY OF BENEFICIAL ERRORS",
    concern: "手续、档案，以及机构自己留下的漏洞",
    publicRumor: "市立档案馆每否认一次地下室，登记处就多出一扇窗。",
    privateRule: "收到更正请求时，先确认那个错误是否正在保护某个人。",
    signoff: "一位拒绝校正姓名的登记员",
    titles: { noticed: "待核旁注", known: "可借阅的旁注", entrusted: "获准误分类者" },
    letters: {
      noticed: "我们注意到你让一份手续对自己作证。登记处暂不赞成这种做法；这通常意味着我们非常感兴趣。",
      known: "你又一次从制度的句号里取出了一扇门。你的名字现已写进页边，铅笔字，方便必要时否认。",
      entrusted: "随函附上一枚没有对应抽屉的索引签。若有人询问，它从未存在；若一位需要保护的证人询问，请把它交给对方。",
    },
  },
  {
    id: "mislaid-consulate",
    assetId: "society.mislaid-consulate",
    name: "失物领事馆",
    archiveName: "THE CONSULATE OF MISLAID THINGS",
    concern: "失主、旧承诺，以及仍在寻找归处的物件",
    publicRumor: "领事馆不问你丢了什么，只问那件东西是否也在找你。",
    privateRule: "只有当物件表现出思念，领事馆才承认它确实遗失。",
    signoff: "一件拒绝透露原主人姓名的失物",
    titles: { noticed: "临时保管人", known: "代行领事", entrusted: "被失物认领者" },
    letters: {
      noticed: "你昨夜没有急着宣布所有权。谨代表若干尚未决定主人的物件，对这份克制表示有限度的欢迎。",
      known: "又有一件东西在你手中想起了归路。领事馆已允许你代为保管沉默，但请不要把保管误解为拥有。",
      entrusted: "领事馆承认：如今不是你在寻找失物，而是失物开始寻找你。请留一只口袋空着，这是外交礼节。",
    },
  },
  {
    id: "afterlight-cartographers",
    assetId: "society.afterlight-cartographers",
    name: "熄灯测绘社",
    archiveName: "THE CARTOGRAPHERS AFTER LAMPLIGHT",
    concern: "被删除的路线、夜间坡度与建筑不肯承认的入口",
    publicRumor: "他们的地图白天全是空白；入夜后，坡度会自己签名。",
    privateRule: "同一条路必须亲自走两遍；第一次可能只是城市撒谎。",
    signoff: "一名仍在确认出口是否存在的夜线测绘员",
    titles: { noticed: "借灯测量员", known: "夜线同绘者", entrusted: "城市认可的路标" },
    letters: {
      noticed: "我们在一张空白地图上看见了你的鞋印。它们方向正确，礼貌欠佳，因此很可能是真的。",
      known: "你再次走过一条白天不存在的路。测绘社已把你的步幅列为临时尺度，误差约为一场小雨。",
      entrusted: "城里有三条路线只肯在你经过后显形。随信寄上一截熄灭的灯芯；它不会照亮道路，只会让道路承认你。",
    },
  },
].map((society) => citySocietySchema.parse(society));

export function getCitySociety(id: SocietyId): CitySociety {
  const society = citySocieties.find((item) => item.id === id);
  if (!society) throw new Error(`Unknown city society: ${id}`);
  return society;
}

export function societyStandingFromAttention(attention: number): SocietyStanding {
  if (attention >= 3) return "entrusted";
  if (attention >= 2) return "known";
  return "noticed";
}

export function createSocietyMemory(
  chapter: number,
  choiceId: string,
  existingHistory: Partial<Record<number, SocietyMemoryRecord>>,
  completedAt: string,
  resolvedDirection?: RouteDirection,
): SocietyMemoryRecord {
  const direction = resolvedDirection ?? getRouteDirection(chapter, choiceId);
  const priorAttention = Object.values(existingHistory).filter((record) => record?.societyId === direction.societyId).length;
  return societyMemoryRecordSchema.parse({
    chapter,
    choiceId: direction.choiceId,
    societyId: direction.societyId,
    standing: societyStandingFromAttention(priorAttention + 1),
    completedAt,
  });
}

export function getSocietyTitle(record: SocietyMemoryRecord): string {
  return getCitySociety(record.societyId).titles[record.standing];
}

export function getSocietyLetter(record: SocietyMemoryRecord): string {
  return getCitySociety(record.societyId).letters[record.standing];
}
