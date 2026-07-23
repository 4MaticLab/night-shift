import { z } from "zod";
import { LAST_TRAM_CAMPAIGN_ID } from "./campaigns/last-tram";

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

const cipherRegistry: Record<string, readonly CipherChallenge[]> = {
  [LAST_TRAM_CAMPAIGN_ID]: lastTramCiphers,
};

export function getCampaignCipherChallenges(campaignId: string): readonly CipherChallenge[] {
  return cipherRegistry[campaignId] ?? [];
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
