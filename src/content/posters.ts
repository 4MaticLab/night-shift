export type PosterLayout = "case-file" | "portrait" | "correspondence" | "atlas" | "last-call";

export interface PosterDefinition {
  day: number;
  layout: PosterLayout;
  release: string;
  archiveCode: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  fragmentLabel: string;
  fragment: string;
  quote: string;
  subjectLabel: string;
  subjectName: string;
  subjectNote: string;
  primaryImage: string;
  primaryAlt: string;
  primaryPosition: string;
  secondaryImage: string;
  secondaryAlt: string;
  steps: [string, string, string];
  cta: string;
  accent: string;
  qrContent: string;
}

export const posterSeries: PosterDefinition[] = [
  {
    day: 1,
    layout: "case-file",
    release: "第一日公开 · 案件启封",
    archiveCode: "CASE 001 / FRAGMENT 01",
    eyebrow: "一张不存在的车票，在昨夜重新售出",
    title: "零点四十三分，\n末班车仍在等人。",
    subtitle: "你负责白天推理。你睡着以后，夜班侦探林渡才开始工作。",
    fragmentLabel: "今日案件碎片",
    fragment: "纸张已经老化七年，票面日期却是昨天。市政厅说从来没有 43 号线；雨水不同意。",
    quote: "“雾灯城擅长保存旧事，尤其是它已经盖章否认过的那些。”",
    subjectLabel: "今晚从这里开始",
    subjectName: "不存在的车票",
    subjectNote: "一宗五夜完成的异步侦探案件",
    primaryImage: "/art/headers/shift-handoff-v2.webp",
    primaryAlt: "林渡站在夜班事务所窗前，桌上摊着地图",
    primaryPosition: "56% center",
    secondaryImage: "/art/collectibles/torn-ticket-v1.png",
    secondaryAlt: "被撕去终点的旧电车票",
    steps: ["扫码打开案件", "选择调查方向", "把夜晚交给林渡"],
    cta: "扫描启封第一宗案件",
    accent: "#698d89",
    qrContent: "day-01-case-file",
  },
  {
    day: 2,
    layout: "portrait",
    release: "第二日公开 · 角色档案",
    archiveCode: "PERSONNEL / NIGHT DETECTIVE",
    eyebrow: "他与你从未同时醒着",
    title: "林渡\n夜班侦探",
    subtitle: "白天，他把事务所留给你。夜里，他带上你选的物件，去走城市不肯承认的路。",
    fragmentLabel: "角色设计",
    fragment: "深蓝外套、灰蓝围巾、磨旧肩包、黄铜手电与一本空白笔记。克制、可靠，也习惯替证据多等一分钟。",
    quote: "“你决定该问什么。我负责在你睡着以后，找到它愿意回答的地方。”",
    subjectLabel: "今夜交接单",
    subjectName: "方向 + 随身物",
    subjectNote: "选择改变夜行侧影，不会让主线失败",
    primaryImage: "/art/characters/lin-du-handoff-portrait-v1.webp",
    primaryAlt: "林渡坐在交接桌前，手边是笔记本与黄铜手电",
    primaryPosition: "center top",
    secondaryImage: "/art/preparations/side-lamp-v1.webp",
    secondaryAlt: "档案纸上的黄铜提灯",
    steps: ["写下一个方向", "替他装一件东西", "醒来拆晨报"],
    cta: "扫描，把今晚交给林渡",
    accent: "#698d89",
    qrContent: "day-02-lin-du",
  },
  {
    day: 3,
    layout: "correspondence",
    release: "第三日公开 · 城市人物",
    archiveCode: "PERSON 02 / LANTERN WHARF",
    eyebrow: "一束花，每四十三天准时抵达",
    title: "米娜没有说谎。\n她只是替谁留着一扇门？",
    subtitle: "灯港的花店十点关门。悲伤若提前预约，可以晚一些。",
    fragmentLabel: "今日人物碎片",
    fragment: "米娜否认见过伊芙琳，却保存着不该属于陌生人的明信片。订单没有地址，花仍知道该去哪里。",
    quote: "“花会记得谁照料过它。人有时得假装不记得。”",
    subjectLabel: "角色设计",
    subjectName: "米娜·索莱尔",
    subjectNote: "灯港夜间花店老板 / PERSON 02",
    primaryImage: "/art/characters/mina-solair-portrait-v1.webp",
    primaryAlt: "花店老板米娜的编辑蚀刻肖像",
    primaryPosition: "center 18%",
    secondaryImage: "/art/postcards/night-02-flower-alley-v1.webp",
    secondaryAlt: "花店后巷中等待寄出的信封",
    steps: ["白天读线索", "夜里等待回信", "把矛盾带回案件板"],
    cta: "扫描，领取第三日碎片",
    accent: "#a86158",
    qrContent: "day-03-mina-letter",
  },
  {
    day: 4,
    layout: "atlas",
    release: "第四日公开 · 城市档案",
    archiveCode: "FOGLIGHT ATLAS / ERASED LINE",
    eyebrow: "地图可以刮掉墨，城市刮不掉坡度",
    title: "有人删除了 43 号线。\n又把原图藏在最容易找到的柜子里。",
    subtitle: "销毁证据，还是替证据争取时间？今晚，去拜访一间不存在的地下室。",
    fragmentLabel: "今日地点碎片",
    fragment: "档案馆声称没有地下室。地下室对此保留了三层楼的意见。玻璃丘的温室下面，仍有一条铜绿轨道。",
    quote: "“困难的不是销毁一张地图，而是决定哪一天让它重新被找到。”",
    subjectLabel: "城市设计",
    subjectName: "玻璃丘 / 市立档案馆",
    subjectNote: "道路是档案；坡度是证词",
    primaryImage: "/art/districts/glass-hill-v1.webp",
    primaryAlt: "玻璃丘坡地温室、档案建筑和信号台",
    primaryPosition: "center center",
    secondaryImage: "/art/characters/orin-bell-portrait-v1.webp",
    secondaryAlt: "档案管理员奥林的编辑蚀刻肖像",
    steps: ["展开可检索档案", "整理已到齐的证词", "把推论归档"],
    cta: "扫描，进入被删除的路线",
    accent: "#8b4f4c",
    qrContent: "day-04-erased-line",
  },
  {
    day: 5,
    layout: "last-call",
    release: "第五日公开 · 最后一班",
    archiveCode: "FINAL NOTICE / 00:43",
    eyebrow: "所有钟表都把谎说完以后",
    title: "信号灯亮了。\n这一次，决定由你留下。",
    subtitle: "五夜调查会把线索、城市回声与一份迟到七年的委托送回事务所。",
    fragmentLabel: "最后一张碎片",
    fragment: "隐藏站台没有乘客，只有一册等待归还的档案。真相应该被公开、被保护，还是被交还？",
    quote: "“别替仍活着的人写完结局。”",
    subjectLabel: "玩家引导",
    subjectName: "完成五夜，做出决定",
    subjectNote: "睡眠长短只改变丰富度，不会让案件失败",
    primaryImage: "/art/endings/hidden-platform-tableau-v1.webp",
    primaryAlt: "隐藏站台的长椅上放着账册与封蜡信",
    primaryPosition: "center center",
    secondaryImage: "/art/night-seals/night-05-v1.png",
    secondaryAlt: "秘密站台、电车与账册组成的第五夜印",
    steps: ["扫描进入事务所", "完成五夜交接", "选择真相的去处"],
    cta: "扫描，搭上零点四十三分末班车",
    accent: "#7f9ea8",
    qrContent: "day-05-last-call",
  },
];

export function getPoster(day: number): PosterDefinition | undefined {
  return posterSeries.find((poster) => poster.day === day);
}
