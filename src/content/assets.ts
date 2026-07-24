import { thirteenthLoafAssets } from "./thirteenth-loaf-assets";

export interface GameAsset {
  id: string;
  src: string;
  alt: string;
  category: "header" | "ending" | "social" | "collectible" | "night-seal" | "postcard" | "botanical" | "society-crest" | "souvenir" | "character-portrait" | "district-illustration" | "hardware-illustration";
  status: "complete";
}

export const assets = {
  nightShiftHero: {
    id: "header.night-shift.hero",
    src: "/art/headers/shift-handoff-v2.webp",
    alt: "林渡带着肩包和手电站在夜班事务所窗前，桌上摊着黄铜图钉地图",
    category: "header",
    status: "complete",
  },
  nightExpeditionHeader: {
    id: "header.night-expedition", src: "/art/headers/night-expedition-v1.webp", alt: "林渡提灯穿过雨夜高架维修桥，下方旧电车驶入雾灯城", category: "header", status: "complete",
  },
  morningReportHeader: {
    id: "header.morning-report", src: "/art/headers/morning-report-v1.webp", alt: "黎明时林渡抱着封存报告回到事务所，旧电车沿湿轨远去", category: "header", status: "complete",
  },
  endingHiddenPlatform: {
    id: "ending.hidden-platform", src: "/art/endings/hidden-platform-tableau-v1.webp", alt: "隐藏站台的长椅上放着账册、封蜡信和折叠相机，雾中停着旧电车", category: "ending", status: "complete",
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
  societyMisfiledRegistry: {
    id: "society.misfiled-registry",
    src: "/art/societies/misfiled-registry-crest-v1.webp",
    alt: "错页登记处的档案蛾、钥匙孔与索引签纹章",
    category: "society-crest",
    status: "complete",
  },
  societyMislaidConsulate: {
    id: "society.mislaid-consulate",
    src: "/art/societies/mislaid-consulate-crest-v1.webp",
    alt: "失物领事馆的空手套、归还车票与夜香花纹章",
    category: "society-crest",
    status: "complete",
  },
  societyAfterlightCartographers: {
    id: "society.afterlight-cartographers",
    src: "/art/societies/afterlight-cartographers-crest-v1.webp",
    alt: "熄灯测绘社的暗灯、等高线与弯曲旧轨纹章",
    category: "society-crest",
    status: "complete",
  },
  souvenirRainReceipt: {
    id: "souvenir.rain-receipt",
    src: "/art/souvenirs/rain-receipt-v1.webp",
    alt: "空白印章处盛着一滴雨水的未盖章收据",
    category: "souvenir",
    status: "complete",
  },
  souvenirOrphanedDrawerPull: {
    id: "souvenir.orphaned-drawer-pull",
    src: "/art/souvenirs/orphaned-drawer-pull-v1.webp",
    alt: "系着酒红档案线的无主黄铜抽屉拉手",
    category: "souvenir",
    status: "complete",
  },
  souvenirIndexMothWing: {
    id: "souvenir.index-moth-wing",
    src: "/art/souvenirs/index-moth-wing-v1.webp",
    alt: "由深蓝纸与黄铜制成的错页蛾索引翅片",
    category: "souvenir",
    status: "complete",
  },
  souvenirReturnPunchTicket: {
    id: "souvenir.return-punch-ticket",
    src: "/art/souvenirs/return-punch-ticket-v1.webp",
    alt: "只有一个返程剪孔的深蓝旧电车票",
    category: "souvenir",
    status: "complete",
  },
  souvenirMistakenCufflink: {
    id: "souvenir.mistaken-cufflink",
    src: "/art/souvenirs/mistaken-cufflink-v1.webp",
    alt: "带酒红指纹纹样的单枚铜绿袖扣",
    category: "souvenir",
    status: "complete",
  },
  souvenirSeedPostTube: {
    id: "souvenir.seed-post-tube",
    src: "/art/souvenirs/seed-post-tube-v1.webp",
    alt: "没有收件地址却冒出酒红新芽的黄铜花籽邮管",
    category: "souvenir",
    status: "complete",
  },
  souvenirNightLineChalk: {
    id: "souvenir.night-line-chalk",
    src: "/art/souvenirs/night-line-chalk-v1.webp",
    alt: "断面显出等高线并套着铜绿护套的夜线粉笔头",
    category: "souvenir",
    status: "complete",
  },
  souvenirAfterlightSignScrew: {
    id: "souvenir.afterlight-sign-screw",
    src: "/art/souvenirs/afterlight-sign-screw-v1.webp",
    alt: "带方形路牌托架与厚重铜绿的熄灯路牌螺丝",
    category: "souvenir",
    status: "complete",
  },
  souvenirRouteSeekingMarble: {
    id: "souvenir.route-seeking-marble",
    src: "/art/souvenirs/route-seeking-marble-v1.webp",
    alt: "内部封存着酒红弯曲旧轨的烟青玻璃珠",
    category: "souvenir",
    status: "complete",
  },
  characterLinDuHandoff: {
    id: "character.lin-du-handoff", src: "/art/characters/lin-du-handoff-portrait-v1.webp", alt: "林渡戴着灰蓝围巾坐在交接桌前，一手压住空白笔记本，一手握着黄铜手电", category: "character-portrait", status: "complete",
  },
  characterMinaSolair: {
    id: "character.mina-solair", src: "/art/characters/mina-solair-portrait-v1.webp", alt: "手持空白明信片、衣襟别着夜香花的米娜·索莱尔档案肖像", category: "character-portrait", status: "complete",
  },
  characterGideonVale: {
    id: "character.gideon-vale", src: "/art/characters/gideon-vale-portrait-v1.webp", alt: "把旧制服帽压在胸前、手握票钳的吉迪恩·韦尔档案肖像", category: "character-portrait", status: "complete",
  },
  characterOrinBell: {
    id: "character.orin-bell", src: "/art/characters/orin-bell-portrait-v1.webp", alt: "戴圆眼镜、谨慎托着地图卷的奥林·贝尔档案肖像", category: "character-portrait", status: "complete",
  },
  characterEvelynQuell: {
    id: "character.evelyn-quell", src: "/art/characters/evelyn-quell-portrait-v1.webp", alt: "穿深蓝旅行外套、直视前方并持折叠相机的伊芙琳·奎尔档案肖像", category: "character-portrait", status: "complete",
  },
  districtLanternWharf: {
    id: "district.lantern-wharf", src: "/art/districts/lantern-wharf-v1.webp", alt: "雨夜灯港区的弯曲旧轨、花市棚屋、封闭维修门与河桥", category: "district-illustration", status: "complete",
  },
  districtOldMeridian: {
    id: "district.old-meridian", src: "/art/districts/old-meridian-v1.webp", alt: "旧子午区层叠街巷、空白钟塔、无名旅馆与维修车库", category: "district-illustration", status: "complete",
  },
  districtGlassHill: {
    id: "district.glass-hill", src: "/art/districts/glass-hill-v1.webp", alt: "玻璃丘层层上升的温室、档案建筑、旧轨与信号台", category: "district-illustration", status: "complete",
  },
  hardwareVirtualRing: {
    id: "hardware.virtual-ring", src: "/art/hardware/virtual-ring-v1.webp", alt: "铺在旧档案纸上的深蓝睡眠戒，内圈露出细小传感器", category: "hardware-illustration", status: "complete",
  },
  hardwareVirtualWatch: {
    id: "hardware.virtual-watch", src: "/art/hardware/virtual-watch-v1.webp", alt: "铺在旧档案纸上的黄铜边深蓝睡眠手表", category: "hardware-illustration", status: "complete",
  },
  hardwareVirtualMattress: {
    id: "hardware.virtual-mattress", src: "/art/hardware/virtual-mattress-v1.webp", alt: "卷起的深蓝床垫感应带与黄铜边传感模块", category: "hardware-illustration", status: "complete",
  },
  hardwareVirtualPillow: {
    id: "hardware.virtual-pillow", src: "/art/hardware/virtual-pillow-v1.webp", alt: "带呼吸波纹缝线与传感扣的深蓝智能枕", category: "hardware-illustration", status: "complete",
  },
  ...thirteenthLoafAssets,
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
