import { nightShiftCase } from "@/src/content/case";
import { caseCharacters } from "@/src/content/characters";
import { endingEpilogues } from "@/src/content/endings";
import { routeDirections } from "@/src/content/routes";
import type { CampaignStoryline } from "@/src/content/campaigns/types";
import { assertSandboxCampaign } from "@/src/lib/sandbox/engine";
import type { SandboxRisk } from "@/src/lib/sandbox/types";

export const LAST_TRAM_STORYLINE_ID = "last-tram";

const riskBySequence: SandboxRisk[] = ["quiet", "quiet", "exposed", "exposed", "dangerous"];
const locationCoordinates = [
  { x: 18, y: 16 },
  { x: 36, y: 33 },
  { x: 22, y: 52 },
  { x: 43, y: 69 },
  { x: 30, y: 86 },
];

const lastTramSandbox = assertSandboxCampaign({
  title: "零点四十三分的末班车 · 主线",
  englishTitle: "The Last Tram at 00:43 · Main Thread",
  year: "雾灯历 43 年",
  place: "雾灯城 · 43 号线沿线",
  premise: "一张纸张老化七年、日期却是昨天的车票，把林渡引向一条被城市否认的电车线。每段调查在真实时间或 12 秒演示后带回确定事实；主线不再按五夜倒数，而是按证物逐段显影。",
  contentWarnings: ["失踪暗示", "制度性掠夺", "证人受威胁"],
  origins: [
    {
      id: "ticket-entry",
      title: "从那张昨天的旧车票开始",
      subtitle: "Begin with the impossible ticket",
      briefing: "车票纸张来自七年前，油墨日期却是昨天。先让物证决定林渡该去哪里。",
      objective: "追出 43 号线、秘密运输与伊芙琳主动失踪之间的完整因果。",
      startingLocationIds: ["last-tram-segment-1"],
      startingItemIds: [],
      startingClueIds: [],
      trait: "先相信物件的年代，再听城市解释它为什么不存在。",
    },
    {
      id: "denial-entry",
      title: "从城市过度用力的否认开始",
      subtitle: "Begin with the city's denial",
      briefing: "市政牌声称此处从无 43 号线，牌后的门轴却刚上过油。沿维护记录追查那条被删除的路线。",
      objective: "找出谁仍在维护废线，以及它替哪些人保存了退路。",
      startingLocationIds: ["last-tram-segment-1"],
      startingItemIds: [],
      startingClueIds: [],
      trait: "把每一次制度否认都当成一块反向路标。",
    },
  ],
  clues: nightShiftCase.clues.map((clue) => ({
    id: clue.id,
    title: clue.title,
    category: clue.type === "contradiction"
      ? "contradiction"
      : clue.type === "place"
        ? "place"
        : clue.type === "event" || clue.type === "person"
          ? "testimony"
          : "document",
    summary: clue.summary,
    detail: clue.detail,
    relatedIds: clue.relatedIds,
  })),
  handouts: [],
  items: nightShiftCase.collectibles.map((item) => ({
    id: item.id,
    name: item.title,
    description: item.revealedDescription,
  })),
  npcs: caseCharacters.map((character) => ({
    id: character.id,
    assetId: character.assetId,
    name: character.name,
    role: character.role,
    faction: character.district,
    publicFace: character.publicRumor,
    privateDrive: character.withheld,
  })),
  corruptionStages: [
    { stage: 0, name: "车票刚到", benefit: "所有路线仍可选择。", cost: "43 号线只是一项被否认的传闻。" },
    { stage: 1, name: "纸张开口", benefit: "旧纸、油墨与花粉开始互相作证。", cost: "城市知道有人重新读起旧票。" },
    { stage: 2, name: "花单回信", benefit: "米娜与伊芙琳的通信线显影。", cost: "保护证人与公开事实第一次发生冲突。" },
    { stage: 3, name: "缺页显形", benefit: "秘密运输重新获得家庭姓名。", cost: "吉迪恩的沉默不再能独自保护所有人。" },
    { stage: 4, name: "路线重画", benefit: "隐藏站台与完整账册进入可达范围。", cost: "收藏机构开始察觉档案被重新连接。" },
    { stage: 5, name: "站台亮灯", benefit: "三种收束都可被认真选择。", cost: "真相公开的方式将影响仍活着的人。" },
    { stage: 6, name: "余波归档", benefit: "城市支线可以继续引用本案证物。", cost: "结案不再意味着城市停止变化。" },
    { stage: 7, name: "城市记住", benefit: "主案成为后续版本的稳定事实层。", cost: "新增故事必须尊重既有选择与因果。" },
  ],
  locations: nightShiftCase.chapters.map((chapter, index) => {
    const routes = routeDirections.filter((route) => route.chapter === chapter.number);
    const routeIds = routes.map((route) => route.id);
    const character = caseCharacters.find((entry) => entry.encounterChapter === chapter.number);
    return {
      id: `last-tram-segment-${chapter.number}`,
      order: chapter.number,
      name: chapter.title,
      archiveName: `主线段落 ${String(chapter.number).padStart(2, "0")}`,
      subtitle: chapter.subtitle,
      atmosphere: chapter.cityAside,
      coordinates: locationCoordinates[index],
      actions: routes.map((route) => {
        const choice = chapter.choices.find((entry) => entry.id === route.choiceId)!;
        const nextLocationId = nightShiftCase.chapters[index + 1] ? `last-tram-segment-${chapter.number + 1}` : undefined;
        return {
          id: route.id,
          title: route.dispatchTitle,
          intent: route.departureIntent,
          risk: riskBySequence[index],
          requirementHint: "这一段已经沿另一条路线推进；可以在证物档案中回看其他可能。",
          requires: { noneActionIds: routeIds.filter((id) => id !== route.id) },
          scene: route.events[0],
          result: route.returnLetter,
          effects: {
            clueIds: chapter.clueIds,
            itemIds: chapter.collectibleIds,
            unlockLocationIds: nextLocationId ? [nextLocationId] : [],
            corruption: 1,
            npc: character ? [{ npcId: character.id, state: "helpful" as const }] : [],
          },
          reducedResult: choice.note,
        };
      }),
    };
  }),
  endings: endingEpilogues.map((ending) => ({
    id: ending.id,
    title: ending.title,
    archiveLabel: ending.archiveLabel,
    theme: ending.theme,
    requires: { anyActionIds: routeDirections.filter((route) => route.chapter === 5).map((route) => route.id) },
    result: ending.result,
    coda: ending.closingLine,
  })),
  presentation: {
    caseNumber: "001 · 主线",
    caseTypeLabel: "FOGLIGHT MAIN STORY THREAD",
    loadingTitle: "正在读取雾灯城主案进度",
    entryEyebrow: "雾灯城 · 43 号线",
    entryCta: "从这条证物进入主线",
    navigationLabel: "零点四十三分的末班车主线导航",
    mapTitle: "43 号线调查图",
    mapDescription: "每一段选择一个调查方向；晨报归档后，下一段会在同一张城市地图上显影。",
    mapAriaLabel: "零点四十三分的末班车五段主线地图",
    mapCaption: "FOGLIGHT CITY · ROUTE 43",
    conditionLabel: "主线深度",
    conditionAdvanceHint: "每份归档晨报都会让主案向真相推进一段。",
    threatLabel: "城市回应",
    handoffModeLabel: "主线计时模式",
    sleepEthic: "时间决定晨报何时可拆，不改变关键事实；多条故事线可以同时在夜班中推进。",
    nightTitle: "林渡正在推进末班车主线",
    nightClosingLine: "这条线正在计时；你可以返回城市地图，安排另一段主线或支线。",
    morningTitle: "末班车主线晨报",
    noNewEvidence: "这次行动没有新增证物，但路线与人物状态已经归档。",
    noEndingTitle: "主线还没有抵达站台",
    noEndingDescription: "继续归档沿线调查；最后一段完成后，三种收束会同时出现。",
    resetTitle: "重新开始末班车主线？",
    resetDescription: "这会清除主线 storylet、证物与收束进度；河下区支线和《黑水溪》样板不受影响。",
    endingEyebrow: "THE LAST TRAM AT 00:43",
    handoutKicker: "ROUTE 43",
    handoutFooter: "雾灯城主案档案",
    briefingHeading: "主案固定事实",
    creditsHeading: "Night Shift 原创主案",
    heroAssetId: "header.night-shift.hero",
    npcStateLabels: { unknown: "尚未接触", wary: "有所保留", helpful: "愿意作证", hostile: "阻止调查", rescued: "已返当下", lost: "失去联系", transformed: "立场改变" },
  },
  credits: {
    attribution: "Night Shift 原创主案 · 《零点四十三分的末班车》",
    adaptation: "主案事实、人物、地点、文本与视觉均为原创；固定故事内容不由生成能力改写。",
    usage: "仓库原创内容，依项目许可使用。",
    notice: "五段既有章节已适配为可计时、可并发的 story thread；不兼容升级直接从当前城市版本重新开始。",
  },
});

export const lastTramStoryline = {
  id: LAST_TRAM_STORYLINE_ID,
  role: "main",
  archiveLabel: "雾灯城主线",
  title: "零点四十三分的末班车",
  teaser: "从一张昨天的旧车票出发，逐段追出 43 号线、秘密运输与失踪者保留选择权的真相。",
  locale: "zh-CN",
  unlockClueIds: [],
  unlockHint: "主线从第一张车票起始，始终可进入。",
  content: lastTramSandbox,
  connections: [],
} satisfies CampaignStoryline;
