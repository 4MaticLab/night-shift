import { nightShiftCase } from "@/src/content/case";
import { caseCharacterSchema, type CaseCharacter } from "@/src/lib/game-engine/schema";

export const caseCharacters: CaseCharacter[] = [
  {
    id: "mina-solair", assetId: "character.mina-solair", name: "米娜·索莱尔", archiveName: "PERSON 02 · LANTERN WHARF", role: "灯港夜间花店老板", district: "灯港区", encounterChapter: 2,
    publicRumor: "她替花束记住收件人，却很少替人记住姓名。",
    knownFact: "每隔四十三天，她都会接到一笔没有收件地址的夜香花订单。她否认见过伊芙琳，却保存着不该属于陌生人的明信片。",
    withheld: "她一直替伊芙琳维持一条不依赖地址的通信线。她保护的不是谎言，而是一个仍应有权选择出现的人。",
    quote: "花会记得谁照料过它。人有时得假装不记得。",
    revealClueIds: ["flower-cycle", "postcard"],
  },
  {
    id: "gideon-vale", assetId: "character.gideon-vale", name: "吉迪恩·韦尔", archiveName: "PERSON 03 · RETIRED DRIVER", role: "退休电车司机", district: "旧子午区", encounterChapter: 3,
    publicRumor: "他退休以后仍会在零点四十三分摘帽，向一辆不存在的车致意。",
    knownFact: "他坚称从未驾驶过43号线，维修车日志却恰好缺少伊芙琳失踪当夜的一页。",
    withheld: "他驾驶维修车把伊芙琳送过隐藏站台，帮助她主动离开。沉默保护了她，也替那家收藏机构多争取了七年。",
    quote: "司机不决定乘客为什么离开，只负责让最后一扇门真的打开。",
    revealClueIds: ["missing-log", "transport-photo"],
  },
  {
    id: "orin-bell", assetId: "character.orin-bell", name: "奥林·贝尔", archiveName: "PERSON 04 · MUNICIPAL ARCHIVE", role: "市立档案馆管理员", district: "旧子午区", encounterChapter: 4,
    publicRumor: "他能把任何文件放进错误抽屉，并在需要时第一个找到。",
    knownFact: "他修改过公开电车地图，刮掉了43号线；地下档案柜里却留着唯一一份原图。",
    withheld: "删除公开路线是为了阻止追踪，保留原图则是给未来的调查者留门。他害怕承担责任，但没有把证据交给恐惧。",
    quote: "销毁一张地图很容易。困难的是决定哪一天让它重新被找到。",
    revealClueIds: ["scratched-map", "museum-tag"],
  },
  {
    id: "evelyn-quell", assetId: "character.evelyn-quell", name: "伊芙琳·奎尔", archiveName: "PERSON 05 · MISSING PHOTOGRAPHER", role: "夜间摄影师／主动失踪者", district: "玻璃丘", encounterChapter: 5,
    publicRumor: "她拍摄城市不愿承认的东西；有些底片要等七年才肯显影。",
    knownFact: "她拍到私人收藏机构借维修线转移社区档案，并带走记录来源与买家的账册。官方所说的离城不是全部事实。",
    withheld: "她仍然活着，并主动安排车票与旧物重新出现。她没有要求调查者替她公开真相，只要求把证据和决定权送回。",
    quote: "别替我决定该不该出现。把相机、账册和那道门一起还给我。",
    revealClueIds: ["ledger-clasp", "evelyn-message"],
  },
].map((character) => caseCharacterSchema.parse(character));

const clueIds = new Set(nightShiftCase.clues.map((clue) => clue.id));
for (const character of caseCharacters) {
  for (const clueId of character.revealClueIds) {
    if (!clueIds.has(clueId)) throw new Error(`Unknown character reveal clue: ${clueId}`);
  }
}

export function getCaseCharacter(id: string): CaseCharacter {
  const character = caseCharacters.find((item) => item.id === id);
  if (!character) throw new Error(`Unknown character: ${id}`);
  return character;
}

export function getChapterCharacter(chapter: number): CaseCharacter | undefined {
  return caseCharacters.find((character) => character.encounterChapter === chapter);
}

export function isCharacterRevealed(character: CaseCharacter, unlockedClueIds: string[]): boolean {
  return character.revealClueIds.every((clueId) => unlockedClueIds.includes(clueId));
}
