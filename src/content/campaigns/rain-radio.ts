import {
  caseSchema,
  cityDistrictSchema,
  cityWatchEchoSchema,
  endingEpilogueSchema,
  evidenceSynthesisSchema,
  journeyPostcardSchema,
  nightBotanicalSchema,
  routeDirectionSchema,
  wakeEchoSchema,
  type CityWatchId,
  type EndingEpilogue,
  type JourneyPostcard,
  type NightBotanical,
  type RouteDirection,
} from "@/src/lib/game-engine/schema";
import { defineCampaign } from "./types";

export const RAIN_RADIO_CAMPAIGN_ID = "case-002";

const rainRadioCase = caseSchema.parse({
  id: RAIN_RADIO_CAMPAIGN_ID,
  title: "只在雨中播出的电台",
  englishTitle: "The Station That Broadcasts in Rain",
  chapters: [
    {
      number: 1,
      title: "无人频率",
      subtitle: "停播十二年的电台，在雨里读出了明天的天气。",
      cityAside: "雾灯城允许天气预报犯错，但不允许它提前知道拆迁名单。",
      question: "是谁重新打开了早已封存的九十七点三兆赫？",
      choices: [
        { id: "dial", label: "拆开仍有余温的旋钮", note: "先问机器昨夜听见了谁。" },
        { id: "roof", label: "沿屋顶天线追雨", note: "让积水标出广播来路。" },
        { id: "listener", label: "寻找唯一留下回信的人", note: "听众比节目表更记得声音。" },
      ],
      clueIds: ["radio-warm-dial", "rain-frequency", "tomorrow-bulletin"],
      collectibleIds: ["radio-dial", "rain-gauge"],
      route: ["夜班事务所", "旧广播塔", "积水天台", "封存播音室"],
      events: ["00:47 — 收音机自行越过静默频段。", "01:18 — 屋顶积水开始按播音节奏震动。", "02:26 — 封条背面出现新鲜指纹。", "03:40 — 一份明日简报被读出。", "05:03 — 信号在天亮前主动归零。"],
      journal: "旧广播塔停播十二年，旋钮却暖得像刚被人握过。九十七点三兆赫只在雨落到铁皮屋顶时出现，播音员先读天气，再读一条尚未公布的街区封闭通知。城市坚持这是串台；串台通常不会准确念出明天才盖章的日期。",
      contradiction: "一座没有电源的电台，为什么能读出尚未发布的明日简报？",
    },
    {
      number: 2,
      title: "比明天早一天的新闻",
      subtitle: "每份节目稿，都比市政公告早二十四小时。",
      cityAside: "新闻若来得太早，会被归类为不合时宜的谣言。",
      question: "播音员从哪里拿到尚未存在的公告？",
      choices: [
        { id: "press", label: "去印刷所等一张空白校样", note: "墨迹到来以前，压痕已经准备好。" },
        { id: "courier", label: "跟随没有地址的送稿人", note: "他每天替明天送一次信。" },
        { id: "archive", label: "查阅被提前注销的节目表", note: "消失的时段仍占着一行。" },
      ],
      clueIds: ["tomorrow-proof", "blue-pencil"],
      collectibleIds: ["proof-strip", "blue-pencil-item"],
      route: ["旧广播塔", "市政印刷所", "后门送稿槽", "节目档案间"],
      events: ["00:41 — 空白校样留下铅字压痕。", "01:20 — 送稿人从明日日期下签收。", "02:13 — 蓝铅笔删掉三个街区名称。", "03:37 — 电台读出相同删改。", "05:08 — 正式公告才进入印刷机。"],
      journal: "印刷所的空白校样已经留下字的凹痕，像明天先在纸背练习过一次。蓝铅笔删掉三个街区，雨中电台却逐字读出被删部分。播音员不是预知未来；有人把未来送到了她桌上，而且希望被听见。",
      contradiction: "被市政蓝笔删去的内容，为什么反而完整出现在广播中？",
    },
    {
      number: 3,
      title: "沉默的接线间",
      subtitle: "所有来电都没有声音，计费器却记录了完整通话。",
      cityAside: "电话局只为说出口的话计费，因此沉默尤其昂贵。",
      question: "那些没有声音的来电究竟交出了什么？",
      choices: [
        { id: "switchboard", label: "让接线孔重新配对", note: "断开的铜线仍记得彼此。" },
        { id: "tunnel", label: "沿防空管道听回声", note: "声音也会选择不走街面。" },
        { id: "ledger", label: "核对沉默的计费时长", note: "每一秒都对应一户尚未搬走的人。" },
      ],
      clueIds: ["mute-reel", "caller-list", "tunnel-echo"],
      collectibleIds: ["switchboard-plug", "voice-reel"],
      route: ["电话局旧楼", "沉默接线间", "河下防空管", "广播塔地下层"],
      events: ["00:45 — 第一只接线孔在断电后亮起。", "01:31 — 空白磁带显出呼吸波形。", "02:18 — 防空管道传来整条街的门牌。", "03:52 — 计费簿记录一百七十一次沉默。", "05:14 — 最后一通电话说出了名字。"],
      journal: "空白磁带并不空，波形里全是被压低的呼吸和门牌。旧防空管把居民证词绕过电话局送往电台；他们不敢在正常线路上说话，于是让沉默承担内容。计费簿上的每一分钟，都是一户人家尚未同意消失的时间。",
      contradiction: "如果来电始终沉默，接线间为什么能记录每户居民的门牌？",
    },
    {
      number: 4,
      title: "被蓝笔删掉的街区",
      subtitle: "地图先失去名字，推土机才获得地址。",
      cityAside: "从地图上消失的房子，不再具备被拆除的行政资格；现实对此并不配合。",
      question: "电台为何冒险播出整份未公开的街区名单？",
      choices: [
        { id: "map", label: "把删线叠回旧地图", note: "两张错误地图会组成一张证词。" },
        { id: "relay", label: "检查雨水中继箱", note: "每场雨都替居民续一次信号。" },
        { id: "keys", label: "寻找编号钥匙的门", note: "门被拆走以后，钥匙仍保存地址。" },
      ],
      clueIds: ["demolition-map", "relay-seal", "numbered-key"],
      collectibleIds: ["map-plate", "relay-seal-item"],
      route: ["旧城区边界", "雨水中继箱", "拆迁档案车", "广播塔备用机房"],
      events: ["00:43 — 旧地图与新地图在雨里重合。", "01:29 — 中继箱收到四十七户微弱回声。", "02:21 — 编号钥匙打开一扇已经被拆走的门。", "03:43 — 播音稿恢复全部街名。", "05:06 — 第一台推土机在错误地址前停下。"],
      journal: "市政地图先删去街名，拆迁档案再声称那里无人居住。雨水中继箱却保存四十七户人的声音，编号钥匙也仍能打开空气里原本属于门的位置。电台不是在预告灾难，而是在公告生效前替居民留下可被证明的存在。",
      contradiction: "如果这些街区早已无人居住，为什么中继箱仍收到四十七户人的回声？",
    },
    {
      number: 5,
      title: "把频率还给谁",
      subtitle: "黎明前，整座城的收音机等待同一个决定。",
      cityAside: "公共频率属于所有人，直到所有人真的开始说话。",
      question: "证词应当公开、封存，还是把播音权交回居民？",
      choices: [
        { id: "broadcast", label: "打开全城扩音器", note: "让每个删掉的街名同时归来。" },
        { id: "shelter", label: "先封存声音与名单", note: "真相可以等证人找到安全住处。" },
        { id: "handover", label: "把话筒交给居民", note: "不替任何人决定该说到哪里。" },
      ],
      clueIds: ["living-voice"],
      collectibleIds: ["relay-seal-item"],
      route: ["旧广播塔", "全城中继网", "黎明播音室", "九十七点三兆赫"],
      events: ["00:43 — 所有收音机同时亮起。", "01:17 — 四十七户居民依次确认姓名。", "02:49 — 市政线路试图切断雨声。", "03:43 — 播音员严洛走进控制室。", "05:00 — 她把仍开着的话筒推向众人。"],
      journal: "严洛没有失踪。她藏在旧防空网络里，把每一户即将从地图上消失的人录进雨声。今夜她可以把全部证词一次播完，也可以先保护仍住在那里的家庭；但她最希望的，是我们别替居民决定怎样使用自己的声音。话筒已经打开，选择不该只属于调查者。",
      contradiction: "严洛留下全部证据，却为什么拒绝替居民完成最后一次广播？",
    },
  ],
  clues: [
    ["radio-warm-dial", "仍有余温的旋钮", "停电十二年的调频旋钮刚被人使用", "旋钮内侧留下新鲜皮脂与雨水。", "广播管理处认为金属会自行保存热情。", "机器没有复活；有人仍在回来。", "object", 1],
    ["rain-frequency", "雨中的九十七点三", "信号只在雨水接通屋顶时出现", "铁皮屋顶与排水管组成了临时天线。", "气象局拒绝为雨水的播音行为负责。", "频率不是来自远方，而是来自整座城的屋檐。", "event", 1],
    ["tomorrow-bulletin", "明日简报", "广播读出尚未发布的封街通知", "纸面日期比录音晚整整一天。", "市政厅称提前出现的公告不具备事实资格。", "未来没有泄漏，只是有人提前拿到了印版。", "contradiction", 1],
    ["tomorrow-proof", "空白校样的压痕", "无字校样留下完整铅字凹痕", "压痕与次日公告逐字一致。", "印刷所认为空白纸不应承担文字责任。", "字还没落下，决定已经压过纸背。", "object", 2],
    ["blue-pencil", "蓝铅笔删线", "三处街名在公告前被统一删去", "删线与广播朗读的停顿位置相同。", "规划处称蓝色只代表内部审美。", "删掉名字，是为了让现实随后看起来像错误。", "event", 2],
    ["mute-reel", "沉默磁带", "空白磁带保存着四十七户呼吸波形", "每段呼吸前都有一声门牌敲击。", "电话局不承认呼吸构成通话内容。", "人们压低声音时，恐惧替他们留下了波形。", "object", 3],
    ["caller-list", "沉默来电簿", "计费记录对应被删街区的全部门牌", "一百七十一次来电均绕过普通交换机。", "计费处愿意退款，但拒绝承认来电存在。", "沉默也占用线路，也因此可以被追踪。", "event", 3],
    ["tunnel-echo", "防空管回声", "旧管网把居民证词送往广播塔", "声音沿雨水与铜管避开市政线路。", "防灾办称管道只传送空气。", "空气很擅长携带不被允许上街的东西。", "place", 3],
    ["demolition-map", "提前拆除的地图", "地图先删街名再下达拆迁令", "新旧版本的折痕证明删改早于公告。", "规划处认为地图有权先于城市改变。", "地图不是预言，它是行动顺序的口供。", "contradiction", 4],
    ["relay-seal", "雨水中继封条", "备用网络每场雨都自动续接", "封条编号属于早已注销的民防系统。", "管理处称注销设备不可能继续维护。", "封条很旧，胶水却每月被换一次。", "object", 4],
    ["numbered-key", "四十七把编号钥匙", "钥匙对应地图上消失的四十七户", "每把钥匙仍保留门框的细小木屑。", "拆迁办说没有门的钥匙不再拥有地址。", "房子被抹掉以后，钥匙替住户记住入口。", "object", 4],
    ["living-voice", "严洛的现场声音", "播音员仍活着并主动保存居民证词", "她要求把最终播音权交还给声音的主人。", "市政厅愿意承认录音，不愿承认说话者的决定权。", "她守住的不是电台，是别人决定何时开口的权利。", "person", 5],
  ].map(([id, title, summary, detail, cityObjection, marginNote, type, chapter], index, all) => ({
    id, title, summary, detail,
    cityObjection: `${String(cityObjection).replace(/。$/, "，")}并建议把记录归入天气造成的误差。`,
    marginNote, type, chapter,
    relatedIds: index ? [String(all[index - 1][0])] : [],
  })),
  collectibles: [
    ["radio-dial", "黄铜调频旋钮", "◉", "collectible.torn-ticket", "从停播控制台取下的沉重旋钮。", "内侧雨痕证明它仍在九十七点三兆赫之间往返。", "旧广播塔", "common", 1],
    ["rain-gauge", "屋顶雨量管", "⌇", "collectible.matchbox", "一截刻度模糊的玻璃管。", "刻度不是毫米，而是四十七户门牌的排列。", "旧广播塔", "unusual", 1],
    ["proof-strip", "明日校样纸条", "▤", "collectible.pressed-flower", "没有印字却布满压痕的校样。", "侧光下能读出次日才发布的整份公告。", "市政印刷所", "unusual", 2],
    ["blue-pencil-item", "市政蓝铅笔", "╱", "collectible.postcard", "一支削得过分整齐的蓝铅笔。", "笔芯混有旧城区墙灰，删线曾在现实里走过。", "市政印刷所", "rare", 2],
    ["switchboard-plug", "沉默接线插头", "⌁", "collectible.hotel-key", "电话局旧交换台的黄铜插头。", "铜芯仍按四十七户呼吸的节奏轻微发热。", "电话局旧楼", "unusual", 3],
    ["voice-reel", "空白证词卷", "◎", "collectible.driver-badge", "标签上只写着“天气”。", "低速播放时，雨声下面依次出现居民姓名。", "河下防空管", "rare", 3],
    ["map-plate", "删名地图版", "▧", "collectible.museum-token", "印刷旧城区地图的锌版。", "三处被磨平的街名下仍保留完整笔画。", "规划档案车", "rare", 4],
    ["relay-seal-item", "民防中继封条", "⊕", "collectible.ledger-clasp", "注销日期已经褪色的铜制封条。", "背面有严洛与四十七位居民轮流留下的指纹。", "广播塔备用机房", "rare", 4],
  ].map(([id, title, glyph, assetId, surfaceDescription, revealedDescription, district, rarity, chapter]) => ({
    id, title, glyph, assetId, surfaceDescription, revealedDescription, district, rarity, chapter,
  })),
});

