import { z } from "zod";
import { LAST_TRAM_CAMPAIGN_ID } from "./campaigns/last-tram";
import { RAIN_RADIO_CAMPAIGN_ID } from "./campaigns/rain-radio";
import { THIRTEENTH_LOAF_CAMPAIGN_ID } from "./campaigns/thirteenth-loaf";
import { CHIHAYA_NOA_CAMPAIGN_ID } from "./campaigns/chihaya-noa";
import { FOG_WITHOUT_WOLVES_CAMPAIGN_ID } from "./campaigns/fog-without-wolves";

const cipherDialSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  initial: z.number(),
  target: z.number(),
  precision: z.number().int().min(0).max(3),
  mode: z.enum(["minutes", "frequency", "count"]),
  instrumentLabel: z.string().min(1).optional(),
  signalLabels: z.object({
    silent: z.string().min(1),
    faint: z.string().min(1),
    clear: z.string().min(1),
    locked: z.string().min(1),
  }).optional(),
  ariaLabel: z.string().min(1),
  decreaseLabel: z.string().min(1),
  increaseLabel: z.string().min(1),
  lockLabel: z.string().min(1),
  unit: z.string(),
}).superRefine((dial, ctx) => {
  if (dial.max <= dial.min) ctx.addIssue({ code: "custom", path: ["max"], message: "Dial max must exceed min" });
  if (dial.initial < dial.min || dial.initial > dial.max) ctx.addIssue({ code: "custom", path: ["initial"], message: "Dial initial value is out of range" });
  if (dial.target < dial.min || dial.target > dial.max) ctx.addIssue({ code: "custom", path: ["target"], message: "Dial target value is out of range" });
});

export type CipherDial = z.infer<typeof cipherDialSchema>;

const cipherChallengeSchema = z.object({
  id: z.string().min(1),
  campaignId: z.string().min(1),
  order: z.number().int().positive(),
  archiveLabel: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  requiredClueIds: z.array(z.string().min(1)).min(1),
  cipherLabel: z.string().min(1),
  cipherTokens: z.array(z.string().min(1)).min(1),
  instruction: z.string().min(1),
  prompt: z.string().min(1),
  answerAliases: z.array(z.string().min(1)).min(1),
  hints: z.tuple([z.string().min(1), z.string().min(1)]),
  revealTitle: z.string().min(1),
  revealText: z.string().min(1),
  dial: cipherDialSchema.optional(),
});

export type CipherChallenge = z.infer<typeof cipherChallengeSchema>;

const cipherRelaySchema = z.object({
  id: z.string().min(1),
  archiveLabel: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  instruction: z.string().min(1),
  fragments: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), note: z.string().min(1) })).min(3),
  solutionIds: z.array(z.string().min(1)).min(3),
  hints: z.tuple([z.string().min(1), z.string().min(1)]),
}).superRefine((relay, ctx) => {
  const fragmentIds = relay.fragments.map((fragment) => fragment.id);
  if (new Set(fragmentIds).size !== fragmentIds.length) ctx.addIssue({ code: "custom", path: ["fragments"], message: "Relay fragment ids must be unique" });
  if (new Set(relay.solutionIds).size !== relay.solutionIds.length || relay.solutionIds.length !== fragmentIds.length) {
    ctx.addIssue({ code: "custom", path: ["solutionIds"], message: "Relay solution must contain every fragment exactly once" });
  }
  if (relay.solutionIds.some((fragmentId) => !fragmentIds.includes(fragmentId))) {
    ctx.addIssue({ code: "custom", path: ["solutionIds"], message: "Relay solution references an unknown fragment" });
  }
});

export type CipherRelay = z.infer<typeof cipherRelaySchema>;

const cipherDeskSchema = z.object({
  campaignId: z.string().min(1),
  archiveLabel: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  completionLabel: z.string().min(1),
  completionTitle: z.string().min(1),
  completionText: z.string().min(1),
  relay: cipherRelaySchema,
  challenges: z.array(cipherChallengeSchema).min(1),
}).superRefine((desk, ctx) => {
  const ids = new Set(desk.challenges.map((challenge) => challenge.id));
  const orders = new Set(desk.challenges.map((challenge) => challenge.order));
  if (ids.size !== desk.challenges.length) ctx.addIssue({ code: "custom", path: ["challenges"], message: "Cipher challenge ids must be unique" });
  if (orders.size !== desk.challenges.length) ctx.addIssue({ code: "custom", path: ["challenges"], message: "Cipher challenge orders must be unique" });
  if (desk.challenges.some((challenge) => challenge.campaignId !== desk.campaignId)) {
    ctx.addIssue({ code: "custom", path: ["challenges"], message: "Cipher challenges must belong to their desk campaign" });
  }
});

export type CipherDeskDefinition = z.infer<typeof cipherDeskSchema>;

