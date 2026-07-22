import { opportunityNoticeSchema, opportunityRecordSchema, type OpportunityNotice, type OpportunityRecord } from "@/src/lib/game-engine/schema";

export const opportunityNotices: OpportunityNotice[] = [
  {
    id: "missing-tuesday", category: "misfiled-registry", title: "申请失踪一个星期二", location: "灰窗办事处", sender: "一位把校历卷成望远镜的学生",
    hook: "上周二从他的课本里掉了出去。学校仍坚持那天布置过作业。",
    detail: "学生带来一本从星期一直接翻到星期三的课本。他只想请事务所证明：自己没有旷课，是那一天先旷了他。",
    responses: [
      { id: "missing-tuesday-certify", label: "替星期二开缺席证明", note: "把责任留给失踪的日期。", result: "林渡在证明上只盖了一个空圆。学校收下了，因为那正是星期二平时占的位置。", echo: "灰窗办事处后来新增一格“日期本人缺席”，目前已有三个星期二排队补办手续。" },
      { id: "missing-tuesday-return", label: "把作业寄给星期二", note: "让那一天也承担一点后果。", result: "作业被塞进日历装订线。当天夜里，所有答案都用前一天的墨水写完了。", echo: "那名学生寄来一张空白成绩单：失踪的星期二得了及格，但拒绝签名。" },
    ],
  },
  {
    id: "rent-paying-room", category: "misfiled-registry", title: "会自行缴租的空房", location: "盐钟街十二号", sender: "不愿承认自己有良心的房东",
    hook: "房客失踪六年，房租却每月从门缝下准时滑出。",
    detail: "硬币全是停用旧制，金额永远少一枚。房东想撬门，又担心会打扰里面持续六年的准时。",
    responses: [
      { id: "rent-room-receipt", label: "继续给空房开收据", note: "承认一种没有住户的租约。", result: "第一张收据推进门缝后，里面传来椅子礼貌挪开的声音。少的那枚硬币第二天补齐了。", echo: "房东开始给空房留楼道灯，并把这项开支登记为“长期在场证明”。" },
      { id: "rent-room-open", label: "请房东把门打开", note: "让准时接受一次查验。", result: "房里没有人，只有一只每月少走一格的钟。门打开后，它终于把那枚迟到六年的硬币吐了出来。", echo: "盐钟街的房租从此总会晚一分钟；房东说，这比没有原因地准时更像有人住。" },
    ],
  },
  {
    id: "misspelled-vow", category: "misfiled-registry", title: "拼错名字的婚约", location: "旧市政厅地下誊写室", sender: "两位不想被系统认出的新婚者",
    hook: "证书把两个人的姓都拼错了，他们因此获得一段很安静的婚姻。",
    detail: "登记处提出免费更正。两人却担心一旦名字正确，债主、亲戚和祝福会同时找到他们。",
    responses: [
      { id: "vow-preserve", label: "替错字申请长期居留", note: "让错误继续遮一会儿雨。", result: "错字获准在证书上居住七年。两位新婚者请它坐了主桌，位置在盐和胡椒之间。", echo: "那枚错字寄来婚后近况：它仍住在证书上，偶尔替两人拒收一封亲戚来信。" },
      { id: "vow-correct", label: "更正名字，隐去地址", note: "让身份回来，把去处留白。", result: "誊写员修正了姓名，却把地址栏折进纸背。证书终于认得他们，城市暂时仍找不到。", echo: "旧市政厅开始提供“姓名属实、去处自愿”的新表格，第一批很快用完。" },
    ],
  },
  {
    id: "separating-gloves", category: "mislaid-consulate", title: "一只手套要求分居", location: "失物领事馆候见室", sender: "一双共同生活太久的黑手套",
    hook: "左手套认为右手套总把它介绍成“另一只”。",
    detail: "它们没有主人，也没有争吵；只是左边那只想拥有一个不以右边为参照的抽屉。",
    responses: [
      { id: "gloves-separate", label: "替左手套安排单独抽屉", note: "把成双看作可以结束的关系。", result: "左手套搬进靠窗第三格。右手套没有阻拦，只在旧盒里第一次占满整张衬纸。", echo: "领事馆报告两只手套近来会隔着走廊互相点头，关系比成双时亲近。" },
      { id: "gloves-new-name", label: "替它们登记两个名字", note: "不拆开，但停止互相代称。", result: "它们分别选择“墨岑”和“晚扣”。领事馆叫过一次后，两只手套同时抬起了不存在的手。", echo: "墨岑与晚扣仍住同一只盒子，却开始分别收到冬季问候。" },
    ],
  },
  {
    id: "late-birthday-cake", category: "mislaid-consulate", title: "迟到七年的生日蛋糕", location: "河下无址投递处", sender: "一位已经不再过那个生日的人",
    hook: "蛋糕没有腐坏，只是每年少一根蜡烛，像在倒着等待。",
    detail: "收件人已找到，却拒绝签收：“那年的我不住这里了。”送件员请求事务所决定该把甜味交给谁。",
    responses: [
      { id: "cake-past", label: "为七年前留一把空椅子", note: "让错过的生日也到场。", result: "众人切下一块放在空椅前。蜡烛熄灭时，椅垫轻轻陷下去，像有人终于坐了片刻。", echo: "无址投递处开始替迟到的礼物准备空椅，不再要求现在的人冒领过去。" },
      { id: "cake-present", label: "把蛋糕分给今天路过的人", note: "让等待停止指定对象。", result: "每个路人只分到一口，却都想起一个从未庆祝过的小日子。最后一根蜡烛自己亮了。", echo: "收件人后来寄来一句话：她没有吃蛋糕，但那天第一次重新买了蜡烛。" },
    ],
  },
  {
    id: "unclaimed-shadow", category: "mislaid-consulate", title: "无人认领的影子", location: "灯港衣帽寄存处", sender: "一名每晚被影子跟错的寄存员",
    hook: "影子比任何客人都早到，却总在关门后独自留下。",
    detail: "它形状像戴帽的人，尺寸却每天不同。领事馆找不到主人，寄存员也不忍把它扫进街灯下。",
    responses: [
      { id: "shadow-job", label: "给影子一份夜班工作", note: "不必先属于谁，才能留下。", result: "影子被安排看守最后一排空钩。第一夜，它拦住了三件企图自行离开的外套。", echo: "灯港寄存处给影子发了第一枚工牌；照片栏是一块比纸更深的黑。" },
      { id: "shadow-search", label: "关灯让它自己找主人", note: "撤掉替它规定形状的光。", result: "灯灭后，影子没有离开。它缩成一小团，原来只是在寻找一处不用模仿任何人的暗处。", echo: "寄存员每天提早熄一盏灯，给那团影子留出不必长成人形的十分钟。" },
    ],
  },
  {
    id: "destination-stairs", category: "afterlight-cartographers", title: "请为一条楼梯测量去向", location: "玻璃丘背街", sender: "住在同一层却每天多爬一级的三户人家",
    hook: "楼梯有十二级，住户却分别数出十三、十四和一场小雨。",
    detail: "测绘社只肯测高度，不肯测“去向”。住户想知道每天多出来的那一级究竟把谁送到了别处。",
    responses: [
      { id: "stairs-follow", label: "沿多出的一级继续走", note: "把误差当作尚未完成的路线。", result: "第十五级通向楼后一个只能站一人的阳台。那里正好能看见三户人家从未见过的日落。", echo: "三户人家轮流使用那座小阳台，并一致同意不把第十五级写进租约。" },
      { id: "stairs-measure", label: "让每户保留自己的数字", note: "不替共同空间规定唯一长度。", result: "林渡在每一级侧面画了三道刻度。楼梯当晚安静下来，只在下雨时多出一声脚步。", echo: "测绘社收录了这条楼梯，图例写作“长度取决于谁正想回家”。" },
    ],
  },
  {
    id: "extra-dusk", category: "afterlight-cartographers", title: "钟楼后面多出的黄昏", location: "旧子午钟楼西墙", sender: "一个每天放学两次的报童",
    hook: "西墙后藏着第二次黄昏，进入的人会把同一天再结束一遍。",
    detail: "报童喜欢在那里补完没来得及做的告别，却担心城市会因此欠下太多夜晚。",
    responses: [
      { id: "dusk-keep", label: "把第二次黄昏留给迟到的人", note: "为没说完的话保留一点天色。", result: "林渡在墙角挂了一盏不点亮的灯，作为入口标记。黄昏同意每天只接待一位迟到者。", echo: "报童说第二次黄昏如今很守规矩，偶尔还会替来客把告别说慢一点。" },
      { id: "dusk-release", label: "让多出的黄昏流进夜里", note: "不把一天无限延长。", result: "西墙后的橙光被引进排水槽，沿街灯流了三个路口。那晚的黑暗因此来得很温和。", echo: "钟楼附近不再有第二次黄昏，但每逢有人迟到，夜色会替他慢半分钟。" },
    ],
  },
  {
    id: "eyes-closed-bridge", category: "afterlight-cartographers", title: "只在闭眼时出现的桥", location: "睡鹭河窄岸", sender: "两位隔河通信、却从未见面的修伞匠",
    hook: "他们闭眼能听见同一座桥，睁眼只看见河。",
    detail: "测绘社无法画一座不能观看的桥。两位修伞匠请求一名不会同时替两岸睁眼的见证人。",
    responses: [
      { id: "bridge-cross", label: "闭眼陪他们走到桥心", note: "用脚步而不是视线作证。", result: "三个人在桥心听见彼此停下。谁也没睁眼，只交换了两把修好的伞，然后各自走回原岸。", echo: "睡鹭河最近常有撑错伞的人；两位修伞匠坚持那是桥仍在工作的证据。" },
      { id: "bridge-bells", label: "在两岸挂两枚同声铃", note: "不必过河，也能确认对岸存在。", result: "一边的铃响，另一边会迟一口呼吸回答。桥没有显形，两岸却第一次拥有了同一个时刻。", echo: "测绘社把两枚铃之间的沉默登记成桥长，精确到一口呼吸。" },
    ],
  },
  {
    id: "umbrella-resignation", category: "citizen", title: "替一把雨伞写辞职信", location: "长雨巷修伞铺", sender: "一把连续工作四十一年的黑伞",
    hook: "它每逢下雨就自行撑开，如今想试试只在晴天散步。",
    detail: "伞骨仍很结实，主人也很体贴；问题只是双方都不知道物件该如何从用途里退休。",
    responses: [
      { id: "umbrella-retire", label: "批准它从雨天退休", note: "允许一件好用的东西不再有用。", result: "主人带它在晴日走了一圈。伞一路合着，第一次没有替任何人挡住天空。", echo: "长雨巷最近常见一把收拢的黑伞散步；下雨时，它会躲到屋檐下。" },
      { id: "umbrella-teach", label: "请它教新伞怎样听雨", note: "把经验留下，工作交出去。", result: "老伞只示范了一次如何在第一滴雨前醒来。新伞们学会后，它把伞柄靠在门边睡着了。", echo: "修伞铺给老伞留了一张小椅子；它现在只负责点评雨声，不负责淋湿。" },
    ],
  },
  {
    id: "unplayed-melody", category: "citizen", title: "不愿被演奏的街角旋律", location: "铜雀巷第七码头", sender: "一名总在最后四个音停下的小提琴手",
    hook: "旋律说一旦被完整听见，就会被人误以为它属于作曲者。",
    detail: "乐手只想把曲子还给街角。街角没有档案柜，也不会签收版权转让书。",
    responses: [
      { id: "melody-unfinished", label: "保留最后四个音的空白", note: "让未完成成为归还方式。", result: "乐手照旧停下。码头的缆绳、雨槽和一只空瓶分别补了三个音，第四个仍留给街角。", echo: "铜雀巷开始有人专程来听那四个没有响起的音，从不鼓掌。" },
      { id: "melody-city", label: "让整条街一起演完", note: "不给任何一个人独占署名。", result: "窗闩、车铃与鞋跟接过旋律。最后一个音由远处电车完成，谁也无法把整首曲子带走。", echo: "那位乐手不再带琴来，只在街角听。旋律每天换一种城市声线继续。" },
    ],
  },
  {
    id: "yesterday-bread", category: "citizen", title: "只卖昨日香气的面包店", location: "晨雾市场背面", sender: "一位每天凌晨才想起开门的面包师",
    hook: "面包总在关店后才烤好，第二天只剩香气，仍有人排队购买。",
    detail: "市场要求他出售“实体商品”。排队的人却说，他们来买的是昨天没能回家的那一刻。",
    responses: [
      { id: "bread-bottle", label: "把昨日香气装进纸袋", note: "承认气味也能被带走。", result: "每只空纸袋都称重不足，却让买家抱得很小心。市场秤决定假装没有看见。", echo: "晨雾市场新增“重量为零、请勿挤压”的摊位分类，空纸袋很快售罄。" },
      { id: "bread-today", label: "请面包师今天提前一小时", note: "让等待也有一次真正的早餐。", result: "第一炉面包赶上了清晨。队伍却仍各买一只空袋，再买一块热面包，两种都没有退货。", echo: "面包店如今同时出售今天的面包和昨天的香气；市场承认这是两种不同主食。" },
    ],
  },
].map((notice) => opportunityNoticeSchema.parse(notice));