const routeTemplates = [
  ["misfiled-registry", "market"],
  ["mislaid-consulate", "river"],
  ["afterlight-cartographers", "heights"],
] as const;

const rainRadioRoutes: RouteDirection[] = rainRadioCase.chapters.flatMap((chapter) =>
  chapter.choices.map((choice, index) => routeDirectionSchema.parse({
    id: `radio-night-${chapter.number}-${choice.id}`,
    chapter: chapter.number,
    choiceId: choice.id,
    dispatchTitle: choice.label,
    departureIntent: choice.note,
    destination: chapter.route[Math.min(index + 1, chapter.route.length - 1)],
    mapVariant: routeTemplates[index][1],
    routeNodes: [chapter.route[0], chapter.route[Math.min(index + 1, chapter.route.length - 1)], chapter.route[Math.min(index + 2, chapter.route.length - 1)], chapter.route.at(-1)!],
    events: chapter.events.map((event, eventIndex) => eventIndex === index ? `${event} 林渡沿“${choice.label}”留下旁注。` : event),
    cityEncounter: `${chapter.cityAside} 林渡选择“${choice.label}”以后，沿途的门牌与雨水各自提供了一份措辞不同、方向一致的证词。`,
    returnLetter: `我按“${choice.label}”走完这一夜。${chapter.journal}`,
    societyId: routeTemplates[index][0],
    societyNotice: `你用“${choice.label}”处理了第 ${chapter.number} 夜的广播异议，让一段被压低的声音获得可归档的来路。`,
  })),
);

