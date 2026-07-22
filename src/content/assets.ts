export interface GameAsset {
  id: string;
  src: string;
  alt: string;
  category: "header" | "social" | "collectible" | "night-seal" | "postcard" | "botanical";
  status: "complete";
}

export const assets = {
  nightShiftHero: {
    id: "header.night-shift.hero",
    src: "/art/headers/night-shift-hero.png",
    alt: "林渡站在雨夜窗前，窗外的雾灯城有一辆老电车驶过",
    category: "header",
    status: "complete",
  },
  socialCard: {
    id: "social.night-shift.og",
    src: "/og.png",
    alt: "夜班侦探 Night Shift 分享封面",
    category: "social",
    status: "complete",
  },
  tornTicket: {
    id: "collectible.torn-ticket",
    src: "/art/collectibles/torn-ticket-v1.png",
    alt: "一张被撕掉终点的深蓝色旧电车票",
    category: "collectible",
    status: "complete",
  },
  matchbox: {
    id: "collectible.matchbox",
    src: "/art/collectibles/matchbox-v1.png",
    alt: "灯港旧咖啡馆留下的火柴盒",
    category: "collectible",
    status: "complete",
  },
  pressedFlower: {
    id: "collectible.pressed-flower",
    src: "/art/collectibles/pressed-flower-v1.png",
    alt: "固定在档案纸上的夜香花标本",
    category: "collectible",
    status: "complete",
  },
  postcard: {
    id: "collectible.postcard",
    src: "/art/collectibles/postcard-v1.png",
    alt: "一张没有邮票的旧明信片",
    category: "collectible",
    status: "complete",
  },
  hotelKey: {
    id: "collectible.hotel-key",
    src: "/art/collectibles/hotel-key-v1.png",
    alt: "带有307号铜牌的黄铜旅馆钥匙",
    category: "collectible",
    status: "complete",
  },
  driverBadge: {
    id: "collectible.driver-badge",
    src: "/art/collectibles/driver-badge-v1.png",
    alt: "磨损的电车维修员工徽章",
    category: "collectible",
    status: "complete",
  },
  museumToken: {
    id: "collectible.museum-token",
    src: "/art/collectibles/museum-token-v1.png",
    alt: "玻璃丘博物馆的黄铜寄存牌",
    category: "collectible",
    status: "complete",
  },
  ledgerClasp: {
    id: "collectible.ledger-clasp",
    src: "/art/collectibles/ledger-clasp-v1.png",
    alt: "带有铜绿的精致账册封扣",
    category: "collectible",
    status: "complete",
  },
  nightSeal01: {
    id: "night-seal.01",
    src: "/art/night-seals/night-01-v1.png",
    alt: "雨夜电车与残票组成的第一夜印",
    category: "night-seal",
    status: "complete",
  },
  nightSeal02: {
    id: "night-seal.02",
    src: "/art/night-seals/night-02-v1.png",
    alt: "夜香花与信件组成的第二夜印",
    category: "night-seal",
    status: "complete",
  },
  nightSeal03: {
    id: "night-seal.03",
    src: "/art/night-seals/night-03-v1.png",
    alt: "钥匙与底片组成的第三夜印",
    category: "night-seal",
    status: "complete",
  },
  nightSeal04: {
    id: "night-seal.04",
    src: "/art/night-seals/night-04-v1.png",
    alt: "被刮掉的城市地图组成的第四夜印",
    category: "night-seal",
    status: "complete",
  },
  nightSeal05: {
    id: "night-seal.05",
    src: "/art/night-seals/night-05-v1.png",
    alt: "秘密站台、电车与账册组成的第五夜印",
    category: "night-seal",
    status: "complete",
  },
  postcardNight01: {
    id: "postcard.night-01",
    src: "/art/postcards/night-01-lantern-wharf-v1.webp",
    alt: "雨夜里半开的灯港维修站铁门与一辆旧电车",
    category: "postcard",
    status: "complete",
  },
  postcardNight02: {
    id: "postcard.night-02",
    src: "/art/postcards/night-02-flower-alley-v1.webp",
    alt: "花店后巷中排队等待寄出的空白信封",
    category: "postcard",
    status: "complete",
  },
  postcardNight03: {
    id: "postcard.night-03",
    src: "/art/postcards/night-03-room-307-v1.webp",
    alt: "无名旅馆房间与窗外驶过维修桥的电车",
    category: "postcard",
    status: "complete",
  },
  postcardNight04: {
    id: "postcard.night-04",
    src: "/art/postcards/night-04-archive-glasshouse-v1.webp",
    alt: "档案馆地下室通往铜绿轨道与废弃温室",
    category: "postcard",
    status: "complete",
  },
  postcardNight05: {
    id: "postcard.night-05",
    src: "/art/postcards/night-05-hidden-platform-v1.webp",
    alt: "多座沉默钟表下驶入隐藏站台的末班电车",
    category: "postcard",
    status: "complete",
  },
  botanicalNight01: {
    id: "botanical.night-01",
    src: "/art/botany/night-01-ticketstub-fern-v1.webp",
    alt: "叶片如打孔旧车票、结着琥珀孢灯的票根灯蕨植物标本",
    category: "botanical",
    status: "complete",
  },
  botanicalNight02: {
    id: "botanical.night-02",
    src: "/art/botany/night-02-forty-third-bloom-v1.webp",
    alt: "从黄铜邮槽中长出酒红夜花的四十三日夜香植物标本",
    category: "botanical",
    status: "complete",
  },
  botanicalNight03: {
    id: "botanical.night-03",
    src: "/art/botany/night-03-checkout-vine-v1.webp",
    alt: "深色心叶间垂着黄铜钥匙种荚的退房藤植物标本",
    category: "botanical",
    status: "complete",
  },
  botanicalNight04: {
    id: "botanical.night-04",
    src: "/art/botany/night-04-misfiled-moss-v1.webp",
    alt: "铜绿叶脉与透明抽屉状孢囊覆盖破玻璃的温室苔植物标本",
    category: "botanical",
    status: "complete",
  },
  botanicalNight05: {
    id: "botanical.night-05",
    src: "/art/botany/night-05-clockflower-v1.webp",
    alt: "十二片烟蓝花瓣围绕琥珀信号芯的零点四十三分钟花植物标本",
    category: "botanical",
    status: "complete",
  },
} as const satisfies Record<string, GameAsset>;

export const assetManifest = Object.values(assets);

export function getAsset(assetId: string): GameAsset {
  const asset = assetManifest.find((item) => item.id === assetId);
  if (!asset) throw new Error(`Unknown asset: ${assetId}`);
  return asset;
}

export function getNightSealAsset(chapter: number): GameAsset {
  return getAsset(`night-seal.0${chapter}`);
}

export function getPostcardAsset(chapter: number): GameAsset {
  return getAsset(`postcard.night-0${chapter}`);
}

export function getBotanicalAsset(chapter: number): GameAsset {
  return getAsset(`botanical.night-0${chapter}`);
}
