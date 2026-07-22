import { nightShiftCase } from "@/src/content/case";
import { routeDirectionSchema, type RouteDirection } from "@/src/lib/game-engine/schema";

export const routeDirections: RouteDirection[] = [
  {
    id: "night-01-source", chapter: 1, choiceId: "source", dispatchTitle: "纸张的证词", departureIntent: "先去找制造这张票的人，而不是使用它的人。", destination: "灯港旧票据工坊", mapVariant: "market",
    routeNodes: ["夜班事务所", "旧票据工坊", "花粉库房", "封闭维修站"],
    events: ["00:52 — 林渡把车票夹进冷光板。", "01:24 — 旧票据工坊承认这批纸早已销毁。", "02:08 — 一只账柜对‘销毁’提出了霉斑方面的异议。", "03:43 — 新油墨在封闭维修站重新显色。", "05:11 — 纸张与日期分别提交了口供。"],
    cityEncounter: "工坊管理员坚持所有旧纸都已焚毁；他身后的账柜则用七年的霉味提出反对。雾灯城允许家具作证，只是不替它们支付出庭费。",
    returnLetter: "我先让纸张开口。它记得七年前的仓库，油墨只记得昨天。两位证人的年代相差太远，却被同一台出票机介绍认识。",
    societyId: "misfiled-registry", societyNotice: "你让一张作废票据反过来审问了出票制度。",
  },
  {
    id: "night-01-flower", chapter: 1, choiceId: "flower", dispatchTitle: "花粉认得归路", departureIntent: "把票背的花粉交还给仍会叫出它名字的人。", destination: "灯港夜间花市", mapVariant: "river",
    routeNodes: ["夜班事务所", "河桥花市", "灯港花店", "封闭维修站"],
    events: ["00:52 — 票背花粉被装进一只空火柴盒。", "01:18 — 河桥花市替一朵枯花补办了入城手续。", "02:07 — 米娜认出夜香花，却否认认出票。", "03:43 — 花粉在旧站台通风口变得更浓。", "05:11 — 一条被否认的路线留下了气味。"],
    cityEncounter: "夜间花市按香气收税。那粒花粉因没有携带地址被罚停留一刻钟，随后自行飘向灯港——比市政地图诚实得多。",
    returnLetter: "我跟着花粉走。它在花店门口犹豫，在维修站前却没有。植物很少替人保密；它们只是没有被市政厅列入合格证人。",
    societyId: "mislaid-consulate", societyNotice: "你把一粒离开原处七年的花粉当作仍在寻找归路的旅客。",
  },
  {
    id: "night-01-track", chapter: 1, choiceId: "track", dispatchTitle: "被否认的铁轨", departureIntent: "不问任何人，沿城市费力掩盖的坡度前进。", destination: "43号线封闭岔道", mapVariant: "heights",
    routeNodes: ["夜班事务所", "河下检修口", "无名岔道", "封闭维修站"],
    events: ["00:52 — 林渡在雨里找到第一颗新换的道钉。", "01:31 — 河下检修口拒绝承认自己是一扇门。", "02:19 — 一段铁轨在墙后继续回响。", "03:43 — 旧站台传来一声准时的电车铃。", "05:11 — 城市的坡度完成了证词。"],
    cityEncounter: "检修口挂着‘此处无路’的铜牌，门轴却刚上过油。雾灯城的否认通常写在最需要定期保养的东西上。",
    returnLetter: "我沿铁轨走。地图在河边结束，坡度和道钉没有。凌晨三点四十三分，一扇不存在的门准时替我开了一条缝。",
    societyId: "afterlight-cartographers", societyNotice: "你相信坡度胜过市政地图，并亲自走完了一条被删掉的线。",
  },
  {
    id: "night-02-mina", chapter: 2, choiceId: "mina", dispatchTitle: "第二版回答", departureIntent: "给米娜足够的沉默，让她不得不挑一种谎言留下。", destination: "灯港花店后室", mapVariant: "market",
    routeNodes: ["花店雨棚", "配花后室", "旧咖啡馆", "后巷邮槽"],
    events: ["00:43 — 花店最后一盏灯改口说自己仍亮着。", "01:26 — 米娜第一次否认认识伊芙琳。", "02:11 — 她第二次回答时漏掉了‘从未’。", "03:31 — 后室水槽里找到第四十三天的花单。", "05:02 — 一封无地址明信片被留在桌上。"],
    cityEncounter: "花店的镜子替米娜保存了第一版表情，却拒绝保存第二版。它解释说，重复的谎言属于批发业务。",
    returnLetter: "我没有逼她说真话，只请她把同一句谎再说一次。第二遍少了一个词，多看了一眼后门；有时口供的缺口比口供本身更准。",
    societyId: "misfiled-registry", societyNotice: "你把同一份口供归档两次，并认真阅读了两版之间的缺字。",
  },
  {
    id: "night-02-order", chapter: 2, choiceId: "order", dispatchTitle: "无主花束的收件人", departureIntent: "让花束自己决定谁有资格收下它。", destination: "河岸无名长椅", mapVariant: "river",
    routeNodes: ["花店雨棚", "河桥候车亭", "旧咖啡馆", "河岸长椅"],
    events: ["00:43 — 一束没有收件人的花被放在门外。", "01:26 — 花束乘上了一辆不收现金的夜车。", "02:15 — 旧咖啡馆替它保管了十一分钟。", "03:31 — 河岸长椅下出现一张无邮票卡片。", "05:02 — 送花人没有出现，约定却完成了。"],
    cityEncounter: "夜车售票员允许花束免票，理由是它看起来已经被谁等待了很多年。乘客对此没有异议；他们大多也没有地址。",
    returnLetter: "我没有拆花单，只跟在花后面。它经过三个不会承认认识收件人的人，最后停在一张每四十三天都会被擦干净的长椅旁。",
    societyId: "mislaid-consulate", societyNotice: "你允许一束无主花自己选择收件人，没有把沉默误写成无人认领。",
  },
  {
    id: "night-02-alley", chapter: 2, choiceId: "alley", dispatchTitle: "不属于邮局的邮路", departureIntent: "询问那只没有编号、却从不积灰的邮槽。", destination: "花店后巷邮槽", mapVariant: "heights",
    routeNodes: ["花店雨棚", "后巷邮槽", "墙内铜管", "河下分拣室"],
    events: ["00:43 — 后巷邮槽吞下一只空信封。", "01:39 — 墙内铜管传来两次收件回响。", "02:15 — 河下分拣室拒绝出示营业执照。", "03:31 — 七年前的明信片被归入‘尚未迟到’。", "05:02 — 邮槽吐出一粒新鲜夜香花籽。"],
    cityEncounter: "分拣室把没有地址的信归为‘尚未决定去处’，把有地址的信归为‘过度自信’。邮局若知道，大概会寄来一封措辞严厉但无法投递的投诉。",
    returnLetter: "我问了那只不属于邮局的信箱。它不回答，只把信送进墙里。铜管后有人敲了两下——在这座城，两下足够构成收件证明。",
    societyId: "afterlight-cartographers", societyNotice: "你沿墙内铜管重画了一条邮局从未批准、却仍在工作的路线。",
  },
  {
    id: "night-03-hotel", chapter: 3, choiceId: "hotel", dispatchTitle: "替空房办理退房", departureIntent: "把307当作仍在场的证人，清点它拒绝归还的东西。", destination: "无名旅馆 307", mapVariant: "market",
    routeNodes: ["旧子午钟楼", "无名旅馆", "307号房", "河桥窗台"],
    events: ["00:43 — 前台说307没有客人，因此不能退房。", "01:14 — 房门接受了七年前的钥匙。", "02:06 — 墙上四块浅色方框交代了照片去向。", "03:48 — 维修车从窗外河桥慢慢通过。", "05:17 — 前台补开了一张姓名空白的账单。"],
    cityEncounter: "旅馆要求空房本人签字退房。307保持沉默，于是手续自动续期一个月；制度在这里活得比客人长。",
    returnLetter: "我替307清点遗留物。房间积着灰，水池却有人擦过。窗外维修车经过时，墙上缺照片的四块浅痕一起亮了一瞬。",
    societyId: "misfiled-registry", societyNotice: "你替一间制度认定为空的房间补办退房，并接受沉默作为签名。",
  },
  {
    id: "night-03-gideon", chapter: 3, choiceId: "gideon", dispatchTitle: "请司机再忘一次", departureIntent: "不追问他记得什么，只记录他决定避开什么。", destination: "旧子午维修车库", mapVariant: "river",
    routeNodes: ["旧子午钟楼", "河桥修车棚", "维修车库", "司机夜食摊"],
    events: ["00:43 — 吉迪恩说那晚没有出车。", "01:27 — 他准确说出一辆不存在的车换过哪只轮胎。", "02:36 — 夜食摊老板端来七年前欠下的咖啡。", "03:48 — 吉迪恩避开了伊芙琳，却纠正了‘货物’。", "05:17 — 一枚旧员工徽章被推过桌面。"],
    cityEncounter: "夜食摊仍保留吉迪恩七年前的欠账，因为遗忘不属于可接受的付款方式。摊主愿意免利息，但不免记忆。",
    returnLetter: "我请他再忘一次。他忘了日期、路线和乘客，却记得每只箱子该用几条毯子。最后他纠正我：那晚载走的不是货物，是人们不该被夺走的东西。",
    societyId: "mislaid-consulate", societyNotice: "你没有强行认领一段记忆，而是等它自己承认仍在寻找主人。",
  },
  {
    id: "night-03-log", chapter: 3, choiceId: "log", dispatchTitle: "缺页留下的形状", departureIntent: "沿装订孔、油渍与错误页码寻找被撕走的夜晚。", destination: "维修档案暗房", mapVariant: "heights",
    routeNodes: ["旧子午钟楼", "维修档案室", "暗房", "河桥底片库"],
    events: ["00:43 — 日志从42页直接跳到44页。", "01:18 — 第43页的装订线留下新鲜铜粉。", "02:36 — 暗房药水显出一列无货号箱子。", "03:48 — 底片边缘拍到吉迪恩的维修车。", "05:17 — 缺页的压痕拼出一串家庭姓氏。"],
    cityEncounter: "档案室认为缺页不属于馆藏，因此拒绝登记它的缺失。页码对此十分不满，从42直接跳到44以示抗议。",
    returnLetter: "我找的是缺失的形状。撕掉一页会留下装订孔、下一页的压痕和过分整齐的页码；沉默若被精心装订，也会变成一种证词。",
    societyId: "afterlight-cartographers", societyNotice: "你把撕页留下的轮廓当作地图，沿缺口走到了暗房。",
  },
  {
    id: "night-04-archive", chapter: 4, choiceId: "archive", dispatchTitle: "不存在的地下室", departureIntent: "把档案馆每一次否认都当成一块指路牌。", destination: "市立档案馆地下三层", mapVariant: "market",
    routeNodes: ["市立档案馆", "错误分类柜", "地下地图库", "废弃温室"],
    events: ["00:43 — 自动灯为一位不存在的访客亮起。", "01:32 — 错误分类柜主动卡住抽屉。", "02:20 — 地下三层否认楼上存在。", "03:43 — 原始地图躺在最容易犯错的柜里。", "05:09 — 奥林把钥匙归档为一枚书签。"],
    cityEncounter: "地下室坚持档案馆才是它的地下部分。双方各有三层文件支持自己的说法，建筑法规暂未选边。",
    returnLetter: "我顺着否认下楼。奥林把真相归进错误分类，又把错误写得足够醒目。那不是销毁，是一位档案员能承担的最响亮的呼救。",
    societyId: "misfiled-registry", societyNotice: "你把一处故意醒目的误分类读成求救，而不是低级错误。",
  },
  {
    id: "night-04-museum", chapter: 4, choiceId: "museum", dispatchTitle: "寄存牌寻找失主", departureIntent: "让一枚铜牌反向追查收藏机构替谁改写了来源。", destination: "玻璃丘私人库房", mapVariant: "heights",
    routeNodes: ["市立档案馆", "玻璃丘博物馆", "私人库房", "温室装卸口"],
    events: ["00:43 — 寄存牌在闭馆铃后仍然有效。", "01:25 — 馆方把‘失主’改称为‘来源不详’。", "02:20 — 私人库房编号与运输照片重合。", "03:43 — 温室装卸口留下同批黄铜碎屑。", "05:09 — 一册来源目录自行少了一页。"],
    cityEncounter: "博物馆把偷来的东西称为‘来源不详’，仿佛语法足以洗净指纹。寄存牌不懂策展术语，只固执地记得箱号。",
    returnLetter: "我替铜牌找失主。馆方给了它三个更体面的名字，却解释不了为什么编号与照片中的箱子一致。物件不擅长礼貌，因此往往更接近事实。",
    societyId: "mislaid-consulate", societyNotice: "你拒绝让‘来源不详’取消失主，把寄存牌带回了原来的姓氏旁。",
  },
  {
    id: "night-04-route43", chapter: 4, choiceId: "route43", dispatchTitle: "用脚步重画43号线", departureIntent: "让坡度、雨沟和磨损替被刮掉的墨迹补线。", destination: "废弃温室旧轨终点", mapVariant: "river",
    routeNodes: ["市立档案馆", "刮痕终点", "河下旧轨", "废弃温室"],
    events: ["00:43 — 第一段旧轨在档案桌边开始。", "01:32 — 雨沟沿被删线路改变方向。", "02:20 — 河下隧道保留了电车轮距。", "03:43 — 温室藤蔓让出一枚铜制封扣。", "05:09 — 一条完整路线重新出现在鞋底。"],
    cityEncounter: "市政地图删掉了线路，雨水仍按旧坡度流。城市可以命令墨水失忆，却很难说服重力配合。",
    returnLetter: "我用脚步重画43号线。刮痕在纸上结束，坡度从那里开始；到温室时，鞋底已替原图保存了一份不太整洁的副本。",
    societyId: "afterlight-cartographers", societyNotice: "你让鞋底替原图保留副本，路线因此不再只属于档案馆。",
  },
  {
    id: "night-05-platform", chapter: 5, choiceId: "platform", dispatchTitle: "等待被否认的末班车", departureIntent: "按一张不存在的时刻表，在空站台保持准时。", destination: "00:43 隐藏站台", mapVariant: "river",
    routeNodes: ["玻璃丘信号台", "河下隧道", "隐藏站台", "00:43末班车"],
    events: ["00:43 — 废弃信号灯变成琥珀色。", "01:17 — 空站台替一位乘客保留了影子。", "02:43 — 吉迪恩送来最后一页日志。", "03:26 — 完整账册被放在长椅上。", "05:00 — 伊芙琳的录音随车铃开始播放。"],
    cityEncounter: "站内所有钟都停在不同时间，只有列车准时。时刻表对此感到受辱，连夜申请把‘准时’重新定义为一种误会。",
    returnLetter: "我在站台等。没有人承认会有车来，所以每个人都提前到了。账册先抵达，信随后，最后是伊芙琳的声音——真相也有自己的时刻表。",
    societyId: "misfiled-registry", societyNotice: "你按一份无效时刻表准时到场，迫使制度解释究竟是谁迟到。",
  },
  {
    id: "night-05-letter", chapter: 5, choiceId: "letter", dispatchTitle: "迟到七年的投递", departureIntent: "让一封没有地址的信成为重启旧线的行车凭证。", destination: "43号线司机交接室", mapVariant: "market",
    routeNodes: ["玻璃丘信号台", "司机交接室", "河下隧道", "隐藏站台"],
    events: ["00:43 — 信封在废弃闸机上刷出绿灯。", "01:17 — 司机交接室补签七年前的收件栏。", "02:43 — 旧电车把信当作第一张车票。", "03:26 — 账册在终点长椅等待签收。", "05:00 — 伊芙琳的录音念出信上最后一句。"],
    cityEncounter: "闸机不接受现行货币，却接受一句守了七年的承诺。交通局若追问，机器准备声称自己只是文学素养过高。",
    returnLetter: "我把信交给司机。它没有地址，却比任何车票都清楚终点。旧线亮起时，我怀疑城市不是忘了路线，只是在等一个足够迟到的理由。",
    societyId: "mislaid-consulate", societyNotice: "你替一封迟到七年的信完成投递，把承诺还给了仍在等它的人。",
  },
  {
    id: "night-05-signal", chapter: 5, choiceId: "signal", dispatchTitle: "替城市守望", departureIntent: "从玻璃丘等待所有机构的灯依次暴露自己的立场。", destination: "玻璃丘废弃信号台", mapVariant: "heights",
    routeNodes: ["玻璃丘博物馆", "废弃信号台", "河下总闸", "隐藏站台"],
    events: ["00:43 — 博物馆先熄灯，信号台随后亮起。", "01:17 — 河下总闸收到一条无人发送的放行令。", "02:43 — 三处被否认的入口同时转为琥珀色。", "03:26 — 隐藏站台长椅出现完整账册。", "05:00 — 伊芙琳的声音越过所有关闭的广播。"],
    cityEncounter: "从高处看，每一栋否认43号线的机构都留着一盏朝向旧轨的灯。谎言也需要值夜班，而且通常排班很满。",
    returnLetter: "我在玻璃丘守望。灯一盏盏熄灭，只有朝向旧线的窗还亮着。城市嘴上选择沉默，建筑却整夜替它泄密。",
    societyId: "afterlight-cartographers", societyNotice: "你从熄灭次序里测出一张机构地图，让每扇留灯的窗自己标注立场。",
  },
].map((direction) => routeDirectionSchema.parse(direction));