const rainRadioSyntheses = [
  {
    id: "radio-future-proof",
    inputIds: ["tomorrow-bulletin", "tomorrow-proof"],
    title: "广播稿来自尚未公开的市政印版",
    explanation: "明日简报与空白校样上的铅字压痕完全一致，证明有人在公告发布前把内容送进电台。",
  },
  {
    id: "radio-resident-network",
    inputIds: ["caller-list", "tunnel-echo"],
    title: "居民通过旧防空网络向电台提交证词",
    explanation: "沉默来电簿的门牌与防空管回声逐户对应，所谓无人信号其实由整片街区共同维持。",
  },
  {
    id: "radio-erasure-order",
    inputIds: ["demolition-map", "numbered-key"],
    title: "街区先被从档案删除，随后才被现实拆除",
    explanation: "地图删名时间早于拆迁令，而四十七把钥匙仍保存原门框木屑，证明“无人居住”是事后制造的说法。",
  },
].map((item) => evidenceSynthesisSchema.parse(item));

const rainRadioEndings: EndingEpilogue[] = [
  {
    id: "public",
    archiveLabel: "CASE CLOSED · OPEN FREQUENCY",
    title: "全城广播",
    theme: "让每个被删掉的名字同时回来。",
    result: "九十七点三兆赫接入全城扩音网络，拆迁计划与完整居民证词在清晨公开。推土机停下，严洛和部分居民也被迫离开原来的藏身处。",
    detectiveLetter: "你让整座城在同一个清晨听见那些门牌。名字重新出现在地图以前，先出现在人们的收音机里。公开带来了暂停令，也带来了太多突然转向旧城区的目光。我无法替每一位居民判断这束光是否来得太亮；但至少从今天起，任何人想再把四十七户写成空地，都必须先解释他们为何能从雨里回答。",
    closingLine: "频率已经打开，城市不能再把所有声音归类为天气。",
  },
  {
    id: "protect",
    archiveLabel: "CASE CLOSED · VOICES SEALED",
    title: "封存证词",
    theme: "先让说话的人拥有安全的清晨。",
    result: "证词进入独立档案，拆迁程序因证据保全被暂缓；居民在名单公开前陆续获得临时住处。电台继续只在雨中播出无名天气。",
    detectiveLetter: "我们没有让四十七个名字在同一秒暴露。录音被三把不同的钥匙封存，足够让拆迁停下，也不足以替居民宣布立场。严洛说沉默不是同意，我想保护也不该被误写成永久沉默。等他们决定开口时，九十七点三仍会在那里；频率暂时变小，却没有被关掉。",
    closingLine: "有些声音被放低，是为了让说话的人先走到安全处。",
  },
  {
    id: "return",
    archiveLabel: "TRUE ENDING · AIRWAVES RETURNED",
    title: "把话筒交还居民",
    theme: "证词属于经历它的人。",
    result: "居民轮流决定公开姓名、只读门牌或保持沉默。严洛将控制台改成共同播音室，旧城区第一次拥有不经市政删改的公共频率。",
    detectiveLetter: "我们没有替任何人按下总播出键。话筒从一户传到下一户，有人念出全名，有人只敲三下桌面，也有人让雨声替自己占住那一分钟。调查终于不再是替他们证明存在，而是把决定如何存在的权利还回去。严洛把最后一只旋钮留给事务所；它没有固定频率，因为公共声音不该永远停在一个人的手上。",
    closingLine: "雨停以后，频率仍然亮着——这一次由它的主人轮流值班。",
  },
].map((item) => endingEpilogueSchema.parse(item));

