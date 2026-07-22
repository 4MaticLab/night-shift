import {
  correspondencePromptSchema,
  correspondenceRecordSchema,
  type CorrespondencePrompt,
  type CorrespondenceRecord,
  type CorrespondenceReply,
  type CorrespondenceStance,
  type SocietyId,
  type SocietyMemoryRecord,
} from "@/src/lib/game-engine/schema";

export const correspondencePrompts: CorrespondencePrompt[] = [
  {
    id: "registry-noticed",
    societyId: "misfiled-registry",
    standing: "noticed",
    context: "登记处寄来一页错误记录：地址栏的错字恰好让一位证人从公开索引里消失。审计明早开始。",
    question: "该纠正这处错字，还是承认一处善意的错误也可能拥有合法寿命？",
    replies: [
      { id: "registry-noticed-shelter", label: "让错字继续保护地址", note: "保住证人的藏身处，也保留制度对公众的一次谎。", stance: "shelter", summary: "你选择让空白先保护活人。", echo: "登记处仍保留那处错字，并在页边注明：你把活人的安全放在整洁之前。" },
      { id: "registry-noticed-witness", label: "更正规则，不补全地址", note: "公开制度如何隐藏人，但拒绝把证人重新暴露。", stance: "witness", summary: "你让机制接受审问，仍把姓名留白。", echo: "审计报告承认了隐藏机制，地址栏仍空着；登记处称这是一份懂得闭嘴的证词。" },
    ],
  },
  {
    id: "registry-known",
    societyId: "misfiled-registry",
    standing: "known",
    context: "一名登记员需要提交一份‘从未发生过的调阅申请’，否则一只保护证据的抽屉会在午后被封死。",
    question: "愿意把自己的名字借给一份不存在的申请吗？",
    replies: [
      { id: "registry-known-witness", label: "把名字写在最显眼处", note: "让责任有一位可以被询问的人，也让你进入机构视线。", stance: "witness", summary: "你愿意让责任找到一个可供敲门的地址。", echo: "那份不存在的申请如今有了你的署名；登记处说，责任终于不必继续冒充天气。" },
      { id: "registry-known-shelter", label: "只留下无署名的页边说明", note: "抽屉会被保住，但没有人能够独自拥有这次帮助。", stance: "shelter", summary: "你把行动留下，把名字拿走。", echo: "抽屉仍能打开，页边说明仍没有作者。登记处把这份克制归入‘多人共同保持的空白’。" },
    ],
  },
  {
    id: "registry-entrusted",
    societyId: "misfiled-registry",
    standing: "entrusted",
    context: "那枚无对应抽屉的索引签打开了一柜被删社区的原始名册。多数家庭想取回副本，仍有两位证人需要继续隐身。",
    question: "该由你逐户归还名册，还是把开锁方式交给仍在承担风险的人？",
    replies: [
      { id: "registry-entrusted-restore", label: "把副本按旧门牌逐户归还", note: "失主尽快拿回历史，但投递路线本身可能暴露仍在躲藏的人。", stance: "restore", summary: "你愿意承担归还的路程与留下的脚印。", echo: "第一批名册已回到旧门牌后面；登记处没有擦去你的脚印，只把它们登记为归还凭证。" },
      { id: "registry-entrusted-shelter", label: "把开锁方式交给证人", note: "归还会慢一些，但决定何时开柜的人仍是被记录者自己。", stance: "shelter", summary: "你把钥匙交还给仍需决定何时现身的人。", echo: "索引签已经离开登记处。柜门何时打开不再由档案员决定，他们对此表现出罕见而体面的不知情。" },
    ],
  },
  {
    id: "consulate-noticed",
    societyId: "mislaid-consulate",
    standing: "noticed",
    context: "一张停运线路的旧车票要求领事馆为它续办居留。它不肯说在等谁，只反复提起那座废弃闸机。",
    question: "替它保管到有人来问，还是把它送回早已没有列车的入口？",
    replies: [
      { id: "consulate-noticed-shelter", label: "替它保留一只干燥抽屉", note: "车票不会再受雨，却可能永远等不到主动来认领的人。", stance: "shelter", summary: "你为尚未决定归处的东西保留了时间。", echo: "那张车票仍住在干燥抽屉里。领事馆说，它第一次不必为了证明自己被遗失而继续淋雨。" },
      { id: "consulate-noticed-restore", label: "把它送回停用闸机", note: "入口也许已经忘记它，也许只有入口仍认得那道齿痕。", stance: "restore", summary: "你让物件回到最可能记得它的地方。", echo: "废弃闸机在看见车票时亮了一瞬。领事馆拒绝称之为团聚，只承认两件旧事彼此认出了伤口。" },
    ],
  },
  {
    id: "consulate-known",
    societyId: "mislaid-consulate",
    standing: "known",
    context: "一束夜香花同时声称寄花人与收花人都是它的主人。两边都没有留下地址，只有不同的等待方式。",
    question: "领事簿该写下两个名字，还是让花自己完成最后一段投递？",
    replies: [
      { id: "consulate-known-witness", label: "把两位等待者都写进领事簿", note: "承认一件东西可以同时保存两种归属，也让矛盾永久可见。", stance: "witness", summary: "你没有替矛盾裁掉其中一半。", echo: "领事簿第一次在同一栏写下两位等待者。那束花没有反对，只把香气平均留在两页之间。" },
      { id: "consulate-known-restore", label: "让花自己完成投递", note: "不替它定义所有权，但也放弃一份清楚、可追查的记录。", stance: "restore", summary: "你把最后一段路还给了被投递的东西。", echo: "花离开领事馆后没有回头。它选了哪扇门仍无人知道，但门槛上新落了一层花粉。" },
    ],
  },
  {
    id: "consulate-entrusted",
    societyId: "mislaid-consulate",
    standing: "entrusted",
    context: "一只无主皮箱装着被拆迁家庭的原始照片。博物馆愿意恒温保存并公开姓名，几户失主则愿意承担老照片继续褪色的风险。",
    question: "把原件交还各家，还是留在公共保存中但恢复所有失主姓名？",
    replies: [
      { id: "consulate-entrusted-restore", label: "按姓氏把原件逐箱归还", note: "记忆会回家，也会重新面对潮气、火灾和普通生活。", stance: "restore", summary: "你认为归还包含让失主重新承担风险的权利。", echo: "皮箱轻了许多。几张照片已经开始卷边；领事馆说，那是它们重新生活，而不是保存失败。" },
      { id: "consulate-entrusted-witness", label: "留下原件，公开每一位失主", note: "保存条件更稳妥，但家庭只能通过公共制度接近自己的记忆。", stance: "witness", summary: "你让公共保存接受姓名与来源的监督。", echo: "恒温库仍保管原件，墙上却不再写‘来源不详’。领事馆认为名字也是一种可以归还的实物。" },
    ],
  },
  {
    id: "cartographers-noticed",
    societyId: "afterlight-cartographers",
    standing: "noticed",
    context: "一条未登记近路穿过住户熟睡时的内院。它能避开巡查，也会把陌生人的脚步带到许多窗下。",
    question: "把近路留白，还是画进一张会被更多人看见的夜图？",
    replies: [
      { id: "cartographers-noticed-shelter", label: "让内院继续留在空白里", note: "住户保有安静，真正需要躲避巡查的人也少一条共享路线。", stance: "shelter", summary: "你认为不是每条可走的路都应该被公开。", echo: "那座内院仍是地图上的空白。测绘社补充说，空白有时不是无知，而是经过同意的安静。" },
      { id: "cartographers-noticed-witness", label: "画出路线，也标明它的作息", note: "道路成为公共证词，使用者同时要承担不惊醒住户的礼数。", stance: "witness", summary: "你选择记录道路，也记录道路欠下的礼貌。", echo: "夜图上出现了一条只在两点到四点之间成立的细线。测绘社称它为第一条会主动压低脚步的路线。" },
    ],
  },
  {
    id: "cartographers-known",
    societyId: "afterlight-cartographers",
    standing: "known",
    context: "一段隐藏货运线能帮助旧住户找回箱子，也会暴露当年用于撤离的避难入口。完整地图只需要再补一笔。",
    question: "公开整条线路，还是只把局部地图交给真正需要找回东西的人？",
    replies: [
      { id: "cartographers-known-witness", label: "公开完整线路与每处删改", note: "所有人都能审查机构的谎，仍在使用的避难口也会失去隐身。", stance: "witness", summary: "你选择让城市的删改留下完整口供。", echo: "完整线路已经进入公共地图，三处机构连夜换了门锁。测绘社说，真相公开后也需要有人继续值夜。" },
      { id: "cartographers-known-restore", label: "把局部地图交给各位失主", note: "归还可以发生，公众却暂时看不见整套运输制度。", stance: "restore", summary: "你先把路交给需要使用它的人，而非旁观它的人。", echo: "五张局部地图已经各自找到一户人家。它们拼在一起仍是完整路线，只是暂时没有同一张桌子。" },
    ],
  },
  {
    id: "cartographers-entrusted",
    societyId: "afterlight-cartographers",
    standing: "entrusted",
    context: "测绘社希望把你标成一枚永久路标。接受后，夜行者会依赖你守住坐标；拒绝则可以把测量方法拆给沿线居民。",
    question: "替他们守住这一枚坐标，还是让地图不再需要某一个人？",
    replies: [
      { id: "cartographers-entrusted-shelter", label: "先替所有人守一夜坐标", note: "今晚的路不会消失，但一座城市可能开始依赖你的持续在场。", stance: "shelter", summary: "你愿意暂时成为别人穿过黑暗时的固定点。", echo: "那一夜所有路线都准时经过你。天亮后，测绘社把坐标改成虚线：守望不该自动变成终身职务。" },
      { id: "cartographers-entrusted-restore", label: "把坐标交还沿线居民", note: "路线会由许多人共同维护，也会失去一个绝对一致的中心。", stance: "restore", summary: "你把测量能力还给真正住在地图里的人。", echo: "一枚永久路标变成了十二个略有误差的门牌。测绘社承认，那张地图因此比从前更接近一座城市。" },
    ],
  },
].map((prompt) => correspondencePromptSchema.parse(prompt));

