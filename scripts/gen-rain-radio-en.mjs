// Generates src/i18n/campaigns/rain-radio.en.ts with correct Unicode curly quotes.
// Run: node scripts/gen-rain-radio-en.mjs
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/i18n/campaigns/rain-radio.en.ts");
const L = "\u201c"; // left curly quote
const R = "\u201d"; // right curly quote

// Chapter data needed for composed strings
const chapters = [
  { n: 1, title: "无人频率", cityAside: "雾灯城允许天气预报犯错，但不允许它提前知道拆迁名单。",
    journal: "旧广播塔停播十二年，旋钮却暖得像刚被人握过。九十七点三兆赫只在雨落到铁皮屋顶时出现，播音员先读天气，再读一条尚未公布的街区封闭通知。城市坚持这是串台；串台通常不会准确念出明天才盖章的日期。",
    choices: [
      { id: "dial", label: "拆开仍有余温的旋钮", note: "先问机器昨夜听见了谁。" },
      { id: "roof", label: "沿屋顶天线追雨", note: "让积水标出广播来路。" },
      { id: "listener", label: "寻找唯一留下回信的人", note: "听众比节目表更记得声音。" },
    ],
    events: ["00:47 — 收音机自行越过静默频段。", "01:18 — 屋顶积水开始按播音节奏震动。", "02:26 — 封条背面出现新鲜指纹。", "03:40 — 一份明日简报被读出。", "05:03 — 信号在天亮前主动归零。"],
    lastRoute: "封存播音室" },
  { n: 2, title: "比明天早一天的新闻", cityAside: "新闻若来得太早，会被归类为不合时宜的谣言。",
    journal: "印刷所的空白校样已经留下字的凹痕，像明天先在纸背练习过一次。蓝铅笔删掉三个街区，雨中电台却逐字读出被删部分。播音员不是预知未来；有人把未来送到了她桌上，而且希望被听见。",
    choices: [
      { id: "press", label: "去印刷所等一张空白校样", note: "墨迹到来以前，压痕已经准备好。" },
      { id: "courier", label: "跟随没有地址的送稿人", note: "他每天替明天送一次信。" },
      { id: "archive", label: "查阅被提前注销的节目表", note: "消失的时段仍占着一行。" },
    ],
    events: ["00:41 — 空白校样留下铅字压痕。", "01:20 — 送稿人从明日日期下签收。", "02:13 — 蓝铅笔删掉三个街区名称。", "03:37 — 电台读出相同删改。", "05:08 — 正式公告才进入印刷机。"],
    lastRoute: "节目档案间" },
  { n: 3, title: "沉默的接线间", cityAside: "电话局只为说出口的话计费，因此沉默尤其昂贵。",
    journal: "空白磁带并不空，波形里全是被压低的呼吸和门牌。旧防空管把居民证词绕过电话局送往电台；他们不敢在正常线路上说话，于是让沉默承担内容。计费簿上的每一分钟，都是一户人家尚未同意消失的时间。",
    choices: [
      { id: "switchboard", label: "让接线孔重新配对", note: "断开的铜线仍记得彼此。" },
      { id: "tunnel", label: "沿防空管道听回声", note: "声音也会选择不走街面。" },
      { id: "ledger", label: "核对沉默的计费时长", note: "每一秒都对应一户尚未搬走的人。" },
    ],
    events: ["00:45 — 第一只接线孔在断电后亮起。", "01:31 — 空白磁带显出呼吸波形。", "02:18 — 防空管道传来整条街的门牌。", "03:52 — 计费簿记录一百七十一次沉默。", "05:14 — 最后一通电话说出了名字。"],
    lastRoute: "广播塔地下层" },
  { n: 4, title: "被蓝笔删掉的街区", cityAside: "从地图上消失的房子，不再具备被拆除的行政资格；现实对此并不配合。",
    journal: "市政地图先删去街名，拆迁档案再声称那里无人居住。雨水中继箱却保存四十七户人的声音，编号钥匙也仍能打开空气里原本属于门的位置。电台不是在预告灾难，而是在公告生效前替居民留下可被证明的存在。",
    choices: [
      { id: "map", label: "把删线叠回旧地图", note: "两张错误地图会组成一张证词。" },
      { id: "relay", label: "检查雨水中继箱", note: "每场雨都替居民续一次信号。" },
      { id: "keys", label: "寻找编号钥匙的门", note: "门被拆走以后，钥匙仍保存地址。" },
    ],
    events: ["00:43 — 旧地图与新地图在雨里重合。", "01:29 — 中继箱收到四十七户微弱回声。", "02:21 — 编号钥匙打开一扇已经被拆走的门。", "03:43 — 播音稿恢复全部街名。", "05:06 — 第一台推土机在错误地址前停下。"],
    lastRoute: "广播塔备用机房" },
  { n: 5, title: "把频率还给谁", cityAside: "公共频率属于所有人，直到所有人真的开始说话。",
    journal: "严洛没有失踪。她藏在旧防空网络里，把每一户即将从地图上消失的人录进雨声。今夜她可以把全部证词一次播完，也可以先保护仍住在那里的家庭；但她最希望的，是我们别替居民决定怎样使用自己的声音。话筒已经打开，选择不该只属于调查者。",
    choices: [
      { id: "broadcast", label: "打开全城扩音器", note: "让每个删掉的街名同时归来。" },
      { id: "shelter", label: "先封存声音与名单", note: "真相可以等证人找到安全住处。" },
      { id: "handover", label: "把话筒交给居民", note: "不替任何人决定该说到哪里。" },
    ],
    events: ["00:43 — 所有收音机同时亮起。", "01:17 — 四十七户居民依次确认姓名。", "02:49 — 市政线路试图切断雨声。", "03:43 — 播音员严洛走进控制室。", "05:00 — 她把仍开着的话筒推向众人。"],
    lastRoute: "九十七点三兆赫" },
];