const postcardTitles = ["雨水调频", "明日校样", "沉默接线间", "删名街区", "共同播音室"];
const rainRadioPostcards: JourneyPostcard[] = rainRadioCase.chapters.map((chapter, index) => journeyPostcardSchema.parse({
  id: `radio-postcard-${chapter.number}`,
  chapter: chapter.number,
  assetId: `postcard.night-0${chapter.number}`,
  title: postcardTitles[index],
  location: chapter.route.at(-1)!,
  cityRumor: chapter.cityAside,
  message: chapter.journal,
  preparationNotes: {
    "side-lamp": "侧照灯让雨滴背后的铜线逐一显形，信号因此有了可以画进报告的来路。",
    "flower-note": "花笺吸住一小段广播余音，天亮以后仍能听见某户人家轻轻报出门牌。",
    "tram-fare": "旧零钱投入控制台，没有换来节目，只替一位迟到的听众保留了一分钟。",
  },
}));

const botanicalNames = ["调频雨蕨", "校样月苔", "接线铜藤", "门牌风铃草", "共声灯花"];
const rainRadioBotanicals: NightBotanical[] = rainRadioCase.chapters.map((chapter, index) => nightBotanicalSchema.parse({
  id: `radio-botanical-${chapter.number}`,
  chapter: chapter.number,
  assetId: `botanical.night-0${chapter.number}`,
  name: botanicalNames[index],
  archiveName: `Planta radiophonica ${chapter.number}`,
  district: chapter.route.at(-1)!,
  cityRumor: `据说它只在有人认真听完第 ${chapter.number} 夜的雨声以后发芽；管理处认为倾听不属于灌溉。`,
  specimenNote: `叶脉像微型天线，保存着“${chapter.title}”归来时最后一段没有被剪掉的声音。`,
  growthStages: {
    seed: "种核贴着报告纸，像一只尚未调准的小旋钮。",
    sprout: "第一根铜色嫩芽朝最近的雨声弯去。",
    leaf: "叶片逐层展开，脉络组成一副安静的接线图。",
    bloom: "花芯亮起微弱琥珀光，把这一夜的声音完整归档。",
  },
  qualityNotes: {
    interrupted: "植株较小但已经完整开花；提前醒来没有删掉任何一段证词。",
    regular: "叶片与花芯稳定成形，保存一份清楚的标准标本。",
    restful: "最外层叶脉多接住一段远处回声，让标本留下更丰富的城市侧影。",
  },
}));