export const correspondencePostures: Record<CorrespondenceStance, { title: string; note: string }> = {
  shelter: { title: "替空白守门的人", note: "你多次选择先保护仍在风险中的人和地方。雾灯城没有因此变得更整洁，却开始懂得空白也需要有人负责。" },
  restore: { title: "把选择交还的人", note: "你反复把物件、路线与决定交还给真正承受它们的人。城里少了几件保存完好的藏品，多了几扇重新有人开关的门。" },
  witness: { title: "让制度留下口供的人", note: "你要求机构、地图与公共档案承认自己做过什么。雾灯城仍会撒谎，但如今那些谎需要留下签名。" },
};

export function getCorrespondencePrompt(memory: SocietyMemoryRecord): CorrespondencePrompt {
  const prompt = correspondencePrompts.find((item) => item.societyId === memory.societyId && item.standing === memory.standing);
  if (!prompt) throw new Error(`Missing correspondence prompt: ${memory.societyId}/${memory.standing}`);
  return prompt;
}

export function getCorrespondenceReply(record: CorrespondenceRecord): CorrespondenceReply {
  const prompt = correspondencePrompts.find((item) => item.id === record.promptId);
  const reply = prompt?.replies.find((item) => item.id === record.replyId);
  if (!reply || prompt?.societyId !== record.societyId || prompt.standing !== record.standing) {
    throw new Error(`Invalid correspondence record: ${record.promptId}/${record.replyId}`);
  }
  return reply;
}

