import { caseSchema } from "@/src/lib/game-engine/schema";

const clues = [
  ["ticket-date", "昨天的日期", "车票日期是昨天", "纸张已老化七年，日期却是昨天。", "object", 1],
  ["ticket-paper", "七年前的纸", "纸张年代与打印日期矛盾", "纤维与旧票库样本完全一致。", "contradiction", 1],
  ["matchbox", "员工休息室", "火柴盒底部印有43号线", "一家咖啡馆曾为秘密维修线提供夜宵。", "object", 1],
  ["flower-cycle", "四十三天", "匿名花单每43天出现", "每次订单都是一束夜香花。", "event", 2],
  ["postcard", "未寄出的明信片", "明信片没有寄件地址", "字迹属于伊芙琳，证明她离城后仍与米娜联系。", "object", 2],
  ["missing-log", "缺失的日志页", "吉迪恩的维修车日志少了一页", "缺页正好对应伊芙琳失踪的夜晚。", "event", 3],
  ["scratched-map", "被刮掉的轨迹", "档案地图藏着旧电车线", "刮痕下的线路通往没有编号的站台。", "place", 4],
  ["room-307", "没有退房的307", "七年前从未办理退房", "房间一直由同一匿名账户续费。", "place", 3],
  ["transport-photo", "箱子上的姓氏", "照片拍到夜间运输", "每只箱子都属于一个被拆迁家庭。", "event", 3],
  ["museum-tag", "寄存牌号码", "号码与照片中的箱子一致", "私人收藏机构是运输的终点。", "object", 4],
  ["ledger-clasp", "同一批黄铜", "账册封扣与寄存牌同源", "金属批次把账册与秘密运输直接连在一起。", "object", 4],
  ["evelyn-message", "伊芙琳的选择", "她主动消失，并仍然活着", "她要求调查者把选择权交还给证人。", "person", 5],
].map(([id, title, summary, detail, type, chapter]) => ({ id, title, summary, detail, type, chapter, relatedIds: [] as string[] }));

// Avoid self-referential construction details leaking into the authored content.
const authoredClues = clues.map((clue, index) => ({ ...clue, relatedIds: index > 0 ? [String(clues[index - 1].id)] : [] }));

const collectibles = [
  ["torn-ticket", "43号线残票", "🎫", "一张被撕掉终点的旧车票。", "票边有昨夜才留下的雨水，而纸张来自七年前。", "灯港区", "common", 1],
  ["matchbox-item", "旧火柴盒", "▣", "灯港咖啡馆使用的旧火柴。", "盒底印着已经废弃的“43号线员工休息室”。", "灯港区", "unusual", 1],
  ["pressed-flower", "夜香花标本", "❧", "夹在订单簿里的夜香花。", "花茎上的绑法是伊芙琳惯用的暗号。", "灯港区", "unusual", 2],
  ["postcard-item", "无邮票明信片", "✉", "一张没有邮戳的城市夜景。", "背后的句子证明伊芙琳仍在为43天一次的订单付钱。", "灯港区", "rare", 2],
  ["hotel-key", "307黄铜钥匙", "⌑", "老旅馆沉甸甸的房门钥匙。", "钥匙齿痕还打开隐藏站台的设备柜。", "旧子午区", "unusual", 3],
  ["driver-badge", "维修车员工徽章", "✦", "表面磨损严重的电车徽章。", "背面刻着吉迪恩协助逃离的夜班编号。", "旧子午区", "rare", 3],
  ["museum-tag-item", "博物馆寄存牌", "◈", "玻璃丘博物馆的铜牌。", "编号和运输照片里的箱子完全一致。", "玻璃丘", "rare", 4],
  ["ledger-clasp-item", "账册铜制封扣", "⊙", "从废弃温室找到的铜扣。", "它曾锁住记录所有买家与失主姓名的账册。", "玻璃丘", "rare", 4],
].map(([id, title, glyph, surfaceDescription, revealedDescription, district, rarity, chapter]) => ({ id, title, glyph, surfaceDescription, revealedDescription, district, rarity, chapter }));