// English translations for composed strings
const enChapters = [
  { title: "A Frequency with No One",
    journal: "The old broadcast tower has been off the air for twelve years, yet the dial is warm as though someone has just held it. 97.3 MHz surfaces only when rain strikes the iron rooftops. The announcer reads the weather first, then a street-closure notice not yet made public. The city insists it is cross-talk interference; cross-talk does not usually recite, word for word, a date that will not be stamped until tomorrow.",
    cityAside: "Foglight City permits weather forecasts to be wrong, but not to know the demolition list in advance.",
    choices: ["Open the dial while it is still warm", "Follow the rain along the rooftop aerial", "Find the one listener who wrote back"],
    events: ["00:47 — The radio crosses the silent band of its own accord.", "01:18 — The rooftop puddles begin to vibrate in time with the broadcast.", "02:26 — Fresh fingerprints appear on the back of the seal.", "03:40 — A bulletin dated tomorrow is read aloud.", "05:03 — The signal zeroes itself before dawn."],
    lastRoute: "The Sealed Studio" },
  { title: "News One Day Ahead of Tomorrow",
    journal: "The blank proof at the printing works already carries the indentations of type, as though tomorrow rehearsed itself on the back of the paper. A blue pencil strikes three streets, yet the station in the rain reads the deleted passages word for word. The announcer is not foreseeing the future; someone has delivered the future to her desk — and wants it heard.",
    cityAside: "News that arrives too early is classified as an ill-timed rumour.",
    choices: ["Wait at the printing works for a blank proof", "Follow the courier with no address", "Consult the programme schedule cancelled in advance"],
    events: ["00:41 — The blank proof bears the impression of type.", "01:20 — The courier signs for a delivery dated tomorrow.", "02:13 — A blue pencil strikes three street names.", "03:37 — The station reads aloud the same redaction.", "05:08 — Only now does the official notice reach the press."],
    lastRoute: "The Programme Archive" },
  { title: "The Silent Switchboard Room",
    journal: "The blank tape is not blank at all; its waveform is full of lowered breathing and house numbers. The old air-raid tunnels carry residents' testimony to the station, bypassing the exchange. They dare not speak on the ordinary lines, so silence carries the content for them. Every minute in the billing ledger is a minute during which a household has not yet agreed to disappear.",
    cityAside: "The telephone exchange charges only for spoken words; silence is therefore especially dear.",
    choices: ["Let the jack holes find their pairs again", "Listen for echoes along the air-raid tunnels", "Check the billed duration of the silence"],
    events: ["00:45 — The first jack hole lights up after the power is cut.", "01:31 — The blank tape reveals the waveform of breathing.", "02:18 — The air-raid tunnel carries every house number on the street.", "03:52 — The billing ledger records one hundred and seventy-one silences.", "05:14 — The last call speaks a name."],
    lastRoute: "The Broadcast Tower Basement" },
  { title: "The Streets the Blue Pencil Erased",
    journal: "The municipal map deletes the street names first; then the demolition file claims no one lives there. Yet the rainwater relay box preserves the voices of forty-seven households, and the numbered keys can still open the space in the air where a door once stood. The station is not foretelling disaster — it is recording, before the notice takes effect, a provable existence for the residents.",
    cityAside: "A house that vanishes from the map loses the administrative qualification to be demolished; reality does not cooperate.",
    choices: ["Lay the erasures back onto the old map", "Inspect the rainwater relay box", "Find the door that matches a numbered key"],
    events: ["00:43 — The old map and the new map align in the rain.", "01:29 — The relay box receives the faint echoes of forty-seven households.", "02:21 — A numbered key opens a door that has already been removed.", "03:43 — The broadcast script restores every street name.", "05:06 — The first bulldozer halts before the wrong address."],
    lastRoute: "The Broadcast Tower Backup Room" },
  { title: "To Whom the Frequency Is Returned",
    journal: "Yan Luo has not disappeared. She is hidden inside the old air-raid network, recording into the sound of rain every household about to vanish from the map. Tonight she could broadcast all the testimony at once, or first protect the families still living there; but what she hopes most is that we will not decide for the residents how to use their own voices. The microphone is open. The choice should not belong to the investigator alone.",
    cityAside: "A public frequency belongs to everyone — until everyone actually begins to speak.",
    choices: ["Switch on the city-wide loudspeakers", "Seal the voices and the list first", "Hand the microphone to the residents"],
    events: ["00:43 — Every radio in the city lights up at once.", "01:17 — Forty-seven households confirm their names in turn.", "02:49 — The municipal lines try to cut off the sound of rain.", "03:43 — The announcer, Yan Luo, walks into the control room.", "05:00 — She pushes the still-live microphone towards the crowd."],
    lastRoute: "97.3 MHz" },
];