const lastTramCiphers = [
  {
    id: "ticket-mirror",
    campaignId: LAST_TRAM_CAMPAIGN_ID,
    order: 1,
    archiveLabel: "CIPHER 01 · REVERSED PUNCH",
    title: "倒置的剪票孔",
    subtitle: "旧票背面只剩两组被倒放的数字。",
    requiredClueIds: ["ticket-date", "ticket-paper"],
    cipherLabel: "票背残码",
    cipherTokens: ["34", "00"],
    instruction: "检票员把整张票倒转后才会打孔。不要把它读成线路编号，要把两组数字翻回一个时刻。",
    prompt: "这张票指向几点几分？",
    answerAliases: ["00:43", "0043", "零点四十三分"],
    hints: ["先交换左右两组数字。", "答案使用 24 小时时刻；城市最常否认的那个时间已经在标题里出现过。"],
    revealTitle: "零点四十三分",
    revealText: "剪票孔不是车次，而是一枚约定的时刻。那张昨天打印的旧票，仍在等待一班只于 00:43 抵达的车。",
    dial: {
      min: 0,
      max: 59,
      step: 1,
      initial: 34,
      target: 43,
      precision: 0,
      mode: "minutes",
      ariaLabel: "隐藏站钟分钟刻度",
      decreaseLabel: "把站钟向前调一分钟",
      increaseLabel: "把站钟向后调一分钟",
      lockLabel: "核对站钟时刻",
      unit: "",
    },
  },
  {
    id: "florist-numbers",
    campaignId: LAST_TRAM_CAMPAIGN_ID,
    order: 2,
    archiveLabel: "CIPHER 02 · FLORIST LEDGER",
    title: "花店的无名订单",
    subtitle: "四个数字写在每隔四十三天出现一次的花单角落。",
    requiredClueIds: ["flower-cycle", "postcard"],
    cipherLabel: "订单签名",
    cipherTokens: ["13", "09", "14", "01"],
    instruction: "米娜的旧账本把 A 记作 01、B 记作 02，依次写到 Z。把四个数字换回字母。",
    prompt: "是谁在替这份订单保管名字？",
    answerAliases: ["MINA", "米娜"],
    hints: ["13 对应字母 M。", "按 A=01 的顺序，09、14、01 分别对应 I、N、A。"],
    revealTitle: "MINA",
    revealText: "订单没有收件地址，却一直保留同一个保管人。米娜不是花的主人；她是在替一位仍活着的人维持联络。",
  },
  {
    id: "platform-chronology",
    campaignId: LAST_TRAM_CAMPAIGN_ID,
    order: 3,
    archiveLabel: "CIPHER 03 · FORGOTTEN TIMETABLE",
    title: "被刮掉的站台名",
    subtitle: "档案馆留下六枚不按时间排列的时钟印章。",
    requiredClueIds: ["scratched-map", "museum-tag", "ledger-clasp"],
    cipherLabel: "时钟印章",
    cipherTokens: ["03:26 · D", "00:43 · H", "05:00 · N", "02:43 · D", "04:12 · E", "01:17 · I"],
    instruction: "把印章按照夜晚从早到晚排列，再依次抄下每个时刻旁的字母。",
    prompt: "档案馆刮掉的是哪一种站台？",
    answerAliases: ["HIDDEN", "隐藏", "隐藏站台"],
    hints: ["最早的印章是 00:43，最晚的是 05:00。", "排序后的字母依次是 H、I、D、D、E、N。"],
    revealTitle: "HIDDEN PLATFORM · 隐藏站台",
    revealText: "地图上的刮痕不是删除失败，而是一条保护路线。六枚时钟印章共同指向河下那座没有编号的隐藏站台。",
  },
].map((challenge) => cipherChallengeSchema.parse(challenge));