const watchIds: CityWatchId[] = ["lamplighting", "midnight", "last-watch", "daylight"];
const watchLabels = ["掌灯", "夜半", "末更", "白昼"];
const rainRadioWatchEchoes = rainRadioCase.chapters.flatMap((chapter) => watchIds.map((watchId, index) => cityWatchEchoSchema.parse({
  chapter: chapter.number,
  watchId,
  scene: `${watchLabels[index]}时分，${chapter.route.at(-1)}把“${chapter.title}”的最后一段信号压进雨水，窗灯依次回应。`,
  encounter: `一位没有登记姓名的听众在第 ${chapter.number} 夜留下门牌，又请林渡不要替对方决定播出音量。`,
  fieldNote: `${watchLabels[index]}改变了谁仍在收听，却没有改变证词本身；我只记录声音怎样抵达，不替它选择结论。`,
})));

const rainRadioWakeEchoes = rainRadioCase.chapters.map((chapter) => wakeEchoSchema.parse({
  id: `radio-sleep-gap-0${chapter.number}`,
  chapter: chapter.number,
  title: `${chapter.title}之间的一次回声`,
  sound: `你短暂醒来时，窗边收音机从“${chapter.title}”里漏出一声轻微的门牌敲击。`,
  glimpse: `林渡在雨里回头，看见第 ${chapter.number} 夜的信号沿屋檐换了一条不经过市政线路的路。`,
  fieldNote: "这次醒转没有结束夜班。城市只趁你翻身时，把一小段来不及剪掉的声音夹进报告。",
}));

