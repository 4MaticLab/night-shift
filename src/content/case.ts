import { caseSchema } from "@/src/lib/game-engine/schema";

const clues = [
  ["ticket-date", "昨天的日期", "车票日期是昨天", "纸张已老化七年，日期却是昨天。", "售票处坚持日期只负责把乘客送上某一天，并不负责保证那一天真的发生过。", "油墨还带着昨夜的潮气；纸边却已经学会了七年前的脆弱。", "object", 1],
  ["ticket-paper", "七年前的纸", "纸张年代与打印日期矛盾", "纤维与旧票库样本完全一致。", "市立票库否认曾遗失这批旧纸，同时提交了三份互不相同的遗失日期。", "纸不会替谁作伪。负责给纸盖章的人会。", "object", 1],
  ["matchbox", "员工休息室", "火柴盒底部印有43号线", "一家咖啡馆曾为秘密维修线提供夜宵。", "咖啡馆说夜宵只卖给下班的人；至于一条不存在的线路怎样下班，它拒绝讨论。", "盒里少了最后一根火柴，像有人出门前替同伴留了一点光。", "object", 1],
  ["flower-cycle", "四十三天", "匿名花单每43天出现", "每次订单都是一束夜香花。", "灯港花市认为四十三天不是周期，只是某位顾客长期迟到而形成的礼貌习惯。", "规律不是答案。它只证明有人七年没有忘记按时想念。", "event", 2],
  ["postcard", "未寄出的明信片", "明信片没有寄件地址", "字迹属于伊芙琳，证明她离城后仍与米娜联系。", "邮局主张没有地址的信不算邮件；后巷邮槽则主张邮局不算唯一的路。", "她没有写自己在哪里，只写花还需要水。这已经是一种报平安。", "object", 2],
  ["missing-log", "缺失的日志页", "吉迪恩的维修车日志少了一页", "缺页正好对应伊芙琳失踪的夜晚。", "车务处称少一页不影响档案完整；它对“完整”的定义显然比纸张宽容。", "撕页的人留下了装订线。沉默也有可以测量的宽度。", "event", 3],
  ["scratched-map", "被刮掉的轨迹", "档案地图藏着旧电车线", "刮痕下的线路通往没有编号的站台。", "档案馆坚持刮痕不是路线，只是一位保管员对墨水进行过度热情的纠正。", "墨能被刮掉，坡度不能。城市的腿比它的档案诚实。", "place", 4],
  ["room-307", "没有退房的307", "七年前从未办理退房", "房间一直由同一匿名账户续费。", "旅馆不承认307号房有人居住，只承认它的空置状态一直按月续订。", "床没有睡过人，洗手池却被用过。有人保留的不是房间，是退路。", "place", 3],
  ["transport-photo", "箱子上的姓氏", "照片拍到夜间运输", "每只箱子都属于一个被拆迁家庭。", "博物馆称箱上的姓氏属于捐赠者；那些家庭则从未被询问是否愿意捐出过去。", "这不是货单。每个姓氏后面都该有一扇曾经锁得上的门。", "event", 3],
  ["museum-tag", "寄存牌号码", "号码与照片中的箱子一致", "私人收藏机构是运输的终点。", "寄存处说号码只证明物件到过这里，不证明这里曾打算把它们留下。", "编号不会说明所有权，却很擅长说明一只箱子被谁接过。", "object", 4],
  ["ledger-clasp", "同一批黄铜", "账册封扣与寄存牌同源", "金属批次把账册与秘密运输直接连在一起。", "采购处认为同批黄铜只是一种巧合；它刚好把同一句解释抄进了七本账。", "扣子负责让账册合拢。有人却忘了，金属也会保存指纹和来路。", "object", 4],
  ["evelyn-message", "伊芙琳的选择", "她主动消失，并仍然活着", "她要求调查者把选择权交还给证人。", "市政厅愿意承认一段录音存在，但拒绝承认录音里的人有权决定自己的出现方式。", "她留下的不是遗言，是一项仍然有效的委托：别替活人写完结局。", "person", 5],
].map(([id, title, summary, detail, cityObjection, marginNote, type, chapter]) => ({ id, title, summary, detail, cityObjection, marginNote, type, chapter, relatedIds: [] as string[] }));

// Avoid self-referential construction details leaking into the authored content.
const authoredClues = clues.map((clue, index) => ({ ...clue, relatedIds: index > 0 ? [String(clues[index - 1].id)] : [] }));