const rainRadioCiphers = [
  {
    id: "rain-frequency-lock",
    campaignId: RAIN_RADIO_CAMPAIGN_ID,
    order: 1,
    archiveLabel: "SIGNAL 01 · RAIN DIAL",
    title: "雨滴调频锁",
    subtitle: "停电控制台留下三组刻线，雨滴占据了本该属于小数点的位置。",
    requiredClueIds: ["radio-warm-dial", "rain-frequency"],
    cipherLabel: "旋钮刻线",
    cipherTokens: ["19", "27", "雨滴", "13", "MHz"],
    instruction: "每组数字只抄最后一位；把雨滴当作小数点，单位保留为兆赫。",
    prompt: "电台在雨中锁定了哪个频率？",
    answerAliases: ["97.3", "97.3MHz", "九十七点三"],
    hints: ["19、27、13 的末位分别是 9、7、3。", "把雨滴放在 7 和 3 之间：97.3 MHz。"],
    revealTitle: "97.3 MHz · 无人频率",
    revealText: "旋钮并没有随机漂移。雨水每次都把控制台接回九十七点三兆赫——那是四十七户证词共同使用的入口。",
    dial: {
      min: 96.8,
      max: 97.8,
      step: 0.1,
      initial: 96.9,
      target: 97.3,
      precision: 1,
      mode: "frequency",
      ariaLabel: "雨中电台调频刻度",
      decreaseLabel: "频率降低零点一兆赫",
      increaseLabel: "频率升高零点一兆赫",
      lockLabel: "锁定当前频率",
      unit: "MHz",
    },
  },
  {
    id: "silent-call-count",
    campaignId: RAIN_RADIO_CAMPAIGN_ID,
    order: 2,
    archiveLabel: "SIGNAL 02 · SILENT LEDGER",
    title: "沉默来电的户数",
    subtitle: "计费簿记录了一百七十一次无声来电，其中三十次只是断线后的重拨。",
    requiredClueIds: ["mute-reel", "caller-list", "tunnel-echo"],
    cipherLabel: "接线员算式",
    cipherTokens: ["171 次", "− 30 次重拨", "÷ 每户 3 次"],
    instruction: "先扣掉断线重拨；剩余来电中，每一户都恰好留下三次呼吸波形。",
    prompt: "有多少户居民共同维持这条沉默线路？",
    answerAliases: ["47", "四十七", "四十七户"],
    hints: ["真正属于住户的记录共有 171 − 30 = 141 次。", "141 ÷ 3 = 47。"],
    revealTitle: "47 户仍在回答",
    revealText: "沉默不是空白。计费簿、呼吸波形和防空管回声共同证明，地图上被删掉的四十七户居民仍在维护这条线路。",
  },
  {
    id: "relay-morse-voice",
    campaignId: RAIN_RADIO_CAMPAIGN_ID,
    order: 3,
    archiveLabel: "SIGNAL 03 · RELAY TAIL",
    title: "雨中中继的尾音",
    subtitle: "中继箱每次归零前都会敲出五组长短不一的雨声。",
    requiredClueIds: ["demolition-map", "relay-seal", "numbered-key"],
    cipherLabel: "摩尔斯尾音",
    cipherTokens: ["...-", "---", "..", "-.-.", "."],
    instruction: "把短雨点当作点、长排水声当作划，按国际摩尔斯字母表逐组翻译。",
    prompt: "中继箱要求我们把什么还给居民？",
    answerAliases: ["VOICE", "声音", "话语权"],
    hints: ["第一组 ...- 是 V，最后一组 . 是 E。", "五组字母依次是 V、O、I、C、E。"],
    revealTitle: "VOICE · 声音",
    revealText: "中继箱保存的不是预言，而是一项请求：别替居民完成最后一次广播，把使用公共频率的声音还给他们。",
  },
].map((challenge) => cipherChallengeSchema.parse(challenge));

const thirteenthLoafCiphers = [
  {
    id: "loaf-thirteen-count",
    campaignId: THIRTEENTH_LOAF_CAMPAIGN_ID,
    order: 1,
    archiveLabel: "OVEN NOTE 01 · DAILY TALLY",
    title: "没有主人的烘焙总数",
    subtitle: "账房把十二枚持份环和一张空白访客牌放在同一行。",
    requiredClueIds: ["extra-loaf", "twelve-tallies", "blank-guest-share"],
    cipherLabel: "每日烘焙算式",
    cipherTokens: ["12 枚持份环", "+", "1 张无字访客牌"],
    instruction: "持份环代表有主份额；访客牌虽不对应成员，仍计入每日必须完成的烘焙量。",
    prompt: "地下公共炉每天至少要烤出多少只面包？",
    answerAliases: ["13", "十三", "十三只"],
    hints: ["合作社只有十二名持份人，但访客份额也必须被烤出来。", "12 + 1 = 13。"],
    revealTitle: "13 · 多出的不是成员",
    revealText: "第十三只面包从来不属于第十三个人。它是一项每天重新履行、任何需要者都能使用的访客份额。",
  },
  {
    id: "loaf-fire-direction",
    campaignId: THIRTEENTH_LOAF_CAMPAIGN_ID,
    order: 2,
    archiveLabel: "OVEN NOTE 02 · HEAT DIRECTION",
    title: "焦痕的逆向口供",
    subtitle: "三件物证分别保存了热量抵达的先后顺序。",
    requiredClueIds: ["conduit-scorch", "intact-oven", "corrected-inspection"],
    cipherLabel: "热量顺序",
    cipherTokens: ["主管熔断", "→", "外墙碳化", "→", "炉门受热"],
    instruction: "从最先损坏的物件读到最后受热的位置。答案不是被指控的设备，而是热量真正开始的地方。",
    prompt: "火灾从哪一套设施开始？",
    answerAliases: ["热力主管", "市政热力主管", "主管", "HEAT MAIN", "CONDUIT"],
    hints: ["面包炉内部没有由内向外的裂纹。", "最先熔化的是炉桥下的市政热力主管。"],
    revealTitle: "MUNICIPAL HEAT MAIN · 市政热力主管",
    revealText: "熔断器、焦痕与修正页给出同一个方向：火从公共管道烧进面包房，原报告把箭头倒转了。",
  },
  {
    id: "loaf-common-code",
    campaignId: THIRTEENTH_LOAF_CAMPAIGN_ID,
    order: 3,
    archiveLabel: "OVEN NOTE 03 · STARTER LABEL",
    title: "酵母罐的六格暗号",
    subtitle: "分散酵母清册只留下六个按字母顺序编号的格子。",
    requiredClueIds: ["starter-census", "night-bake-ledger", "courier-route"],
    cipherLabel: "窗台编号",
    cipherTokens: ["03", "15", "13", "13", "15", "14"],
    instruction: "把 A 记作 01、B 记作 02，依次换回六个字母。它描述的不是某位领袖，而是酵母和劳动的保管方式。",
    prompt: "这套夜间网络把酵母当作什么来保管？",
    answerAliases: ["COMMON", "公共", "共有", "共同"],
    hints: ["03、15 分别对应 C、O。", "六个字母依次是 C、O、M、M、O、N。"],
    revealTitle: "COMMON · 共同保管",
    revealText: "酵母不由一个人拥有或控制。分散的窗台与无负责人夜账共同证明，合作社靠共享保管而不是隐秘领袖延续。",
  },
].map((challenge) => cipherChallengeSchema.parse(challenge));

