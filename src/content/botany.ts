import { growthStageSchema, nightBotanicalSchema, type GrowthStage, type NightBotanical } from "@/src/lib/game-engine/schema";

export const nightBotanicals: NightBotanical[] = [
  {
    id: "ticketstub-lantern-fern", chapter: 1, assetId: "botanical.night-01", name: "票根灯蕨", archiveName: "Filix tessera noctiluca", district: "灯港封闭岔道",
    cityRumor: "灯港人说它只长在被否认的铁轨旁。市政厅认为这是一种缺乏行政依据的园艺行为。",
    specimenNote: "叶片像打孔旧票，孢荚却保存着新鲜琥珀光。它不证明43号线存在，只拒绝在别处生长。",
    growthStages: { seed: "一枚像旧道钉的种核在纸纤维里发热。", sprout: "第一片卷叶沿被否认的坡度探出。", leaf: "打孔票根般的叶片逐层展开。", bloom: "琥珀孢荚点亮，照见根下仍潮湿的旧轨。" },
    qualityNotes: { interrupted: "植株较小，却完整结出一盏孢灯；提前归来没有让它失去这一夜。", regular: "四层叶片与三盏孢灯稳定展开，成为一株完整的标准标本。", restful: "最外层叶片多长出一圈稀薄金边，根须也记录了第二条隐约轨迹。" },
  },
  {
    id: "forty-third-night-bloom", chapter: 2, assetId: "botanical.night-02", name: "四十三日夜香", archiveName: "Noctiflora epistula XLIII", district: "花店后巷邮槽",
    cityRumor: "它每隔很久才开一次。错过花期的人可以给邮槽留信，邮槽对此收取一段回忆作为邮资。",
    specimenNote: "信封形苞片保护着一朵酒红夜花。花粉没有地址，却总能在天亮前抵达同一张河岸长椅。",
    growthStages: { seed: "一粒没有收件地址的花籽安静躺下。", sprout: "嫩芽先向最近的邮槽弯了一次腰。", leaf: "纸白苞片像尚未封口的信逐一合拢。", bloom: "酒红夜花打开，琥珀花粉开始自己的投递。" },
    qualityNotes: { interrupted: "花朵来不及完全舒展，但花粉已经完成投递；短夜仍被它承认。", regular: "主花与四枚苞片在清晨前稳定成形。", restful: "最晚的一枚侧芽也赶上花期，香气在报告纸上多停留了一行。" },
  },
  {
    id: "checkout-vine", chapter: 3, assetId: "botanical.night-03", name: "退房藤", archiveName: "Vitis hospitium perpetua", district: "无名旅馆 307",
    cityRumor: "旅馆说它替长期客人看管钥匙。藤蔓说旅馆只是一直没学会如何向植物收房费。",
    specimenNote: "深色心叶间垂着黄铜钥匙状种荚。即使房间空置多年，它仍会每夜替水池换一小杯干净的水。",
    growthStages: { seed: "根球在一小块旧墙纸下找到房间。", sprout: "卷须摸索着一把没有办理退房的钥匙。", leaf: "深蓝心叶替缺席的住客遮住灰尘。", bloom: "黄铜钥匙荚成熟，藤蔓替空房完成一次无效签字。" },
    qualityNotes: { interrupted: "短藤只挂住一枚钥匙荚，但它已经是一株完成登记的标本。", regular: "藤身绕成稳定支架，数枚钥匙荚在叶间成熟。", restful: "最细的卷须爬过墙纸旧痕，替四张缺席照片各留下一片新叶。" },
  },
  {
    id: "misfiled-glasshouse-moss", chapter: 4, assetId: "botanical.night-04", name: "误分类温室苔", archiveName: "Musca archivum errata", district: "档案馆地下温室",
    cityRumor: "档案馆把它登记成玻璃碎片，温室把玻璃登记成过度透明的土壤。双方因此和平共处。",
    specimenNote: "宽叶上的铜绿脉络像一张被刮过的地图，透明孢囊则像没有标签的小抽屉，专门保存归错类的春天。",
    growthStages: { seed: "细苔在一块错误归档的玻璃下醒来。", sprout: "铜绿叶脉沿地图刮痕悄悄补线。", leaf: "扇形叶片铺开一条地下路线。", bloom: "透明孢囊逐个亮起，把春天归进最容易找到的错柜。" },
    qualityNotes: { interrupted: "叶面只重画了路线的一部分，孢囊仍完整封存了这次归来。", regular: "铜绿脉络与透明孢囊形成一份可读的标准标本。", restful: "叶缘越过破玻璃又生出一层薄苔，像档案馆终于承认了地下还有一季。" },
  },
  {
    id: "zero-forty-three-clockflower", chapter: 5, assetId: "botanical.night-05", name: "零点四十三分钟花", archiveName: "Horaflora ultima", district: "00:43 隐藏站台",
    cityRumor: "只有附近所有钟表把谎说完，它才开花。钟表匠认为这是植物对行业规范缺乏尊重。",
    specimenNote: "十二片烟蓝花瓣围住一枚琥珀信号芯，铃形果荚成熟时不会报时，只会提醒末班车仍愿意回来。",
    growthStages: { seed: "种核贴着旧信号线，等第一座钟沉默。", sprout: "黑色茎秆在互相矛盾的时刻之间抬头。", leaf: "烟蓝锯叶与铃形幼果沿站台展开。", bloom: "十二片花瓣同时打开，琥珀花芯准时发出无声信号。" },
    qualityNotes: { interrupted: "花盘较紧，仍完整亮起信号芯；没有一株植物因提前醒来受罚。", regular: "花盘、铃果与根系在末班车前形成完整标本。", restful: "最后一枚铃果也染上琥珀光，花芯比站里所有钟表多守了一会儿。" },
  },
].map((botanical) => nightBotanicalSchema.parse(botanical));

export function getNightBotanical(chapter: number): NightBotanical {
  const botanical = nightBotanicals.find((item) => item.chapter === chapter);
  if (!botanical) throw new Error(`Unknown night botanical chapter: ${chapter}`);
  return botanical;
}

export function growthStageFromProgress(progress: number): GrowthStage {
  const normalized = Math.max(0, Math.min(100, progress));
  return growthStageSchema.parse(normalized < 25 ? "seed" : normalized < 50 ? "sprout" : normalized < 85 ? "leaf" : "bloom");
}
