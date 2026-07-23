import { z } from "zod";
import { LAST_TRAM_CAMPAIGN_ID } from "./campaigns/last-tram";
import { RAIN_RADIO_CAMPAIGN_ID } from "./campaigns/rain-radio";

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
});

export type CipherChallenge = z.infer<typeof cipherChallengeSchema>;

const cipherDeskSchema = z.object({
  campaignId: z.string().min(1),
  archiveLabel: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  completionLabel: z.string().min(1),
  completionTitle: z.string().min(1),
  completionText: z.string().min(1),
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

const cipherRegistry: Record<string, CipherDeskDefinition> = {
  [LAST_TRAM_CAMPAIGN_ID]: cipherDeskSchema.parse({
    campaignId: LAST_TRAM_CAMPAIGN_ID,
    archiveLabel: "NIGHT CIPHER DESK · 夜班密文台",
    title: "城市把不能公开说的话，折进了票孔、花单和时刻表。",
    description: "证物归档后，密文会逐段显影。答错不会扣除任何东西，提示也不影响结果。",
    completionLabel: "ALL THREE CIPHERS FILED",
    completionTitle: "隐藏站台已经显影",
    completionText: "票孔、花单和时钟印章终于指向同一条被否认的路线。城市没有因此交出结论，但它再也无法声称站台不存在。",
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
    challenges: rainRadioCiphers,
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

export function isCipherUnlocked(challenge: CipherChallenge, unlockedClueIds: readonly string[]): boolean {
  return challenge.requiredClueIds.every((clueId) => unlockedClueIds.includes(clueId));
}

export function matchesCipherAnswer(challenge: CipherChallenge, answer: string): boolean {
  const normalized = normalizeCipherAnswer(answer);
  return Boolean(normalized) && challenge.answerAliases.some((alias) => normalizeCipherAnswer(alias) === normalized);
}

export function normalizeCipherAnswer(value: string): string {
  return value.normalize("NFKC").trim().toUpperCase().replace(/[\s:：·.。,_，\-—/\\]+/g, "");
}