const chihayaNoaCiphers = [
  {
    id: "noa-arrival-count",
    campaignId: CHIHAYA_NOA_CAMPAIGN_ID,
    order: 1,
    archiveLabel: "REFLECTION 01 · ARRIVAL REGISTER",
    title: "第十三次抵达刻度",
    subtitle: "入境厅留下十二枚有效印章，明日车票又在站钟下提前打出一枚孔。",
    requiredClueIds: ["twelve-entry-stamps", "tomorrow-ticket", "thirteen-school-portraits"],
    cipherLabel: "返照计数",
    cipherTokens: ["12 次已登记抵达", "+", "1 张明日车票"],
    instruction: "把每份可独立验证的抵达都保留在刻度上。不要因为姓名相同就把其中任何一份折叠掉。",
    prompt: "返照记录里共有多少次独立抵达？",
    answerAliases: ["13", "13份", "十三", "十三次"],
    hints: ["十二枚入境章都能通过纸张、日期与指纹验证。", "再加上已经留下剪票孔的明日车票：12 + 1 = 13。"],
    revealTitle: "13 · 十三次抵达",
    revealText: "档案不是同一份记录的复印件。十三次抵达各自拥有日期、路线与磨损，不能被压缩成一次行政错误。",
    dial: {
      min: 1,
      max: 13,
      step: 1,
      initial: 1,
      target: 13,
      precision: 0,
      mode: "count",
      instrumentLabel: "返照计数环",
      signalLabels: {
        silent: "错位 · 仍有多份抵达被折叠",
        faint: "靠近 · 记录开始彼此分离",
        clear: "清晰 · 只差一份明日记录",
        locked: "已对齐 · 十三份记录完整",
      },
      ariaLabel: "十三次抵达计数刻度",
      decreaseLabel: "减少一份抵达记录",
      increaseLabel: "增加一份抵达记录",
      lockLabel: "核对抵达总数",
      unit: "份",
    },
  },
  {
    id: "noa-life-continuity",
    campaignId: CHIHAYA_NOA_CAMPAIGN_ID,
    order: 2,
    archiveLabel: "REFLECTION 02 · CONTINUITY TEST",
    title: "没有被镜子收走的生活",
    subtitle: "纸结、镜片与住址簿分别保存路线、房间和日常债务。",
    requiredClueIds: ["paper-knot-route", "mirror-shard-memory", "unmade-address-book"],
    cipherLabel: "连续性三联",
    cipherTokens: ["ROUTE · 走过的路", "ROOM · 住过的房", "DEBT · 欠下的日常"],
    instruction: "三件证据都要求同一个动词：不是“被复制”，而是在主城删除之后仍然怎样。",
    prompt: "未成线中的十二位诺亚保留了什么？",
    answerAliases: ["LIVES", "LIFE", "生活", "人生", "完整生活"],
    hints: ["纸结证明她们走过路，住址簿证明她们持续居住。", "答案不是“倒影”，而是每个人在未成线继续拥有的生活。"],
    revealTitle: "LIVES · 生活",
    revealText: "路线、房间与债务组成了连续人生。未成线保存的是十二位住户，不是等待当前诺亚调用的记忆资源。",
  },
  {
    id: "noa-observer-switch",
    campaignId: CHIHAYA_NOA_CAMPAIGN_ID,
    order: 3,
    archiveLabel: "REFLECTION 03 · ERASURE SWITCH",
    title: "谁按下了排除开关",
    subtitle: "镜面没有留下选择记录，裁决席却保存了每一次签字后的线路坍缩。",
    requiredClueIds: ["observer-chair-log", "zero-key-casting", "thirteen-signed-tickets"],
    cipherLabel: "仪式因果顺序",
    cipherTokens: ["十三人签名", "→", "裁决者指定唯一原本", "→", "十二条线路坍缩"],
    instruction: "找到位于十三份生活与十二次抹除之间的行动者。镜子与钥匙都没有自动选择。",
    prompt: "终灯会真正需要谁来完成排除？",
    answerAliases: ["OBSERVER", "观察者", "裁决者", "外部观察者"],
    hints: ["零号钥匙能为十三份签名开门，没有真身优先级。", "每次线路坍缩都发生在观察者席签字之后。"],
    revealTitle: "OBSERVER · 观察者",
    revealText: "仪式把人的裁决伪装成自然规律。只要观察者拒绝宣布唯一原本，返照镜就没有排除任何人的开关。",
  },
].map((challenge) => cipherChallengeSchema.parse(challenge));