const collectibles = [
  ["torn-ticket", "43号线残票", "🎫", "collectible.torn-ticket", "一张被撕掉终点的旧车票。", "票边有昨夜才留下的雨水，而纸张来自七年前。", "灯港区", "common", 1],
  ["matchbox-item", "旧火柴盒", "▣", "collectible.matchbox", "灯港咖啡馆使用的旧火柴。", "盒底印着已经废弃的“43号线员工休息室”。", "灯港区", "unusual", 1],
  ["pressed-flower", "夜香花标本", "❧", "collectible.pressed-flower", "夹在订单簿里的夜香花。", "花茎上的绑法是伊芙琳惯用的暗号。", "灯港区", "unusual", 2],
  ["postcard-item", "无邮票明信片", "✉", "collectible.postcard", "一张没有邮戳的城市夜景。", "背后的句子证明伊芙琳仍在为43天一次的订单付钱。", "灯港区", "rare", 2],
  ["hotel-key", "307黄铜钥匙", "⌑", "collectible.hotel-key", "老旅馆沉甸甸的房门钥匙。", "钥匙齿痕还打开隐藏站台的设备柜。", "旧子午区", "unusual", 3],
  ["driver-badge", "维修车员工徽章", "✦", "collectible.driver-badge", "表面磨损严重的电车徽章。", "背面刻着吉迪恩协助逃离的夜班编号。", "旧子午区", "rare", 3],
  ["museum-tag-item", "博物馆寄存牌", "◈", "collectible.museum-token", "玻璃丘博物馆的铜牌。", "编号和运输照片里的箱子完全一致。", "玻璃丘", "rare", 4],
  ["ledger-clasp-item", "账册铜制封扣", "⊙", "collectible.ledger-clasp", "从废弃温室找到的铜扣。", "它曾锁住记录所有买家与失主姓名的账册。", "玻璃丘", "rare", 4],
].map(([id, title, glyph, assetId, surfaceDescription, revealedDescription, district, rarity, chapter]) => ({ id, title, glyph, assetId, surfaceDescription, revealedDescription, district, rarity, chapter }));