const entries = new Map();
function add(zh, en) { entries.set(zh, en); }

// Build composed route strings
for (let ci = 0; ci < 5; ci++) {
  const ch = chapters[ci];
  const en = enChapters[ci];
  for (let chi = 0; chi < 3; chi++) {
    const label = ch.choices[chi].label;
    const enLabel = en.choices[chi];
    // Modified event (index === choice index)
    const zhEvent = `${ch.events[chi]} 林渡沿${L}${label}${R}留下旁注。`;
    const enEvent = `${en.events[chi]} Lin Du follows '${enLabel}' and leaves a marginal note.`;
    add(zhEvent, enEvent);
    // City encounter
    const zhEnc = `${ch.cityAside} 林渡选择${L}${label}${R}以后，沿途的门牌与雨水各自提供了一份措辞不同、方向一致的证词。`;
    const enEnc = `${en.cityAside} Once Lin Du chose '${enLabel}', the house numbers and the rain along the way each offered a testimony worded differently but pointing the same direction.`;
    add(zhEnc, enEnc);
    // Return letter
    const zhRet = `我按${L}${label}${R}走完这一夜。${ch.journal}`;
    const enRet = `I followed '${enLabel}' through the night. ${en.journal}`;
    add(zhRet, enRet);
    // Society notice
    const zhSoc = `你用${L}${label}${R}处理了第 ${ch.n} 夜的广播异议，让一段被压低的声音获得可归档的来路。`;
    const enSoc = `You addressed Night ${ch.n}'s broadcast objection by choosing '${enLabel}', giving a suppressed voice a path that can be filed.`;
    add(zhSoc, enSoc);
  }
  // Watch echoes for this chapter
  const watchLabels = ["掌灯", "夜半", "末更", "白昼"];
  const enWatchLabels = ["Lamplighting", "Midnight", "The last watch", "Daylight"];
  const enWatchMid = ["lamplighting", "midnight", "the last watch", "daylight"];
  for (let wi = 0; wi < 4; wi++) {
    const zhScene = `${watchLabels[wi]}时分，${ch.lastRoute}把${L}${ch.title}${R}的最后一段信号压进雨水，窗灯依次回应。`;
    const enScene = `At ${enWatchMid[wi]}, ${en.lastRoute} presses the last signal of '${en.title}' into the rain; window-lights answer one by one.`;
    add(zhScene, enScene);
    const zhEnc = `一位没有登记姓名的听众在第 ${ch.n} 夜留下门牌，又请林渡不要替对方决定播出音量。`;
    const enEnc2 = `A listener with no registered name left a house number on Night ${ch.n}, then asked Lin Du not to decide the broadcast volume for them.`;
    add(zhEnc, enEnc2);
    const zhField = `${watchLabels[wi]}改变了谁仍在收听，却没有改变证词本身；我只记录声音怎样抵达，不替它选择结论。`;
    const enField = `${enWatchLabels[wi]} changes who is still listening, but not the testimony itself; I record only how the sound arrives, never choosing its conclusion.`;
    add(zhField, enField);
  }
  // Wake echoes
  const zhWakeTitle = `${ch.title}之间的一次回声`;
  const enWakeTitle = `An Echo Between ${en.title}`;
  add(zhWakeTitle, enWakeTitle);
  const zhSound = `你短暂醒来时，窗边收音机从${L}${ch.title}${R}里漏出一声轻微的门牌敲击。`;
  const enSound = `When you wake briefly, the bedside radio lets slip a soft knock — a house number — from '${en.title}'.`;
  add(zhSound, enSound);
  const zhGlimpse = `林渡在雨里回头，看见第 ${ch.n} 夜的信号沿屋檐换了一条不经过市政线路的路。`;
  const enGlimpse = `Lin Du turns in the rain and sees the Night ${ch.n} signal take a new path along the eaves, bypassing the municipal lines.`;
  add(zhGlimpse, enGlimpse);
  // Botanical specimenNote
  const zhSpec = `叶脉像微型天线，保存着${L}${ch.title}${R}归来时最后一段没有被剪掉的声音。`;
  const enSpec = `The leaf veins resemble miniature aerials, preserving the last uncut sound from the return of '${en.title}'.`;
  add(zhSpec, enSpec);
  // Botanical cityRumor
  const zhRumor = `据说它只在有人认真听完第 ${ch.n} 夜的雨声以后发芽；管理处认为倾听不属于灌溉。`;
  const enRumor = `It is said to sprout only after someone has truly listened to the rain of Night ${ch.n}; the management office holds that listening does not count as watering.`;
  add(zhRumor, enRumor);
}
add("这次醒转没有结束夜班。城市只趁你翻身时，把一小段来不及剪掉的声音夹进报告。", "This waking has not ended the shift. The city merely slipped a brief uncut sound into the report while you turned over.");