const fogWithoutWolvesCiphers = [
  {
    id: "fog-split-waveform",
    campaignId: FOG_WITHOUT_WOLVES_CAMPAIGN_ID,
    order: 1,
    archiveLabel: "ECHO 01 · DOUBLE CYLINDER",
    title: "同一秒钟的两段声纹",
    subtitle: "两只蜡筒都在缺失的一分钟前留下了相同背景波峰。",
    requiredClueIds: ["laplace-cylinder", "theresa-cylinder"],
    cipherLabel: "共振刻度",
    cipherTokens: ["23", "缺刻", "43", "kHz"],
    instruction: "把缺刻当作小数点，让两只蜡筒的背景波峰同时变得清晰。调谐不会判断哪一份证词更真。",
    prompt: "两段录音共享的共振刻度是多少？",
    answerAliases: ["23.43", "23.43kHz", "二十三点四三"],
    hints: ["停摆钟表保留了 23 与 43 两组数字。", "把缺刻放在两组数字之间：23.43 kHz。"],
    revealTitle: "23.43 kHz · 双重回声",
    revealText: "两只蜡筒在同一刻度同时清晰。调谐台没有真伪灯，因为声学证据只证明两段记忆共享同一个事件。",
    dial: {
      min: 23.35,
      max: 23.51,
      step: 0.01,
      initial: 23.37,
      target: 23.43,
      precision: 2,
      mode: "frequency",
      instrumentLabel: "回声调谐环",
      signalLabels: {
        silent: "静默 · 两只蜡筒都离开声场",
        faint: "微弱 · 一段哭声开始显形",
        clear: "清晰 · 两份背景波形正在重合",
        locked: "已对齐 · 两段记忆同样清楚",
      },
      ariaLabel: "双蜡筒回声调谐刻度",
      decreaseLabel: "共振降低零点零一千赫",
      increaseLabel: "共振升高零点零一千赫",
      lockLabel: "锁定双重声纹",
      unit: "kHz",
    },
  },
  {
    id: "fog-missing-minute",
    campaignId: FOG_WITHOUT_WOLVES_CAMPAIGN_ID,
    order: 2,
    archiveLabel: "ECHO 02 · MUNICIPAL GAP",
    title: "登记册失去的六十秒",
    subtitle: "停摆钟、怀表缺刻与市政订线共同绕开同一段时间。",
    requiredClueIds: ["stopped-clocks-2343", "missing-minute-register", "second-handwriting-log"],
    cipherLabel: "计时差值",
    cipherTokens: ["23:43:00", "→", "23:44:00"],
    instruction: "只计算两次合法校时之间被登记册跳过的时长。空白不是故障，而是被维护的入口。",
    prompt: "第三见证者通过多长的时间缺口进入分裂现实？",
    answerAliases: ["60", "60秒", "六十秒", "一分钟", "1分钟"],
    hints: ["从 23:43:00 到 23:44:00。", "相差正好六十秒，也就是一分钟。"],
    revealTitle: "60 SECONDS · 一分钟入口",
    revealText: "所有钟表都能越过缺口继续运行。被移走的六十秒并非时间停止，而是见证者被允许进入两段现实的制度门。",
  },
  {
    id: "fog-role-exchange",
    campaignId: FOG_WITHOUT_WOLVES_CAMPAIGN_ID,
    order: 3,
    archiveLabel: "ECHO 03 · FORBIDDEN EXCHANGE",
    title: "被协议禁止的交换",
    subtitle: "训练协议、手套磨痕与最终表格记录了同一条禁令。",
    requiredClueIds: ["hunter-pair-protocol", "mismatched-gloves", "final-witness-form"],
    cipherLabel: "角色因果",
    cipherTokens: ["聆听者定位", "命名者裁决", "第三人删去矛盾"],
    instruction: "找出能让固定分工失效的动作。答案不是谁更擅长，而是两名当事人可以怎样改变被训练的位置。",
    prompt: "什么会让暮钟失去固定两名相反证人的能力？",
    answerAliases: ["EXCHANGE", "SWAP", "交换", "角色交换", "交换角色"],
    hints: ["手套磨痕证明她们都练习过对方的位置。", "暮钟馆明令禁止的动作，就是交换聆听与命名。"],
    revealTitle: "EXCHANGE · 交换角色",
    revealText: "固定分工不是天性，而是仪式结构。只要拉普拉斯与特蕾莎交换聆听和命名，暮钟就无法再把她们锁成相反证人。",
  },
].map((challenge) => cipherChallengeSchema.parse(challenge));