const chapters = [
  {
    number: 1, title: "不存在的车票", subtitle: "一张旧票，印着昨天的日期。", question: "这张从未发行过的车票，究竟从哪里来？",
    choices: [
      { id: "source", label: "调查车票来源", note: "从纸张、油墨与出票机开始。" },
      { id: "flower", label: "前往灯港花店", note: "寄票人留下了一点夜香花粉。" },
      { id: "track", label: "检查旧电车轨道", note: "沿城市已经遗忘的钢轨行走。" },
    ],
    clueIds: ["ticket-date", "ticket-paper", "matchbox"], collectibleIds: ["torn-ticket", "matchbox-item"],
    route: ["夜班事务所", "河桥", "灯港花店", "旧维修站"],
    events: ["00:52 — 林渡离开了事务所。", "01:18 — 灯港区开始下雨。", "02:07 — 花店后门有人刚刚离开。", "03:43 — 旧站台传来一声电车铃。", "05:11 — 城市开始变亮。"],
    journal: "雨把灯港区的招牌洗得很安静。我沿着票背沾着的花粉找到花店，又从后巷绕到封闭的维修站。那里的出票机已经断电多年，色带却还有余温。车票纸的纤维属于七年前，日期则是昨天。城里有人很擅长保存旧事，也很擅长让旧事重新发生。",
    contradiction: "为什么一张已经停运七年的车票，会印着昨天的日期？",
  },
  {
    number: 2, title: "每隔四十三天的花", subtitle: "夜香花总在同一个清晨送出。", question: "米娜在替谁保守这个持续七年的约定？",
    choices: [
      { id: "mina", label: "询问花店老板", note: "问她为何记得每一笔匿名订单。" },
      { id: "order", label: "跟踪匿名订单", note: "等下一束夜香花离开店门。" },
      { id: "alley", label: "搜索花店后巷", note: "寻找不经邮局传递的信件。" },
    ],
    clueIds: ["flower-cycle", "postcard"], collectibleIds: ["pressed-flower", "postcard-item"],
    route: ["花店雨棚", "旧咖啡馆", "后巷邮槽", "河岸长椅"],
    events: ["00:43 — 花店最后一盏灯熄灭。", "01:26 — 一束没有收件人的花被放在门外。", "02:15 — 咖啡馆旧账本提到43号线。", "03:31 — 后巷邮槽里出现一张明信片。", "05:02 — 米娜承认她仍在等人。"],
    journal: "米娜没有回答我关于伊芙琳的问题，只把门口的夜香花往雨棚里挪了半步。每隔四十三天，同样的花、同样的匿名付款、同样没有地址的明信片。她说自己从未见过伊芙琳，可卡片上写着：谢谢你仍替我照顾那些花。有些谎言不是为了遮住真相，而是为了给某个人留一条回来的路。",
    contradiction: "米娜说从未见过伊芙琳，为什么明信片却在感谢她？",
  },
  {
    number: 3, title: "没有退房的307", subtitle: "一间空房，被续订了七年。", question: "吉迪恩当晚到底载走了什么？",
    choices: [
      { id: "hotel", label: "调查老旅馆", note: "打开那间从未退房的307。" },
      { id: "gideon", label: "寻找吉迪恩", note: "请退休司机解释缺失的夜班。" },
      { id: "log", label: "检查维修车记录", note: "找回被撕走的那一页。" },
    ],
    clueIds: ["missing-log", "room-307", "transport-photo"], collectibleIds: ["hotel-key", "driver-badge"],
    route: ["旧子午钟楼", "无名旅馆", "307号房", "维修车库"],
    events: ["00:43 — 钟楼慢了一分钟。", "01:14 — 307的钥匙仍在前台。", "02:36 — 暗房里显出第一张照片。", "03:48 — 吉迪恩的旧车在河桥边出现。", "05:17 — 他终于承认见过伊芙琳。"],
    journal: "307房的窗帘积了七年的灰，洗手池却很干净。暗房里留下的底片拍到一列维修车，车上的箱子没有货号，只有一个个家庭的姓氏。吉迪恩说自己不记得那晚，可他的日志正好缺了一页。他沉默很久，只纠正了我的一个词：那不是运输，是撤离。",
    contradiction: "照片中的箱子不是货物。为什么每个箱子上都写着一个家庭的姓氏？",
  },
  {
    number: 4, title: "地图上被刮掉的线", subtitle: "一条线路消失得太过刻意。", question: "奥林是在销毁证据，还是在替证据争取时间？",
    choices: [
      { id: "archive", label: "潜入档案馆地下室", note: "检查那只最显眼的旧地图柜。" },
      { id: "museum", label: "追查博物馆寄存牌", note: "去玻璃丘寻找箱子的去向。" },
      { id: "route43", label: "重走完整43号线", note: "让旧轨道自己画出答案。" },
    ],
    clueIds: ["scratched-map", "museum-tag", "ledger-clasp"], collectibleIds: ["museum-tag-item", "ledger-clasp-item"],
    route: ["市立档案馆", "地下地图库", "玻璃丘博物馆", "废弃温室"],
    events: ["00:43 — 档案馆自动灯亮起。", "01:32 — 刮痕下出现第三条轨道。", "02:20 — 寄存牌指向私人库房。", "03:43 — 温室地板下找到铜扣。", "05:09 — 奥林交出唯一的原始地图。"],
    journal: "奥林把43号线从公开地图上刮掉，却把原图藏在第一只会被调查者打开的柜子里。他怕追踪者找到伊芙琳，也怕这座城永远忘记她发现了什么。玻璃丘的寄存牌与照片里箱子的号码一致，温室下的铜扣则属于一本账册。有人藏起路线，是为了阻止追捕；有人藏起账册，是为了等待合适的读者。",
    contradiction: "如果奥林想销毁证据，为什么把原始地图藏在最容易找到的柜子里？",
  },
  {
    number: 5, title: "最后一班车", subtitle: "今夜，隐藏站台重新亮灯。", question: "真相应该被公开、被保护，还是被交还？",
    choices: [
      { id: "platform", label: "前往隐藏站台", note: "沿完整轨迹等最后一班车。" },
      { id: "letter", label: "把明信片交给吉迪恩", note: "让七年前的司机完成约定。" },
      { id: "signal", label: "在玻璃丘等待信号", note: "从高处观察整条43号线。" },
    ],
    clueIds: ["evelyn-message"], collectibleIds: ["ledger-clasp-item"],
    route: ["玻璃丘信号台", "河下隧道", "隐藏站台", "00:43末班车"],
    events: ["00:43 — 废弃信号灯变成琥珀色。", "01:17 — 吉迪恩送来最后一页日志。", "02:43 — 隐藏站台传来脚步。", "03:26 — 完整账册被放在长椅上。", "05:00 — 伊芙琳的录音开始播放。"],
    journal: "零点四十三分，信号灯亮了。站台上没有乘客，只有一本账册和伊芙琳的录音。她承认自己主动消失，也解释了那条线运走的不是货物，而是一座城市从普通人手中偷走的记忆。她没有要求我们替她复仇，只留下一个问题：真相该被公开，还是该先保护仍活着的人？我负责把东西带回来。决定权一直在你。",
    contradiction: "伊芙琳把证据留给我们，却没有把决定也一起留下。",
  },
];

export const nightShiftCase = caseSchema.parse({
  id: "case-001",
  title: "零点四十三分的末班车",
  englishTitle: "The Last Tram at 00:43",
  chapters,
  clues: authoredClues,
  collectibles,
});