export function createCorrespondenceRecord(memory: SocietyMemoryRecord, replyId: string, repliedAt: string): CorrespondenceRecord {
  const prompt = getCorrespondencePrompt(memory);
  const reply = prompt.replies.find((item) => item.id === replyId);
  if (!reply) throw new Error(`Unknown reply ${replyId} for ${prompt.id}`);
  return correspondenceRecordSchema.parse({
    chapter: memory.chapter,
    promptId: prompt.id,
    societyId: memory.societyId,
    standing: memory.standing,
    replyId: reply.id,
    stance: reply.stance,
    repliedAt,
  });
}

export function getLatestSocietyReply(
  history: Partial<Record<number, CorrespondenceRecord>>,
  societyId: SocietyId,
  beforeChapter = Number.POSITIVE_INFINITY,
): CorrespondenceRecord | undefined {
  return Object.values(history)
    .filter((record): record is CorrespondenceRecord => Boolean(record) && record.societyId === societyId && record.chapter < beforeChapter)
    .sort((a, b) => b.chapter - a.chapter)[0];
}

export function getDominantCorrespondenceStance(history: Partial<Record<number, CorrespondenceRecord>>): CorrespondenceStance | null {
  const records = Object.values(history).filter((record): record is CorrespondenceRecord => Boolean(record)).sort((a, b) => a.chapter - b.chapter);
  if (!records.length) return null;
  const counts: Record<CorrespondenceStance, number> = { shelter: 0, restore: 0, witness: 0 };
  for (const record of records) counts[record.stance] += 1;
  return records.reduce((winner, record) => counts[record.stance] >= counts[winner] ? record.stance : winner, records[0].stance);
}