const cipherRegistry: Record<string, CipherDeskDefinition> = {
  [LAST_TRAM_CAMPAIGN_ID]: cipherDeskSchema.parse({
    campaignId: LAST_TRAM_CAMPAIGN_ID,
    archiveLabel: "NIGHT CIPHER DESK · 夜班密文台",
    title: "城市把不能公开说的话，折进了票孔、花单和时刻表。",
    description: "证物归档后，密文会逐段显影。答错不会扣除任何东西，提示也不影响结果。",
    completionLabel: "ALL THREE CIPHERS FILED",
    completionTitle: "隐藏站台已经显影",
    completionText: "票孔、花单和时钟印章终于指向同一条被否认的路线。城市没有因此交出结论，但它再也无法声称站台不存在。",
    relay: {
      id: "last-tram-final-relay",
      archiveLabel: "FINAL RELAY · 最终接线",
      title: "把三份答案写成一封交接电报",
      description: "林渡只留了三个字段：WHEN、WHO、WHERE。按字段顺序把已经解开的碎片接入发报机。",
      instruction: "依次选择 WHEN（何时）、WHO（谁在维持联络）、WHERE（去哪里）。点已放入的碎片可以撤回。",
      fragments: [
        { id: "tram-hidden", label: "HIDDEN PLATFORM", note: "WHERE · 被档案刮掉的地点" },
        { id: "tram-time", label: "00:43", note: "WHEN · 倒置剪票孔的时刻" },
        { id: "tram-mina", label: "MINA", note: "WHO · 无名花单的保管人" },
      ],
      solutionIds: ["tram-time", "tram-mina", "tram-hidden"],
      hints: ["第一个字段是时刻，不是人名。", "完整顺序是 WHEN → WHO → WHERE。"],
    },
    challenges: lastTramCiphers,
  }),
  [RAIN_RADIO_CAMPAIGN_ID]: cipherDeskSchema.parse({
    campaignId: RAIN_RADIO_CAMPAIGN_ID,
    archiveLabel: "RAIN SIGNAL LAB · 雨中信号台",
    title: "雨把四十七户的证词，藏进频率、计费簿和摩尔斯尾音。",
    description: "每组信号都来自已经归档的证物。调错不会损坏频率，打开提示也不会让任何声音失去分量。",
    completionLabel: "ALL THREE SIGNALS RESTORED",
    completionTitle: "公共频率已经显影",
    completionText: "九十七点三兆赫、四十七户来电和中继尾音已经互相作证：这不是无人广播，而是一座街区共同维护的声音出口。",
    relay: {
      id: "rain-radio-final-relay",
      archiveLabel: "FINAL RELAY · 最终接线",
      title: "把三段信号接回公共频率",
      description: "中继箱要求按 SENDER、CHANNEL、MESSAGE 三个字段重新发报。每份解密答案只能使用一次。",
      instruction: "依次选择 SENDER（谁在发报）、CHANNEL（使用什么频率）、MESSAGE（要求归还什么）。点已放入的碎片可以撤回。",
      fragments: [
        { id: "radio-voice", label: "VOICE", note: "MESSAGE · 摩尔斯尾音的请求" },
        { id: "radio-frequency", label: "97.3 MHz", note: "CHANNEL · 雨水锁定的频率" },
        { id: "radio-residents", label: "47 HOUSEHOLDS", note: "SENDER · 沉默线路的居民" },
      ],
      solutionIds: ["radio-residents", "radio-frequency", "radio-voice"],
      hints: ["发报格式先写发送者，再写频道。", "完整顺序是 SENDER → CHANNEL → MESSAGE。"],
    },
    challenges: rainRadioCiphers,
  }),
  [THIRTEENTH_LOAF_CAMPAIGN_ID]: cipherDeskSchema.parse({
    campaignId: THIRTEENTH_LOAF_CAMPAIGN_ID,
    archiveLabel: "COMMUNAL OVEN NOTES · 公共炉旁注",
    title: "城市把所有权、火灾方向与共同劳动，藏进每日烘焙的算式里。",
    description: "三组旁注只重排已经归档的事实。答错不会消耗物证，打开提示也不会影响关系或结局资格。",
    completionLabel: "ALL THREE OVEN NOTES FILED",
    completionTitle: "第十三份已经显影",
    completionText: "十三只面包、市政热力主管和共同保管已经互相作证：这里没有失踪成员或秘密店主，只有一项被持续履行的公共份额。",
    relay: {
      id: "thirteenth-loaf-final-relay",
      archiveLabel: "FINAL CHARTER · 最终章程",
      title: "把三份答案写回修复后的合作社章程",
      description: "何砾留下三个字段：CAUSE、OWNERS、RIGHT。每份解密答案只能使用一次。",
      instruction: "依次选择 CAUSE（谁承担火灾责任）、OWNERS（房契归还给谁）、RIGHT（哪项权利继续无主）。点已放入的碎片可以撤回。",
      fragments: [
        { id: "loaf-right", label: "GUEST SHARE", note: "RIGHT · 任何需要者都可使用的访客份额" },
        { id: "loaf-cause", label: "MUNICIPAL HEAT MAIN", note: "CAUSE · 炉桥下超压的公共设施" },
        { id: "loaf-owners", label: "12 MEMBERS", note: "OWNERS · 名册、围裙与持份环对应的人" },
      ],
      solutionIds: ["loaf-cause", "loaf-owners", "loaf-right"],
      hints: ["先写造成火灾的设施，再写恢复所有权的人。", "完整顺序是 CAUSE → OWNERS → RIGHT。"],
    },
    challenges: thirteenthLoafCiphers,
  }),
  [CHIHAYA_NOA_CAMPAIGN_ID]: cipherDeskSchema.parse({
    campaignId: CHIHAYA_NOA_CAMPAIGN_ID,
    archiveLabel: "RETURNING MIRROR TABLE · 返照镜台",
    title: "把抵达、生活与裁决重新分开，镜子才不能替人制造唯一原本。",
    description: "每段返照都来自已经归档的证物。对齐错误不会抹去记录，打开提示也不会让任何版本失去存在资格。",
    completionLabel: "ALL THREE REFLECTIONS FILED",
    completionTitle: "十三段人生已经分别显影",
    completionText: "十三次抵达、十二段未成线生活与观察者开关已经互相作证：这里没有可由仪器辨认的唯一原本，只有被裁决强行折叠的人。",
    relay: {
      id: "chihaya-noa-final-relay",
      archiveLabel: "FINAL ALIGNMENT · 最终返照",
      title: "把三份结论写回零号门的开启顺序",
      description: "零号门要求按 ARRIVALS、LIVES、RIGHT 三个字段归档。每份答案只能使用一次。",
      instruction: "依次选择 ARRIVALS（发生了多少次抵达）、LIVES（这些记录属于什么）、RIGHT（最后应归还什么）。点已放入的碎片可以撤回。",
      fragments: [
        { id: "noa-right", label: "RIGHT TO CHOOSE", note: "RIGHT · 名字、出口与沉默的选择权" },
        { id: "noa-arrivals", label: "13 ARRIVALS", note: "ARRIVALS · 十二枚印章与一张明日票" },
        { id: "noa-lives", label: "13 LIVES", note: "LIVES · 各自连续生活过的人" },
      ],
      solutionIds: ["noa-arrivals", "noa-lives", "noa-right"],
      hints: ["先写发生了多少次抵达，再写这些记录属于什么。", "完整顺序是 ARRIVALS → LIVES → RIGHT。"],
    },
    challenges: chihayaNoaCiphers,
  }),
  [FOG_WITHOUT_WOLVES_CAMPAIGN_ID]: cipherDeskSchema.parse({
    campaignId: FOG_WITHOUT_WOLVES_CAMPAIGN_ID,
    archiveLabel: "ECHO TUNING TABLE · 回声调谐台",
    title: "让两段回声分别清晰，而不是把旋钮误当成真伪裁判。",
    description: "三组调谐只重排已经归档的声学与制度证据。错位不会损坏蜡筒，打开提示也不会影响人物关系、线索或结局资格。",
    completionLabel: "ALL THREE ECHOES FILED",
    completionTitle: "两段真实已经分别显影",
    completionText: "双重声纹、缺失一分钟与角色交换互相作证：暮钟无法自动选择真相，只能借第三见证者和固定分工删除其中一个人。",
    relay: {
      id: "fog-without-wolves-final-relay",
      archiveLabel: "FINAL RESONANCE · 最终回声",
      title: "把三份结论写回未签报告",
      description: "空白报告只保留 EVENT、TRIGGER、EXIT 三个字段。每份答案只能使用一次。",
      instruction: "依次选择 EVENT（发生了什么）、TRIGGER（谁让删除开始）、EXIT（如何关闭入口）。点已放入的碎片可以撤回。",
      fragments: [
        { id: "fog-exit", label: "EXCHANGE ROLES", note: "EXIT · 交换聆听与命名" },
        { id: "fog-event", label: "TWO TRUE MEMORIES", note: "EVENT · 一声钟分裂出的事实" },
        { id: "fog-trigger", label: "THIRD WITNESS", note: "TRIGGER · 提交唯一报告的人" },
      ],
      solutionIds: ["fog-event", "fog-trigger", "fog-exit"],
      hints: ["先写暮钟制造了什么，再写谁让删除生效。", "完整顺序是 EVENT → TRIGGER → EXIT。"],
    },
    challenges: fogWithoutWolvesCiphers,
  }),
};