const rainRadioDistricts = [
  {
    id: "radio-quarter",
    assetId: "district.lantern-wharf",
    name: "旧广播区",
    archiveName: "DISTRICT 01 · OLD BROADCAST QUARTER",
    subtitle: "停播以后，屋檐接管了节目表",
    introducedChapter: 1,
    publicVersion: "市政厅称旧广播塔仅保留为气象设施，不再具备播音能力。",
    cityRule: "雨落下时，所有未被送达的话会先来这里寻找频率。",
    landmarks: ["旧广播塔", "积水天台", "封存播音室"],
  },
  {
    id: "switchboard-ward",
    assetId: "district.old-meridian",
    name: "接线旧坊",
    archiveName: "DISTRICT 02 · SWITCHBOARD WARD",
    subtitle: "沉默也按分钟留下账单",
    introducedChapter: 3,
    publicVersion: "电话局称地下交换网络早已拆除，旧线路只承担通风。",
    cityRule: "说不出口的话会沿铜线绕远，直到找到一处愿意保持安静的接线孔。",
    landmarks: ["沉默接线间", "河下防空管", "计费档案室"],
  },
  {
    id: "erased-blocks",
    assetId: "district.glass-hill",
    name: "删名街区",
    archiveName: "DISTRICT 03 · ERASED BLOCKS",
    subtitle: "地图没有名字，门仍然需要钥匙",
    introducedChapter: 4,
    publicVersion: "规划处称此处已完成腾退，不再存在固定居民。",
    cityRule: "每一把保留下来的钥匙都能替一户人家把地址说回来。",
    landmarks: ["雨水中继箱", "规划档案车", "四十七户旧门框"],
  },
].map((item) => cityDistrictSchema.parse(item));

