import { cityWatchEchoSchema, cityWatchSchema, type CityWatch, type CityWatchEcho, type CityWatchId } from "@/src/lib/game-engine/schema";

export const DEMO_CITY_WATCH_ID: CityWatchId = "midnight";

export const cityWatches: CityWatch[] = [
  { id: "lamplighting", label: "掌灯时分", archiveLabel: "LAMPLIGHT WATCH", window: "19:00–22:59", description: "店门刚关，窗灯正在逐间接过白昼没有说完的话。" },
  { id: "midnight", label: "夜半时分", archiveLabel: "MIDNIGHT WATCH", window: "23:00–01:59", description: "市政钟声已经交班，仍在街上的事物开始使用自己的称呼。" },
  { id: "last-watch", label: "末更时分", archiveLabel: "LAST WATCH", window: "02:00–05:59", description: "清扫车尚未到，黎明也未签收，城市最不体面的证词留在这段空档。" },
  { id: "daylight", label: "白昼小憩", archiveLabel: "DAYLIGHT INTERLUDE", window: "06:00–18:59", description: "林渡替夜班者走进白昼，关门的夜路只好从影子里继续营业。" },
].map((watch) => cityWatchSchema.parse(watch));

export const cityWatchEchoes: CityWatchEcho[] = [
  { chapter: 1, watchId: "lamplighting", scene: "旧票据工坊刚熄掉柜台灯，废纸篓却还亮着一圈新油墨的蓝。", encounter: "最后离开的排字员把门锁了两次，第二次只锁住了自己的口供。", fieldNote: "掌灯时分的纸最诚实：白班写下它，夜班还没来得及教它改口。" },
  { chapter: 1, watchId: "midnight", scene: "午夜后的工坊只剩压纸机在呼吸，每一次起伏都把七年前的灰尘推近票面。", encounter: "守夜人拒绝认票，账柜则用一声很响的木头开裂表示保留意见。", fieldNote: "钟声停后，家具取得了发言顺序。它们通常比管理员简短，也更难收买。" },
  { chapter: 1, watchId: "last-watch", scene: "末更的雨把新油墨冲向旧纤维，两个年代在排水沟边第一次站到一起。", encounter: "扫街人把一截被否认的轨迹留到最后，因为市政厅没有提供该怎么扫掉它的表格。", fieldNote: "黎明前，城市急着清理证据；幸好它的清洁人员比它更尊重未结事项。" },
  { chapter: 1, watchId: "daylight", scene: "白昼里的封闭维修站把卷帘门降得很低，门缝却把昨日日期照得格外清楚。", encounter: "午休送件员认得票纸的重量，不认得线路；他建议把两件事分别寄给七年前和昨天。", fieldNote: "白天没有让旧线消失，只让它学会躲进柜台、影子和午睡者闭上的眼睛。" },

  { chapter: 2, watchId: "lamplighting", scene: "花市收摊时，多出的一束夜香花被每个摊主依次否认，最后获得了最好的位置。", encounter: "送花学徒把第四十三天写成‘照旧’，仿佛规律比日期更适合签收。", fieldNote: "关店前的谎话总带着零钱声。米娜那一句没有，说明她已经预付了很多年。" },
  { chapter: 2, watchId: "midnight", scene: "夜半花店把香气留在门外，后室那张无地址明信片却在抽屉里慢慢变暖。", encounter: "没有收件人的花束搭上末班夜车，售票员只查了它是否仍被等待。", fieldNote: "午夜以后，地址失去权威，约定接管投递。邮局对此尚未寄来能够抵达的抗议。" },
  { chapter: 2, watchId: "last-watch", scene: "末更的花瓣开始合拢，第四十三日的订单却刚刚展开，像一只拒绝睡去的信封。", encounter: "河岸擦椅人每天只擦一张长椅；他说灰尘会泄露谁仍在按期回来。", fieldNote: "最晚的花不是开得迟，只是在等街上没有旁观者时承认自己的收件人。" },
  { chapter: 2, watchId: "daylight", scene: "白昼花店把夜香花藏到遮光布下，香气仍从布边替一个缺席的人排队。", encounter: "午睡的邮差认出后巷邮槽的回声，说那不是邮路，只是城市偶尔想把信送对。", fieldNote: "日光适合辨认花的颜色，不适合逼问它替谁保密。影子替我完成了后半句。" },

  { chapter: 3, watchId: "lamplighting", scene: "旅馆晚餐钟响过后，307号房的餐盘仍被送上楼，账单姓名一栏照旧空白。", encounter: "前台夜班员坚持空房无需服务，同时把餐刀摆成了两人份。", fieldNote: "交班簿不会说谎，它只会把谎言写成例行事项，再请下一班签名。" },
  { chapter: 3, watchId: "midnight", scene: "午夜的307把走廊灯压成四个浅色方框，恰好对应墙上失踪的照片。", encounter: "吉迪恩在夜食摊只点热水；摊主仍把七年前那杯咖啡记在他名下。", fieldNote: "有些欠账不是为了催还，而是防止一段共同记忆被任何一方独自注销。" },
  { chapter: 3, watchId: "last-watch", scene: "末更的维修车库开始给从未出车的车辆热机，排气在地面写出缺失的一页。", encounter: "修车师傅能说出每只轮胎的年纪，却突然不会数到第四十三页。", fieldNote: "人临近黎明会疲倦，机械不会。它们把每一次被要求遗忘都磨进同一个齿轮。" },
  { chapter: 3, watchId: "daylight", scene: "白昼的307拉着遮光帘，房门铜牌在午后仍像一轮不肯升起的小月亮。", encounter: "客房清洁员保留四块墙纸不擦；她说那里的灰属于已经被取走的照片。", fieldNote: "白班把房间整理得像无人来过，只有被特意留下的灰尘拒绝配合。" },

  { chapter: 4, watchId: "lamplighting", scene: "档案馆闭馆前把地下三层的灯全部关掉，错误分类柜却逐格亮起黄铜标签。", encounter: "最后一位借阅员归还了一张不存在的地图，并因逾期七年获得免罚。", fieldNote: "闭馆铃宣布阅读结束，档案没有同意。它们只是换了一批不需要借阅证的读者。" },
  { chapter: 4, watchId: "midnight", scene: "夜半档案馆的升降梯只显示负数，地下三层坚持自己位于建筑上方。", encounter: "奥林留下的书签挡住抽屉自动上锁，像一条措辞谨慎的求救。", fieldNote: "午夜适合阅读误分类：白天它像错误，灯熄后才显出谁被它保护。" },
  { chapter: 4, watchId: "last-watch", scene: "末更的清洁车沿被刮掉的路线绕行，轮印替原始地图补上最后一个弯。", encounter: "清洁员说那只是习惯；重力则拒绝把七年的习惯称为偶然。", fieldNote: "档案可以删除墨线，地板仍会教推车怎样转弯。城市的身体比记忆更难审查。" },
  { chapter: 4, watchId: "daylight", scene: "白昼阅览室把原始地图夹在旅游折页之间，所有人都看见它，却只当成过时路线。", encounter: "午休馆员替寄存牌查号，查询结果先显示‘来源不详’，随后很快地脸红。", fieldNote: "日光让证据更容易看见，也更容易被解释成无关紧要。两者只差一个愿意停下的人。" },

  { chapter: 5, watchId: "lamplighting", scene: "玻璃丘最后一批窗灯亮起时，每扇否认43号线的窗都朝旧轨投下一条细线。", encounter: "信号台值班表没有今晚，灯却提前替缺席者签了到。", fieldNote: "掌灯人不负责真相，只负责让每一扇坚持沉默的窗变得可以被数清。" },
  { chapter: 5, watchId: "midnight", scene: "夜半的隐藏站台没有广播，所有停在不同时间的钟却同时让出一秒给00:43。", encounter: "候车长椅替账册保留了座位，旧闸机则把一句承诺当作有效车票。", fieldNote: "没有人承认列车会来，因此每个人都提前到了。真相也有自己的时刻表。" },
  { chapter: 5, watchId: "last-watch", scene: "末更的雾从隧道向外退，完整账册在黎明签收前仍保持一本私人信件的重量。", encounter: "第一班清晨电车的司机看见旧信号亮起，选择把早到一分钟写成机械误差。", fieldNote: "黎明会要求一切重新归类。我赶在它动笔前，让选择权仍然属于原来的主人。" },
  { chapter: 5, watchId: "daylight", scene: "白昼信号台只剩玻璃反光，隐藏站台却把入口藏进每个短暂闭眼的乘客影子里。", encounter: "午睡的检票员梦见一张无目的地车票，醒来后发现票钳多了一个返程孔。", fieldNote: "白天也有末班车，只是它从疲倦的人眼后经过。城市把这类路线归为休息，而不是失踪。" },
].map((echo) => cityWatchEchoSchema.parse(echo));

export function getCityWatchId(startedAt: Date): CityWatchId {
  const hour = startedAt.getHours();
  if (hour >= 19 && hour <= 22) return "lamplighting";
  if (hour >= 23 || hour <= 1) return "midnight";
  if (hour <= 5) return "last-watch";
  return "daylight";
}

export function getCityWatch(id: CityWatchId): CityWatch {
  const watch = cityWatches.find((item) => item.id === id);
  if (!watch) throw new Error(`Unknown city watch: ${id}`);
  return watch;
}

export function getCityWatchEcho(chapter: number, watchId: CityWatchId): CityWatchEcho {
  const echo = cityWatchEchoes.find((item) => item.chapter === chapter && item.watchId === watchId);
  if (!echo) throw new Error(`Missing city watch echo for chapter ${chapter}, watch ${watchId}`);
  return echo;
}