export function getCampaignCipherDesk(campaignId: string): CipherDeskDefinition | undefined {
  return cipherRegistry[campaignId];
}

export function getCampaignCipherChallenges(campaignId: string): readonly CipherChallenge[] {
  return getCampaignCipherDesk(campaignId)?.challenges ?? [];
}

export function getCampaignCipherChallenge(campaignId: string, challengeId: string): CipherChallenge | undefined {
  return getCampaignCipherChallenges(campaignId).find((challenge) => challenge.id === challengeId);
}

export function getCampaignCipherRelay(campaignId: string, relayId: string): CipherRelay | undefined {
  const relay = getCampaignCipherDesk(campaignId)?.relay;
  return relay?.id === relayId ? relay : undefined;
}

export function getCampaignCipherProgressIds(campaignId: string): string[] {
  const desk = getCampaignCipherDesk(campaignId);
  return desk ? [...desk.challenges.map((challenge) => challenge.id), desk.relay.id] : [];
}

export function isCipherUnlocked(challenge: CipherChallenge, unlockedClueIds: readonly string[]): boolean {
  return challenge.requiredClueIds.every((clueId) => unlockedClueIds.includes(clueId));
}

export function matchesCipherAnswer(challenge: CipherChallenge, answer: string): boolean {
  const normalized = normalizeCipherAnswer(answer);
  return Boolean(normalized) && challenge.answerAliases.some((alias) => normalizeCipherAnswer(alias) === normalized);
}

