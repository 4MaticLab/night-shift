export type CipherReferenceKind = "clock" | "a1z26" | "chronology" | "frequency" | "arithmetic" | "morse" | "causal-chain" | "continuity";

export interface CipherReference {
  kind: CipherReferenceKind;
  label: string;
  title: string;
  description: string;
}

const references: Record<CipherReferenceKind, CipherReference> = {
  clock: { kind: "clock", label: "TIME NOTATION", title: "二十四小时制时刻", description: "冒号左侧是小时，右侧是分钟。倒置、交换或镜像数字时，先保留两位分组，再检查它是否构成合法时刻。" },
  a1z26: { kind: "a1z26", label: "A1Z26", title: "字母编号表", description: "A 从 01 开始，Z 到 26。两位数字逐组换成字母，不合并成一个大数。" },
  chronology: { kind: "chronology", label: "ORDERING", title: "时序与事件排序", description: "先选定统一的时间或因果方向，再抄录每项随附的信息；不要按卡片当前摆放顺序读取。" },
  frequency: { kind: "frequency", label: "SIGNAL SCALE", title: "频率与小数刻度", description: "频率由整数、小数和单位组成。按题面确定小数点位置，并只保留仪表允许的精度。" },
  arithmetic: { kind: "arithmetic", label: "LEDGER MATH", title: "档案算式", description: "先分辨总量、重复记录和每组数量，再按括号顺序完成减法、加法或除法。" },
  morse: { kind: "morse", label: "MORSE", title: "国际摩尔斯字母表", description: "短信号记作点，长信号记作划；每组信号独立对应一个字母。" },
  "causal-chain": { kind: "causal-chain", label: "CAUSE TRACE", title: "因果链阅读", description: "从最先发生的变化向结果追踪。区分证据记录的先后、机构指控的方向和真正的触发源。" },
  continuity: { kind: "continuity", label: "CONTINUITY", title: "连续性三联", description: "路线、住所、劳动、债务与日常物件可以共同证明某段生活持续存在；不要因姓名相同而折叠记录。" },
};

const referenceByChallenge: Record<string, CipherReferenceKind> = {
  "ticket-mirror": "clock",
  "florist-numbers": "a1z26",
  "platform-chronology": "chronology",
  "rain-frequency-lock": "frequency",
  "silent-call-count": "arithmetic",
  "relay-morse-voice": "morse",
  "loaf-thirteen-count": "arithmetic",
  "loaf-fire-direction": "causal-chain",
  "loaf-common-code": "a1z26",
  "noa-arrival-count": "arithmetic",
  "noa-life-continuity": "continuity",
  "noa-observer-switch": "causal-chain",
  "fog-split-waveform": "frequency",
  "fog-missing-minute": "arithmetic",
  "fog-role-exchange": "causal-chain",
};

export function getCipherReference(challengeId: string): CipherReference | undefined {
  const kind = referenceByChallenge[challengeId];
  return kind ? references[kind] : undefined;
}

export const a1z26Rows = [
  "A 01 · B 02 · C 03 · D 04 · E 05 · F 06 · G 07 · H 08 · I 09",
  "J 10 · K 11 · L 12 · M 13 · N 14 · O 15 · P 16 · Q 17 · R 18",
  "S 19 · T 20 · U 21 · V 22 · W 23 · X 24 · Y 25 · Z 26",
];

export const morseRows = [
  "A ·−  B −···  C −·−·  D −··  E ·  F ··−·  G −−·",
  "H ····  I ··  J ·−−−  K −·−  L ·−··  M −−  N −·",
  "O −−−  P ·−−·  Q −−·−  R ·−·  S ···  T −  U ··−",
  "V ···−  W ·−−  X −··−  Y −·−−  Z −−··",
];

export function listCipherReferenceMappings(): Readonly<Record<string, CipherReferenceKind>> {
  return referenceByChallenge;
}
