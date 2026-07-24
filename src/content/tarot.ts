export type TarotOrientation = "upright" | "reversed";

export interface TarotText {
  zh: string;
  en: string;
}

export interface NightOmenCard {
  id: string;
  number: string;
  title: TarotText;
  archiveName: TarotText;
  assetSrc: string;
  assetAlt: TarotText;
  upright: TarotText;
  reversed: TarotText;
  prompt: TarotText;
}

export interface TarotDrawRecord {
  campaignId: string;
  dateKey: string;
  cardId: string;
  orientation: TarotOrientation;
  drawnAt: string;
}

export const nightOmenCards: NightOmenCard[] = [
  {
    id: "unclaimed-ticket",
    number: "00",
    title: { zh: "无主车票", en: "The Unclaimed Ticket" },
    archiveName: { zh: "启程而不预写终点", en: "A departure without a written destination" },
    assetSrc: "/art/collectibles/torn-ticket-v1.png",
    assetAlt: { zh: "被撕去终点的旧电车票", en: "An old tram ticket with its destination torn away" },
    upright: { zh: "一条没有被承认的路线仍在邀请你出发。先允许问题存在，不必急着替它填写终点。", en: "An unacknowledged route is still inviting departure. Let the question exist before assigning it a destination." },
    reversed: { zh: "你也许正把“尚未决定”误读成“已经错过”。停站不是拒绝，它只是要求再看一次票面。", en: "You may be reading ‘not yet decided’ as ‘already missed.’ A pause is not a refusal; inspect the ticket again." },
    prompt: { zh: "今天，哪一个没有答案的问题值得被保留下来？", en: "Which unanswered question deserves to remain open today?" },
  },
  {
    id: "night-detective",
    number: "I",
    title: { zh: "夜班侦探", en: "The Night Detective" },
    archiveName: { zh: "交接、行动与克制", en: "Handoff, action, and restraint" },
    assetSrc: "/art/characters/lin-du-handoff-portrait-v1.webp",
    assetAlt: { zh: "坐在交接桌前的夜班侦探林渡", en: "Night detective Lin Du seated at the handoff desk" },
    upright: { zh: "你已经拥有足够的工具。真正需要决定的，是今晚把注意力交给哪一件事。", en: "The tools are already at hand. What remains is deciding where tonight’s attention should go." },
    reversed: { zh: "行动并不等于把每件工具都带上。少拿一件，也许会让真正重要的东西显形。", en: "Action does not require carrying every tool. Leaving one behind may reveal what matters." },
    prompt: { zh: "如果只能留下一个调查方向，你会留下哪一个？", en: "If only one line of inquiry could remain, which would you keep?" },
  },
  {
    id: "keeper-of-letters",
    number: "II",
    title: { zh: "留信人", en: "The Keeper of Letters" },
    archiveName: { zh: "沉默并非空白", en: "Silence is not an empty page" },
    assetSrc: "/art/characters/mina-solair-portrait-v1.webp",
    assetAlt: { zh: "手持信封的花店老板米娜", en: "Mina the florist holding an envelope" },
    upright: { zh: "有些事实只有在不被逼问时才愿意靠近。今天适合听完一句话，再决定是否追问。", en: "Some truths approach only when not cornered. Hear the whole sentence before deciding whether to ask again." },
    reversed: { zh: "保护秘密和替秘密说谎并不是同一件事。你需要辨认沉默正在保护谁。", en: "Protecting a secret is not the same as lying for it. Notice whom the silence is protecting." },
    prompt: { zh: "你正在尊重沉默，还是替它补写答案？", en: "Are you respecting silence, or writing an answer on its behalf?" },
  },
  {
    id: "glass-hill",
    number: "III",
    title: { zh: "玻璃丘", en: "The Glass Hill" },
    archiveName: { zh: "透明制度下的旧轨", en: "Old rails beneath transparent institutions" },
    assetSrc: "/art/districts/glass-hill-v1.webp",
    assetAlt: { zh: "玻璃丘的温室、档案建筑与旧信号台", en: "Glass Hill greenhouses, archive buildings, and an old signal tower" },
    upright: { zh: "结构正在显露它如何保存、分类与遗忘。沿着重复出现的边界寻找，而不是只看最亮的玻璃。", en: "A structure is revealing how it preserves, classifies, and forgets. Follow recurring boundaries, not only the brightest glass." },
    reversed: { zh: "看似透明的规则可能只是把门藏得更好。试着寻找谁有权命名一只抽屉。", en: "A transparent rule may simply hide its door more elegantly. Ask who has the right to name the drawer." },
    prompt: { zh: "今天困住你的，是事实，还是事实所在的分类？", en: "What confines you today: the fact, or the category holding it?" },
  },
  {
    id: "misfiled-keeper",
    number: "IV",
    title: { zh: "错页保管人", en: "The Misfiled Keeper" },
    archiveName: { zh: "把重要之物放错地方", en: "Keeping something safe by filing it wrongly" },
    assetSrc: "/art/characters/orin-bell-portrait-v1.webp",
    assetAlt: { zh: "档案管理员奥林的编辑蚀刻肖像", en: "An editorial etched portrait of archivist Orin Bell" },
    upright: { zh: "秩序不总是正义，但谨慎的错放有时能替脆弱之物争取时间。先确认谁会承担公开的代价。", en: "Order is not always justice, though careful misfiling can buy time for something fragile. Ask who bears the cost of disclosure." },
    reversed: { zh: "临时保护可能已经变成长期占有。那只被锁住的抽屉需要一个重新审视的日期。", en: "Temporary protection may have become permanent possession. The locked drawer needs a date for reconsideration." },
    prompt: { zh: "哪一条旧规则仍在以保护之名拒绝归还？", en: "Which old rule still refuses return in the name of protection?" },
  },
  {
    id: "forty-third-bloom",
    number: "V",
    title: { zh: "四十三日花", en: "The Forty-Third Bloom" },
    archiveName: { zh: "等待留下可见的生长", en: "Waiting made visible as growth" },
    assetSrc: "/art/botany/night-02-forty-third-bloom-v1.webp",
    assetAlt: { zh: "带有旧邮戳形花蕊的四十三日花", en: "A forty-third-day bloom with a postmark-shaped center" },
    upright: { zh: "重复并不等于停滞。一个缓慢周期正在形成证据，今天不必催促花提前开放。", en: "Repetition is not stagnation. A slow cycle is becoming evidence; the flower need not open early." },
    reversed: { zh: "等待已经失去边界。给这段耐心设一个可以重新判断的时刻，而不是无限延期。", en: "Waiting has lost its boundary. Give patience a moment for reconsideration instead of an endless extension." },
    prompt: { zh: "什么值得继续等待，什么需要一个截止时刻？", en: "What deserves more waiting, and what needs a deadline?" },
  },
  {
    id: "erased-line",
    number: "VI",
    title: { zh: "被删路线", en: "The Erased Line" },
    archiveName: { zh: "脚步比地图更诚实", en: "Footsteps more honest than maps" },
    assetSrc: "/art/postcards/night-04-archive-glasshouse-v1.webp",
    assetAlt: { zh: "档案温室下延伸的铜绿旧轨", en: "Verdigris rails extending beneath the archive greenhouse" },
    upright: { zh: "已经走过的路不会因为图上没有墨而消失。相信可复核的痕迹，并让另一双脚也能走一遍。", en: "A travelled road does not vanish when ink leaves the map. Trust reproducible traces and let another pair of feet verify them." },
    reversed: { zh: "你可能正沿着熟悉的路线寻找一个已经移动的问题。回到第一个被忽略的转角。", en: "You may be following a familiar route toward a problem that has moved. Return to the first overlooked turn." },
    prompt: { zh: "如果地图不可信，你还可以复核什么？", en: "If the map cannot be trusted, what can still be verified?" },
  },
  {
    id: "index-moth",
    number: "VII",
    title: { zh: "索引蛾", en: "The Index Moth" },
    archiveName: { zh: "错误指向也能留下关系", en: "A wrong direction can still reveal a relation" },
    assetSrc: "/art/souvenirs/index-moth-wing-v1.webp",
    assetAlt: { zh: "会自行换页的错页蛾索引翅片", en: "The index wing of a moth that changes pages by itself" },
    upright: { zh: "一个错误索引正在暴露相邻事物之间的联系。不要只纠正页码，也记下它反复错向何处。", en: "A faulty index is exposing a relation between neighboring things. Correct the page, but record where it repeatedly points." },
    reversed: { zh: "信息太多，索引开始代替你思考。暂时合上目录，直接阅读一份原始证词。", en: "The index has begun thinking on your behalf. Close the catalogue and read one original testimony directly." },
    prompt: { zh: "今天哪一个错误，实际上正在指出模式？", en: "Which mistake is actually pointing toward a pattern today?" },
  },
  {
    id: "last-platform",
    number: "VIII",
    title: { zh: "末站灯", en: "The Last Platform" },
    archiveName: { zh: "真相抵达后的选择", en: "A choice after truth arrives" },
    assetSrc: "/art/endings/hidden-platform-tableau-v1.webp",
    assetAlt: { zh: "隐藏站台长椅上的账册与封蜡信", en: "A ledger and sealed letter on a hidden platform bench" },
    upright: { zh: "找到真相并不会替你决定它的去处。公开、保护与归还都需要说明由谁承担后果。", en: "Finding truth does not decide where it belongs. Disclosure, protection, and return each require naming who bears the consequence." },
    reversed: { zh: "你也许急着结束，因此把选择伪装成结论。让决定再经过一次当事人的视角。", en: "You may be disguising a choice as a conclusion because you want an ending. Pass the decision once more through the witness’s perspective." },
    prompt: { zh: "谁应该拥有决定真相去处的权利？", en: "Who should have the right to decide where truth goes?" },
  },
];

export function getTarotCard(cardId: string): NightOmenCard {
  const card = nightOmenCards.find((item) => item.id === cardId);
  if (!card) throw new Error(`Unknown night omen card: ${cardId}`);
  return card;
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTarotRecordKey(campaignId: string, dateKey: string): string {
  return `${campaignId}|${dateKey}`;
}

export function selectDailyTarot(campaignId: string, dateKey: string, localSeed: number, drawnAt: string): TarotDrawRecord {
  const cardIndex = stableHash(`${localSeed}|${campaignId}|${dateKey}|card`) % nightOmenCards.length;
  const orientation: TarotOrientation = stableHash(`${localSeed}|${campaignId}|${dateKey}|orientation`) % 2 === 0 ? "upright" : "reversed";
  return { campaignId, dateKey, cardId: nightOmenCards[cardIndex].id, orientation, drawnAt };
}

export function getLocalizedTarotText(text: TarotText, locale: string): string {
  return locale === "en" ? text.en : text.zh;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