// Collectible with curly quotes
add(`标签上只写着${L}天气${R}。`, "The label reads only 'Weather'.");

// Relation explanation with curly quotes
add(`地图删名时间早于拆迁令，而四十七把钥匙仍保存原门框木屑，证明${L}无人居住${R}是事后制造的说法。`, "The map deleted the names before the demolition order was issued, and forty-seven keys still preserve wood shavings from the original doorframes, proving that 'no one lives here' is a claim manufactured after the fact.");

// Now output the file: static entries + composed entries
// Static entries (no curly quotes in keys) — read from the static data file
import { staticEntries } from "./rain-radio-static.mjs";
for (const [k, v] of staticEntries) add(k, v);

// Write output
function esc(s) { return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
let out = `// English translation for case-002 《只在雨中播出的电台》.\n// British English; literary underground-city tone. See docs/translation-guide.md.\n// Proper nouns: 严洛 → Yan Luo · 九十七点三兆赫 → 97.3 MHz · 四十七户 → forty-seven households\nexport const rainRadioEnglish: Record<string, string> = {\n`;
for (const [zh, en] of entries) {
  out += `  "${esc(zh)}": "${esc(en)}",\n`;
}
out += `};\n`;
writeFileSync(OUT, out, "utf8");
console.log(`Written ${entries.size} entries to ${OUT}`);
