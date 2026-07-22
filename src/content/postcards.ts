import { journeyPostcardSchema, type JourneyPostcard } from "@/src/lib/game-engine/schema";
import type { PreparationId } from "@/src/content/preparations";

export const journeyPostcards: JourneyPostcard[] = [
  {
    id: "night-01-lantern-wharf",
    chapter: 1,
    assetId: "postcard.night-01",
    title: "灯港拒收件",
    location: "灯港 · 封闭维修站",
    cityRumor: "市政厅的否认牌在雨里站了七年。它的工龄比这条废线更可信。",
    message: "铁门只开了半扇，足够一辆不被承认的电车把头灯伸出来。雨替轨道擦亮了口供。",
    preparationNotes: {
      "side-lamp": "侧照灯在门轴上照出昨夜的新油。有人仍定期替不存在的入口保养。",
      "flower-note": "花笺的气味让守夜人停了一会儿。他没开门，只把铁链放松了一环。",
      "tram-fare": "一枚旧零钱卡在门缝里。铁门收下后，表现得比市政厅通情达理。",
    },
  },
  {
    id: "night-02-flower-alley",
    chapter: 2,
    assetId: "postcard.night-02",
    title: "寄往无人之处",
    location: "灯港 · 花店后巷邮槽",
    cityRumor: "没有地址的信件在这里排队。邮槽说，它们只是比收件人更早想起回家的路。",
    message: "夜香花在雨棚下合拢，十二封空白信封却仍很清醒。第十三封正被墙慢慢吞进去。",
    preparationNotes: {
      "side-lamp": "侧照灯让信封上的压痕浮起来：每一封都曾写过同一个名字，又被小心擦去。",
      "flower-note": "花笺被放进队尾后，前面的信封像是忽然想起了应当留出一点位置。",
      "tram-fare": "旧零钱敲响邮槽背后的铜管。远处有人回敲两次，算作收件证明。",
    },
  },
  {
    id: "night-03-room-307",
    chapter: 3,
    assetId: "postcard.night-03",
    title: "替客人留着灯",
    location: "旧子午 · 无名旅馆 307",
    cityRumor: "旅馆从不追问客人是否离开。只要房费准时，缺席也能享受长期住宿。",
    message: "床铺积着灰，洗手池却干净。窗外的维修车驶过河桥，像一段被撕掉又重新显影的日志。",
    preparationNotes: {
      "side-lamp": "侧照灯在墙纸上找出四块方形晒痕。照片被带走，房间仍替它们保留位置。",
      "flower-note": "花笺留在枕边后，前台第一次承认：每月都有人来换一次房里的水。",
      "tram-fare": "一枚旧零钱续了十一分钟房费，恰好够窗外那辆维修车慢慢通过。",
    },
  },
  {
    id: "night-04-archive-glasshouse",
    chapter: 4,
    assetId: "postcard.night-04",
    title: "错误分类的春天",
    location: "市立档案馆 · 地下温室",
    cityRumor: "档案馆没有地下室。地下室对此保留了三层抽屉、一座温室和一条铜绿轨道的意见。",
    message: "地图上的刮痕在桌边结束，地上的旧轨却从那里开始。有人把路线删成了通往证据的指示。",
    preparationNotes: {
      "side-lamp": "侧照灯把刮痕照成浅银色。被删掉的线没有消失，只换了一种比较谦逊的墨水。",
      "flower-note": "花笺放进空抽屉后，温室里的藤蔓轻轻碰了碰那只最容易找到的柜门。",
      "tram-fare": "复印机吞下旧零钱，吐出一张错误分类的地图，并拒绝为自己的勇敢开收据。",
    },
  },
  {
    id: "night-05-hidden-platform",
    chapter: 5,
    assetId: "postcard.night-05",
    title: "钟表沉默以后",
    location: "河下隧道 · 00:43 隐藏站台",
    cityRumor: "末班车从不迟到。它只是要等站里所有钟表把各自的谎完整说完。",
    message: "信号灯变成琥珀色时，站台没有欢呼。一本账册、一封信和一辆旧电车安静地抵达了同一个问题。",
    preparationNotes: {
      "side-lamp": "侧照灯照出账册封面的第二把锁孔。它保护的不是秘密，是把秘密交给谁的犹豫。",
      "flower-note": "花笺与长椅下的枯花气味相同。年份不同，约定仍认得自己的同类。",
      "tram-fare": "最后一枚旧零钱没有换来车票，只点亮一盏灯。某些旅程把归来本身当作凭证。",
    },
  },
].map((postcard) => journeyPostcardSchema.parse(postcard));

export function getJourneyPostcard(chapter: number): JourneyPostcard {
  const postcard = journeyPostcards.find((item) => item.chapter === chapter);
  if (!postcard) throw new Error(`Unknown journey postcard chapter: ${chapter}`);
  return postcard;
}

export function getPostcardPreparationNote(chapter: number, preparationId: PreparationId): string {
  return getJourneyPostcard(chapter).preparationNotes[preparationId];
}
