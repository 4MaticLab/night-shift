export type PreparationId = "side-lamp" | "flower-note" | "tram-fare";

export interface PreparationItem {
  id: PreparationId;
  title: string;
  shortTitle: string;
  description: string;
  promise: string;
  imageSrc: string;
  imageAlt: string;
  echoes: Record<number, string>;
}

export const preparations: PreparationItem[] = [
  {
    id: "side-lamp",
    title: "黄铜提灯",
    shortTitle: "提灯",
    description: "让刮痕、旧墨和不愿见光的指纹从纸面上浮起来。",
    promise: "偏向物证细节",
    imageSrc: "https://iili.io/COCnQxs.md.png",
    imageAlt: "黄铜提灯",
    echoes: {
      1: "你装进包里的侧照灯派上了用场：斜光越过票面时，七年前的压印与昨夜的新油墨各自露出了边界。它们彼此客气，像两位拒绝同桌的证人。",
      2: "侧照灯在明信片背面照出一道被擦去的铅笔线。地址没有留下，写地址时垫在下面的花店收据却留下了。纸张有时比人更爱多嘴。",
      3: "灯光掠过307号房的墙纸，显出暗房夹留下的四处方形晒痕。有人取走照片时很匆忙，却仍把画框扶正了——可疑人物也可能有礼貌。",
      4: "侧照灯把地图刮痕照成了一条浅银色的河。轨道并未消失，只是被要求在档案里表现得不存在。",
      5: "在隐藏站台，侧照灯照出了账册封面上的第二把锁孔。第一把锁保护内容，第二把锁显然保护某人的犹豫。",
    },
  },
  {
    id: "flower-note",
    title: "夜香花笺",
    shortTitle: "花笺",
    description: "一小片带香气的旧信纸。有人见到它，会想起自己答应过什么。",
    promise: "偏向人物回响",
    imageSrc: "https://iili.io/COCgz8u.md.png",
    imageAlt: "夜香花笺",
    echoes: {
      1: "花笺在维修站潮湿的空气里重新有了香气。守夜人没有开门，只从门缝里说：七年前也有人带着同样的味道来问路。",
      2: "米娜看见花笺后，把否认的话说得很轻。她替你换了一杯茶，也替一个不在场的人把椅子往外拉了半寸。",
      3: "吉迪恩把花笺折进掌心。他仍说不认识伊芙琳，但把307号房的钥匙放在桌上——谎言先离开了房间，人还没有。",
      4: "奥林闻到花笺的气味，关掉了档案馆最响的那台风扇。原始地图藏在风声后面，已经等了七年。",
      5: "站台的长椅下压着一朵已经褪色的夜香花。你带来的花笺与它气味相同，年份不同；约定仍认得自己的同类。",
    },
  },
  {
    id: "tram-fare",
    title: "旧制电车零钱",
    shortTitle: "旧零钱",
    description: "三枚早已停用的硬币。雾灯城仍有少数售票员拒绝承认时代变了。",
    promise: "偏向意外路线",
    imageSrc: "https://iili.io/COCrdKP.md.png",
    imageAlt: "旧制电车零钱",
    echoes: {
      1: "那三枚旧零钱买到了一段不在时刻表上的顺风车。售票员收钱时没有抬头，只提醒林渡：这座城的终点站常常比乘客先下车。",
      2: "零钱在咖啡馆柜台上换来一只缺口杯，也换来一句旧话：43号线的司机从不点咖啡，他们只借热水暖手。",
      3: "旅馆前台收下其中一枚硬币，像收下一笔迟到七年的房费。307号房因此多开了十一分钟，足够让底片显影。",
      4: "档案馆的投币复印机仍认旧钱。它吐出一张被删除的线路副本，并对现行货币保持了职业性的蔑视。",
      5: "最后一枚零钱落进隐藏站台的售票机。机器没有出票，却亮起了一盏灯。某些旅程接受的车费，是有人终于回来。",
    },
  },
];

export function getPreparation(id: PreparationId | ""): PreparationItem | undefined {
  return preparations.find((item) => item.id === id);
}