const chapters = [
  {
    number: 1, title: "不存在的车票", subtitle: "一张旧票，印着昨天的日期。", cityAside: "雾灯城市政厅不承认废线。它只承认尚未补税的路线。", question: "这张从未发行过的车票，究竟从哪里来？",
    choices: [
      { id: "source", label: "让纸张先开口", note: "相信纤维与油墨不会串供。" },
      { id: "flower", label: "把花粉带回花店", note: "相信气味比地址更记得来路。" },
      { id: "track", label: "沿被否认的轨道走", note: "相信城市忘记的，铁轨仍会记得。" },
    ],
    clueIds: ["ticket-date", "ticket-paper", "matchbox"], collectibleIds: ["torn-ticket", "matchbox-item"],
    route: ["夜班事务所", "河桥", "灯港花店", "旧维修站"],
    events: ["00:52 — 林渡离开了事务所。", "01:18 — 灯港区开始下雨。", "02:07 — 花店后门有人刚刚离开。", "03:43 — 旧站台传来一声电车铃。", "05:11 — 城市开始变亮。"],
    journal: "雨把灯港区的招牌洗得很安静，只有市政厅那块仍在尽职撒谎：此处从无43号线。我沿票背的花粉绕到封闭维修站。出票机断电七年，色带却有余温；旧纸纤维记得伊芙琳失踪那年，新油墨只承认昨天。雾灯城擅长保存旧事，尤其是它已经盖章否认过的那些。",
    contradiction: "为什么一张已经停运七年的车票，会印着昨天的日期？",
  },
  {
    number: 2, title: "每隔四十三天的花", subtitle: "夜香花总在同一个清晨送出。", cityAside: "灯港的花店十点关门。悲伤若提前预约，可以晚一些。", question: "米娜在替谁保守这个持续七年的约定？",
    choices: [
      { id: "mina", label: "给米娜一次说谎的机会", note: "人们第二次回答时，常会忘记第一版。" },
      { id: "order", label: "跟在无主花束后面", note: "有些收件人只在没人看见时出现。" },
      { id: "alley", label: "问问不属于邮局的信箱", note: "雾灯城的信件不总信任邮差。" },
    ],
    clueIds: ["flower-cycle", "postcard"], collectibleIds: ["pressed-flower", "postcard-item"],
    route: ["花店雨棚", "旧咖啡馆", "后巷邮槽", "河岸长椅"],
    events: ["00:43 — 花店最后一盏灯熄灭。", "01:26 — 一束没有收件人的花被放在门外。", "02:15 — 咖啡馆旧账本提到43号线。", "03:31 — 后巷邮槽里出现一张明信片。", "05:02 — 米娜承认她仍在等人。"],
    journal: "米娜没有回答关于伊芙琳的问题，只把夜香花往雨棚里挪了半步。花每四十三天出现，付款人没有名字，明信片没有地址——邮局大概会把这称为手续不全，雾灯城把它称为忠诚。米娜说从未见过伊芙琳，卡片却感谢她照看那些花。有些谎言不是墙，是替某个人虚掩着的门。",
    contradiction: "米娜说从未见过伊芙琳，为什么明信片却在感谢她？",
  },
  {
    number: 3, title: "没有退房的307", subtitle: "一间空房，被续订了七年。", cityAside: "无名旅馆从不问客人是否离开。替客人保管钥匙，比较体面。", question: "吉迪恩当晚到底载走了什么？",
    choices: [
      { id: "hotel", label: "替307号房完成退房", note: "相信一间空房也可能欠下口供。" },
      { id: "gideon", label: "请吉迪恩再忘一次", note: "观察他这次会避开哪一个名字。" },
      { id: "log", label: "寻找日志缺失的形状", note: "被撕走的一页也会留下纸边。" },
    ],
    clueIds: ["missing-log", "room-307", "transport-photo"], collectibleIds: ["hotel-key", "driver-badge"],
    route: ["旧子午钟楼", "无名旅馆", "307号房", "维修车库"],
    events: ["00:43 — 钟楼慢了一分钟。", "01:14 — 307的钥匙仍在前台。", "02:36 — 暗房里显出第一张照片。", "03:48 — 吉迪恩的旧车在河桥边出现。", "05:17 — 他终于承认见过伊芙琳。"],
    journal: "307的窗帘积了七年灰，洗手池却干净得像刚洗掉一个名字。暗房底片里，一列维修车拖着没有货号的箱子；每只箱子只写着一个家庭的姓。吉迪恩说不记得那晚，他的日志也很配合，恰好少了一页。他沉默很久，只纠正我一个词：那不是运输，是撤离。",
    contradiction: "照片中的箱子不是货物。为什么每个箱子上都写着一个家庭的姓氏？",
  },
  {
    number: 4, title: "地图上被刮掉的线", subtitle: "一条线路消失得太过刻意。", cityAside: "档案馆声称没有地下室。地下室对此保留了三层楼的意见。", question: "奥林是在销毁证据，还是在替证据争取时间？",
    choices: [
      { id: "archive", label: "拜访不存在的地下室", note: "档案馆否认得越完整，入口通常越近。" },
      { id: "museum", label: "替寄存牌寻找失主", note: "博物馆擅长收藏，也擅长改写来源。" },
      { id: "route43", label: "让脚步重画43号线", note: "城市刮掉墨迹，却刮不掉坡度。" },
    ],
    clueIds: ["scratched-map", "museum-tag", "ledger-clasp"], collectibleIds: ["museum-tag-item", "ledger-clasp-item"],
    route: ["市立档案馆", "地下地图库", "玻璃丘博物馆", "废弃温室"],
    events: ["00:43 — 档案馆自动灯亮起。", "01:32 — 刮痕下出现第三条轨道。", "02:20 — 寄存牌指向私人库房。", "03:43 — 温室地板下找到铜扣。", "05:09 — 奥林交出唯一的原始地图。"],
    journal: "奥林把43号线从公开地图上刮掉，却把原图藏在第一个会被调查者打开的柜子里。这是档案员式的勇敢：把真相归进错误分类，再祈祷合适的人犯一次正确的错。玻璃丘寄存牌与照片箱号一致，温室下的铜扣属于一本账册。路线被藏起，是为阻止追捕；账册被藏起，是在等一位不会急着拥有它的读者。",
    contradiction: "如果奥林想销毁证据，为什么把原始地图藏在最容易找到的柜子里？",
  },
  {
    number: 5, title: "最后一班车", subtitle: "今夜，隐藏站台重新亮灯。", cityAside: "末班车从不迟到。它只是偶尔等所有钟表把谎说完。", question: "真相应该被公开、被保护，还是被交还？",
    choices: [
      { id: "platform", label: "去站台等一辆被否认的车", note: "接受时刻表也可能害怕真相。" },
      { id: "letter", label: "把迟到七年的信交给司机", note: "有些路线只有承诺可以重新启动。" },
      { id: "signal", label: "在玻璃丘替城市守望", note: "从高处等所有谎言依次亮灯。" },
    ],
    clueIds: ["evelyn-message"], collectibleIds: ["ledger-clasp-item"],
    route: ["玻璃丘信号台", "河下隧道", "隐藏站台", "00:43末班车"],
    events: ["00:43 — 废弃信号灯变成琥珀色。", "01:17 — 吉迪恩送来最后一页日志。", "02:43 — 隐藏站台传来脚步。", "03:26 — 完整账册被放在长椅上。", "05:00 — 伊芙琳的录音开始播放。"],
    journal: "零点四十三分，信号灯亮了。站台上没有乘客，只有一本账册和伊芙琳的声音。她承认主动消失；43号线运走的从来不是货物，而是这座城从普通人手里借走、并打算永久忘记归还的记忆。她没有请求复仇，只问：真相该被公开，还是该先保护仍活着的人？我把东西带回来了。雾灯城已经投过票——它选择沉默。现在轮到你。",
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
