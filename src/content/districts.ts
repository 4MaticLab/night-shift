import { cityDistrictSchema, type CityDistrict } from "@/src/lib/game-engine/schema";

export const cityDistricts: CityDistrict[] = [
  {
    id: "lantern-wharf",
    assetId: "district.lantern-wharf",
    name: "灯港区",
    archiveName: "DISTRICT 01 · LANTERN WHARF",
    subtitle: "把被拒绝的东西暂存一夜",
    introducedChapter: 1,
    publicVersion: "市政厅称这里如今只办理河运与鲜花批发，旧电车维修线早已封闭。",
    cityRule: "地址失效以后，花、信与旧车票会先来灯港等一晚；清晨以前，它们通常能想起另一条路。",
    landmarks: ["封闭维修站", "夜间花市", "河桥邮槽"],
  },
  {
    id: "old-meridian",
    assetId: "district.old-meridian",
    name: "旧子午区",
    archiveName: "DISTRICT 02 · OLD MERIDIAN",
    subtitle: "钟表负责守时，人们负责保留一分钟",
    introducedChapter: 3,
    publicVersion: "本区钟塔每年通过校验；无名旅馆与退休维修库不再承担公共交通职能。",
    cityRule: "这里没人催促空房退租，也没人纠正慢下来的那一分钟。迟到若足够有礼貌，会被当作仍在履约。",
    landmarks: ["旧子午钟楼", "无名旅馆", "维修车库"],
  },
  {
    id: "glass-hill",
    assetId: "district.glass-hill",
    name: "玻璃丘",
    archiveName: "DISTRICT 03 · GLASS HILL",
    subtitle: "所有正门都面向城市，服务通道面向真相",
    introducedChapter: 4,
    publicVersion: "山坡只保存来源清楚的档案、标本与私人捐赠；地下温室不在开放区域内。",
    cityRule: "玻璃丘的建筑总有两套入口。访客从有台阶的门进去，证据沿没有名字的轨道离开。",
    landmarks: ["档案温室", "私人收藏馆", "废弃信号台"],
  },
].map((district) => cityDistrictSchema.parse(district));

export function getCityDistrict(id: string): CityDistrict {
  const district = cityDistricts.find((item) => item.id === id);
  if (!district) throw new Error(`Unknown city district: ${id}`);
  return district;
}