export function getOpportunityNotice(id: string): OpportunityNotice {
  const notice = opportunityNotices.find((item) => item.id === id);
  if (!notice) throw new Error(`Unknown opportunity notice: ${id}`);
  return notice;
}

export function getOpportunityCandidates(chapter: number, journeySeed: number, history: Partial<Record<number, OpportunityRecord>>): [OpportunityNotice, OpportunityNotice, OpportunityNotice] {
  if (chapter < 2 || chapter > 5) throw new Error(`Opportunity day out of range: ${chapter}`);
  const seenIds = new Set(Object.values(history).flatMap((record) => record?.offeredIds ?? []));
  const candidates = opportunityNotices
    .filter((notice) => !seenIds.has(notice.id))
    .sort((a, b) => stableHash(`${journeySeed}|${chapter}|${a.id}`) - stableHash(`${journeySeed}|${chapter}|${b.id}`) || a.id.localeCompare(b.id))
    .slice(0, 3);
  if (candidates.length !== 3) throw new Error(`Expected three opportunity notices for day ${chapter}`);
  return candidates as [OpportunityNotice, OpportunityNotice, OpportunityNotice];
}

export function createOpportunityRecord(chapter: number, journeySeed: number, history: Partial<Record<number, OpportunityRecord>>, noticeId: string | undefined, responseId: string | undefined, resolvedAt: string): OpportunityRecord {
  const existing = history[chapter];
  if (existing) return existing;
  const candidates = getOpportunityCandidates(chapter, journeySeed, history);
  const offeredIds = candidates.map((notice) => notice.id) as [string, string, string];
  if (!noticeId) return opportunityRecordSchema.parse({ chapter, offeredIds, dismissed: true, resolvedAt });
  const notice = candidates.find((candidate) => candidate.id === noticeId);
  if (!notice) throw new Error(`Notice was not offered: ${noticeId}`);
  if (!notice.responses.some((response) => response.id === responseId)) throw new Error(`Unknown response for notice: ${responseId}`);
  return opportunityRecordSchema.parse({ chapter, offeredIds, noticeId, responseId, dismissed: false, resolvedAt });
}

export function getOpportunityResponse(record: OpportunityRecord) {
  if (!record.noticeId || !record.responseId) return null;
  return getOpportunityNotice(record.noticeId).responses.find((response) => response.id === record.responseId) ?? null;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
