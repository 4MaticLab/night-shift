import { getRouteDirection } from "@/src/content/routes";
import type { PreparationId } from "@/src/content/preparations";
import { souvenirRecordSchema, souvenirSchema, type SocietyId, type Souvenir, type SouvenirRecord } from "@/src/lib/game-engine/schema";

export const DEMO_JOURNEY_SEED = 430043;

export const souvenirs: Souvenir[] = [
  {
    id: "rain-receipt",
    assetId: "souvenir.rain-receipt",
    name: "未盖章的雨水收据",
    archiveName: "错页登记处旁证 · 潮湿票据类",
    societyId: "misfiled-registry",
    preparationAffinity: "side-lamp",
    provenance: "夹在旧票据工坊一扇从未报修的窗缝里。空白印章处盛着一滴雨，摇了半夜也没有洒出来。",
    fieldNote: "收据没有金额，也没有经手人。雨水倒很坚持，说它确实来过。",
    cityRumor: "登记处若不肯承认某场雨，雨会自己保存凭证。",
  },
  {
    id: "orphaned-drawer-pull",
    assetId: "souvenir.orphaned-drawer-pull",
    name: "无主抽屉的黄铜拉手",
    archiveName: "错页登记处旁证 · 脱离家具类",
    societyId: "misfiled-registry",
    preparationAffinity: "tram-fare",
    provenance: "从档案馆电梯里捡到。电梯没有抽屉，但每到四层，它都会轻轻碰响一次。",
    fieldNote: "背后的螺柱仍很新。也许那只抽屉不是丢了，只是被归到了别处。",
    cityRumor: "雾灯城的抽屉偶尔先于文件搬家。",
  },
  {
    id: "index-moth-wing",
    assetId: "souvenir.index-moth-wing",
    name: "错页蛾的索引翅片",
    archiveName: "错页登记处旁证 · 活页昆虫类",
    societyId: "misfiled-registry",
    preparationAffinity: "flower-note",
    provenance: "停在一册没有正文的目录上。林渡靠近时，蛾已经飞走，只留下这片会自行换页的翅形索引。",
    fieldNote: "它每次都指向相邻的一页，从不指向正确那页。很像一位受过训练的办事员。",
    cityRumor: "错页蛾不吃纸，只吃页码之间过分确定的关系。",
  },
  {
    id: "return-punch-ticket",
    assetId: "souvenir.return-punch-ticket",
    name: "只有返程孔的旧车票",
    archiveName: "失物领事馆旁证 · 单向归还类",
    societyId: "mislaid-consulate",
    preparationAffinity: "tram-fare",
    provenance: "在河桥候车亭的长椅下面。票面从未印出去程，却已经被剪出一个完整的返程孔。",
    fieldNote: "它大概没有离开过任何地方，却非常认真地准备回来。",
    cityRumor: "没有地址的人，也可以先买一张回来的票。",
  },
  {
    id: "mistaken-cufflink",
    assetId: "souvenir.mistaken-cufflink",
    name: "认错主人的袖扣",
    archiveName: "失物领事馆旁证 · 错认衣着类",
    societyId: "mislaid-consulate",
    preparationAffinity: "side-lamp",
    provenance: "它在无名旅馆门口钩住林渡的袖口，怎么劝也不肯松开；可林渡从来不用袖扣。",
    fieldNote: "背扣弯成了另一个人的习惯。它认错得很有感情，只好先带回来。",
    cityRumor: "领事馆认为，被物件认错也是一种短期监护关系。",
  },
  {
    id: "seed-post-tube",
    assetId: "souvenir.seed-post-tube",
    name: "没有收件人的花籽邮管",
    archiveName: "失物领事馆旁证 · 未投递种子类",
    societyId: "mislaid-consulate",
    preparationAffinity: "flower-note",
    provenance: "花店后巷的铜管吐出它时，没有附地址。盖子一见晨光便松开，里面的种子已经替自己拆了信。",
    fieldNote: "不种进温室。它不是标本，只是一封尚未决定寄给谁的信。",
    cityRumor: "真正无主的种子，会把第一个发芽处写成收件人。",
  },
  {
    id: "night-line-chalk",
    assetId: "souvenir.night-line-chalk",
    name: "夜线粉笔头",
    archiveName: "熄灯测绘社旁证 · 临时等高线类",
    societyId: "afterlight-cartographers",
    preparationAffinity: "flower-note",
    provenance: "卡在一条被刮掉的铁轨缝里。断面长着一圈圈等高线，落到桌上后仍缓慢画弯。",
    fieldNote: "它只画已经走过的路，而且总比脚步晚一个拐角。",
    cityRumor: "测绘社熄灯后，粉笔才开始记录白天不肯出现的坡度。",
  },
  {
    id: "afterlight-sign-screw",
    assetId: "souvenir.afterlight-sign-screw",
    name: "熄灯路牌的铜螺丝",
    archiveName: "熄灯测绘社旁证 · 路牌遗件类",
    societyId: "afterlight-cartographers",
    preparationAffinity: "side-lamp",
    provenance: "从一块写着“此处无路”的铜牌背面自行旋落。路牌没有松，反而比先前更牢。",
    fieldNote: "螺纹里全是新鲜铜绿。它可能拧住的不是路牌，而是那句否认。",
    cityRumor: "某些路牌每天靠一颗螺丝维持不存在。",
  },
  {
    id: "route-seeking-marble",
    assetId: "souvenir.route-seeking-marble",
    name: "会朝旧轨滚动的玻璃珠",
    archiveName: "熄灯测绘社旁证 · 偏航玻璃类",
    societyId: "afterlight-cartographers",
    preparationAffinity: "tram-fare",
    provenance: "在隐藏站台的排水沟里。放到任何平面上，它都会越过水平线，滚向最近一段被删除的旧轨。",
    fieldNote: "事务所的地板第一次被它指出倾斜。房东对此表示，这是地图的问题。",
    cityRumor: "孩子们拿它找回家路，大人则拿它证明房子没有歪。",
  },
].map((souvenir) => souvenirSchema.parse(souvenir));