export function isCipherRelayUnlocked(campaignId: string, solvedCipherIds: readonly string[]): boolean {
  const challenges = getCampaignCipherChallenges(campaignId);
  return Boolean(challenges.length) && challenges.every((challenge) => solvedCipherIds.includes(challenge.id));
}

export function matchesCipherRelay(relay: CipherRelay, fragmentIds: readonly string[]): boolean {
  return fragmentIds.length === relay.solutionIds.length && relay.solutionIds.every((fragmentId, index) => fragmentIds[index] === fragmentId);
}

export function alignCipherDialValue(dial: CipherDial, value: number): number {
  const clamped = Math.min(dial.max, Math.max(dial.min, value));
  const steps = Math.round((clamped - dial.min) / dial.step);
  return Number(Math.min(dial.max, dial.min + steps * dial.step).toFixed(dial.precision));
}

export function stepCipherDialValue(dial: CipherDial, value: number, direction: -1 | 1): number {
  return alignCipherDialValue(dial, value + direction * dial.step);
}

export function formatCipherDialValue(dial: CipherDial, value: number): string {
  const aligned = alignCipherDialValue(dial, value);
  if (dial.mode === "minutes") return `00:${String(Math.round(aligned)).padStart(2, "0")}`;
  return `${aligned.toFixed(dial.precision)}${dial.unit ? ` ${dial.unit}` : ""}`;
}

export function cipherDialAnswer(dial: CipherDial, value: number): string {
  return formatCipherDialValue(dial, value);
}

export function getCipherDialSignal(dial: CipherDial, value: number): "silent" | "faint" | "clear" | "locked" {
  const distanceInSteps = Math.round(Math.abs(alignCipherDialValue(dial, value) - dial.target) / dial.step);
  if (distanceInSteps === 0) return "locked";
  if (distanceInSteps <= 1) return "clear";
  if (distanceInSteps <= 3) return "faint";
  return "silent";
}

export function normalizeCipherAnswer(value: string): string {
  return value.normalize("NFKC").trim().toUpperCase().replace(/[\s:：·.。,_，\-—/\\]+/g, "");
}