for (const chapter of nightShiftCase.chapters) {
  const authoredChoiceIds = routeDirections.filter((direction) => direction.chapter === chapter.number).map((direction) => direction.choiceId);
  const chapterChoiceIds = chapter.choices.map((choice) => choice.id);
  if (authoredChoiceIds.length !== 3 || chapterChoiceIds.some((choiceId) => !authoredChoiceIds.includes(choiceId))) {
    throw new Error(`Route directions do not cover every choice in chapter ${chapter.number}`);
  }
}

export function getDefaultChoiceId(chapterNumber: number): string {
  const chapter = nightShiftCase.chapters[chapterNumber - 1];
  if (!chapter) throw new Error(`Unknown chapter ${chapterNumber}`);
  return chapter.choices[0].id;
}

export function getRouteDirection(chapterNumber: number, choiceId = ""): RouteDirection {
  const chapter = nightShiftCase.chapters[chapterNumber - 1];
  if (!chapter) throw new Error(`Unknown chapter ${chapterNumber}`);
  const resolvedChoiceId = choiceId || getDefaultChoiceId(chapterNumber);
  if (!chapter.choices.some((choice) => choice.id === resolvedChoiceId)) {
    throw new Error(`Unknown choice ${resolvedChoiceId} for chapter ${chapterNumber}`);
  }
  const direction = routeDirections.find((item) => item.chapter === chapterNumber && item.choiceId === resolvedChoiceId);
  if (!direction) throw new Error(`Missing route direction for chapter ${chapterNumber}, choice ${resolvedChoiceId}`);
  return direction;
}