export function getSouvenir(id: string): Souvenir {
  const souvenir = souvenirs.find((item) => item.id === id);
  if (!souvenir) throw new Error(`Unknown souvenir: ${id}`);
  return souvenir;
}

export function selectSouvenir(
  chapter: number,
  choiceId: string,
  preparationId: PreparationId,
  journeySeed: number,
  history: Partial<Record<number, SouvenirRecord>>,
  resolvedSocietyId?: SocietyId,
): Souvenir {
  const societyId = resolvedSocietyId ?? getRouteDirection(chapter, choiceId).societyId;
  const usedIds = new Set(Object.values(history).flatMap((record) => record ? [record.souvenirId] : []));
  const available = souvenirs.filter((item) => !usedIds.has(item.id));
  if (!available.length) throw new Error("No unclaimed souvenirs remain");

  return [...available].sort((a, b) => {
    const score = (item: Souvenir) => stableHash(`${journeySeed}|${chapter}|${choiceId}|${preparationId}|${item.id}`) % 100_000
      - (item.societyId === societyId ? 200_000 : 0)
      - (item.preparationAffinity === preparationId ? 80_000 : 0);
    return score(a) - score(b) || a.id.localeCompare(b.id);
  })[0];
}

export function createSouvenirRecord(
  chapter: number,
  choiceId: string,
  preparationId: PreparationId,
  journeySeed: number,
  history: Partial<Record<number, SouvenirRecord>>,
  foundAt: string,
  resolvedSocietyId?: SocietyId,
): SouvenirRecord {
  const existing = history[chapter];
  if (existing) return existing;
  const souvenir = selectSouvenir(chapter, choiceId, preparationId, journeySeed, history, resolvedSocietyId);
  return souvenirRecordSchema.parse({ chapter, souvenirId: souvenir.id, choiceId, preparationId, journeySeed, foundAt });
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
