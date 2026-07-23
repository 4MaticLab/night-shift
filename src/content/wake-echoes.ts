import { wakeEchoRecordSchema, wakeEchoSchema, type WakeEcho, type WakeEchoRecord } from "@/src/lib/game-engine/schema";

export const wakeEchoes: WakeEcho[] = [
  {
    id: "sleep-gap-01",
    chapter: 1,
    title: "纸纤维里的第二场雨",
    sound: "窗外没有雨，旧票据工坊的碎纸槽却传来一阵细密水声。",
    glimpse: "林渡回头时，几张废票正沿墙根排队，把昨天的日期轮流藏到背面。",
    fieldNote: "你醒来的那一刻，城市也翻了个身。它没有说梦话，只把销毁记录念错了一行。",
  },
  {
    id: "sleep-gap-02",
    chapter: 2,
    title: "一束花替门铃呼吸",
    sound: "花店门铃没有响，玻璃后的夜香花却同时轻轻碰了一下门。",
    glimpse: "一名迟到四十三天的送件人从巷口经过，没有包裹，只抱着一段仍然温热的香气。",
    fieldNote: "睡意裂开得很短，足够看见约定怎样在无人签收时，自己把自己送到。",
  },
  {
    id: "sleep-gap-03",
    chapter: 3,
    title: "307号房的半声咳嗽",
    sound: "旅馆水管咳了一声，307号房随即把门下那条光收窄了一寸。",
    glimpse: "夜班员给空房添了一只杯子，又在账簿上认真注明：并非出于记得。",
    fieldNote: "人在半醒时不擅长撒谎，建筑也是。走廊替所有住客保留了他们否认过的位置。",
  },
  {
    id: "sleep-gap-04",
    chapter: 4,
    title: "升降梯寄来负三层",
    sound: "档案馆的升降梯在停电后抵达，铃声从地下三层的上方传来。",
    glimpse: "门只开了一指宽，一张被刮掉路线的地图趁机把自己的折痕递了出来。",
    fieldNote: "你短暂醒来，错误分类也短暂恢复本名。两件事都没有惊动负责否认它们的人。",
  },
  {
    id: "sleep-gap-05",
    chapter: 5,
    title: "零点四十三分之外的一秒",
    sound: "隐藏站台的钟没有走动，却从每一道裂缝里各漏出一声不同方向的汽笛。",
    glimpse: "林渡看见旧闸机替一张无终点车票打孔，孔的形状像一个尚未作出的决定。",
    fieldNote: "城里所有表都想把这一秒退回去。我替你收下了；它不算证据，只算夜还在继续。",
  },
].map((echo) => wakeEchoSchema.parse(echo));

export function getWakeEcho(chapter: number): WakeEcho {
  const echo = wakeEchoes.find((item) => item.chapter === chapter);
  if (!echo) throw new Error(`Missing wake echo for chapter ${chapter}`);
  return echo;
}

export function getWakeEchoById(echoId: WakeEcho["id"]): WakeEcho {
  const echo = wakeEchoes.find((item) => item.id === echoId);
  if (!echo) throw new Error(`Unknown wake echo: ${echoId}`);
  return echo;
}

export function createWakeEchoRecord(chapter: number, recordedAt = new Date()): WakeEchoRecord {
  return wakeEchoRecordSchema.parse({ echoId: getWakeEcho(chapter).id, recordedAt: recordedAt.toISOString() });
}