export const rainRadioCampaign = defineCampaign({
  id: RAIN_RADIO_CAMPAIGN_ID,
  version: 1,
  case: rainRadioCase,
  routes: rainRadioRoutes,
  syntheses: rainRadioSyntheses,
  endings: rainRadioEndings,
  postcards: rainRadioPostcards,
  botanicals: rainRadioBotanicals,
  watchEchoes: rainRadioWatchEchoes,
  wakeEchoes: rainRadioWakeEchoes,
  characters: [],
  districts: rainRadioDistricts,
  rules: {
    trueEndingId: "return",
    requiredClueCount: rainRadioCase.clues.length,
    requiredCollectibleCount: 7,
    requiredSynthesisCount: rainRadioSyntheses.length,
  },
  presentation: {
    archiveNumber: "002",
    teaser: "一座停播十二年的电台，只在下雨时读出明天的消息。",
    description: "沿雨水与旧电话线找回被地图删掉的四十七户声音。",
    cityName: "雾灯城",
    detectiveName: "林渡",
    heroAssetId: "header.night-shift.hero",
    nightAssetId: "header.night-expedition",
    morningAssetId: "header.morning-report",
    endingAssetId: "ending.hidden-platform",
    nightSealAssetIds: rainRadioCase.chapters.map((chapter) => `night-seal.0${chapter.number}`),
    endingQuestion: "最后一次广播，由谁按下开关？",
    endingPrompt: "严洛把完整证词留在控制台，却把话筒推回居民面前。公开、保护与归还，每一种都要承担自己的回声。",
    closingRefrain: "雨已经停了，仍有人在九十七点三兆赫上轮流守夜。",
    prologue: {
      scenes: [
        {
          stage: "incident",
          eyebrow: "雨夜 23:17 · 九十七点三兆赫",
          title: "停播十二年的电台重新报时",
          body: "第一场雨落下时，事务所那台没有接电的收音机亮了。一个女人读出明天的停电名单，又逐户念过四十七个早已从地图上消失的门牌。",
          aside: "广播最后重复三遍：请在天亮以前证明，我们不是杂音。",
          assetId: "header.night-shift.hero",
        },
        {
          stage: "evidence",
          eyebrow: "接案物证 · 仍有余温的旋钮",
          title: "有人把整片街区藏进雨里",
          body: "旋钮背面刻着废弃电台的呼号，铜轴仍是温的。旧电话线从封死的播音间伸向城市排水沟；只有雨水接通线路时，那四十七户人家才重新拥有声音。",
          aside: "你将整理频率、电话与住址。林渡会在雨里寻找广播真正的听众。",
          assetId: "district.lantern-wharf",
        },
        {
          stage: "handoff",
          eyebrow: "第一夜交接 · 林渡",
          title: "今晚从无人频率开始",
          body: "林渡把便携收音机调到九十七点三兆赫，红灯在静电里一明一灭。他要先找到发射源，再确认明日新闻究竟是预言，还是一群人留下的求生暗号。",
          aside: "“睡吧。只要雨还在下，我就不会让他们重新变成噪音。”",
          assetId: "header.night-expedition",
        },
      ],
      acceptLabel: "接下案件，进入事务所",
    },
  },
});
