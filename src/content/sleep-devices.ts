import type { SleepBridge, SleepPermissionId, VirtualSleepDevice } from "@/src/lib/sleep-hardware/types";

export const sleepPermissionCopy: Record<SleepPermissionId, { label: string; note: string }> = {
  "sleep-window": { label: "入睡与醒来时刻", note: "建立夜班起止，不读取闹钟或日程。" },
  "sleep-stages": { label: "睡眠阶段摘要", note: "只保留汇总时长，不保存原始分期曲线。" },
  "heart-rate": { label: "夜间心率摘要", note: "只保留均值与变化提示，不作医学判断。" },
  movement: { label: "翻身与醒转趋势", note: "归一化为安稳度，不保存逐分钟动作。" },
  respiration: { label: "呼吸节律摘要", note: "仅用于夜间氛围反馈，不用于诊断。" },
};

export const virtualSleepDevices: VirtualSleepDevice[] = [
  {
    id: "night-ring",
    kind: "ring",
    name: "雾灯睡眠戒",
    archiveName: "RING / 01",
    shortDescription: "最完整的虚拟样机，适合体验全部联动。",
    fieldNote: "它把脉搏写成极细的金线，林渡只拿走摘要。",
    assetId: "hardware.virtual-ring",
    permissions: ["sleep-window", "sleep-stages", "heart-rate", "movement", "respiration"],
    confidence: 0.94,
  },
  {
    id: "watch-17",
    kind: "watch",
    name: "十七号夜表",
    archiveName: "WATCH / 17",
    shortDescription: "用腕间动作与心率推断一夜的轮廓。",
    fieldNote: "表盘熄灭以后，秒针在城里继续走。",
    assetId: "hardware.virtual-watch",
    permissions: ["sleep-window", "sleep-stages", "heart-rate", "movement"],
    confidence: 0.88,
  },
  {
    id: "under-mattress",
    kind: "mattress",
    name: "床下潮汐带",
    archiveName: "MATTRESS / 04",
    shortDescription: "无需穿戴，从压力与呼吸起伏读取安稳度。",
    fieldNote: "床垫下面有一条看不见的河，翻身就是潮汐。",
    assetId: "hardware.virtual-mattress",
    permissions: ["sleep-window", "movement", "respiration"],
    confidence: 0.84,
  },
  {
    id: "quiet-pillow",
    kind: "pillow",
    name: "静默枕",
    archiveName: "PILLOW / 09",
    shortDescription: "关注呼吸与醒转，数据最少、介入最轻。",
    fieldNote: "它不记梦，只记你把夜晚轻轻翻过了几次。",
    assetId: "hardware.virtual-pillow",
    permissions: ["sleep-window", "movement", "respiration"],
    confidence: 0.79,
  },
];

export const sleepBridges: SleepBridge[] = [
  {
    id: "apple-health",
    name: "Apple Health",
    ecosystem: "iPhone / Apple Watch",
    note: "计划通过 HealthKit 读取用户明确授权的睡眠摘要。",
    permissions: ["sleep-window", "sleep-stages", "heart-rate", "respiration"],
  },
  {
    id: "health-connect",
    name: "Health Connect",
    ecosystem: "Android / Wear OS",
    note: "计划通过 Health Connect 汇总兼容设备写入的睡眠记录。",
    permissions: ["sleep-window", "sleep-stages", "heart-rate", "respiration"],
  },
  {
    id: "oura-cloud",
    name: "Oura Cloud",
    ecosystem: "Oura Ring",
    note: "计划通过用户 OAuth 授权读取夜间汇总，不在客户端保存令牌。",
    permissions: ["sleep-window", "sleep-stages", "heart-rate", "movement", "respiration"],
  },
  {
    id: "fitbit-web",
    name: "Fitbit Web API",
    ecosystem: "Fitbit",
    note: "计划通过用户 OAuth 授权读取睡眠日志与夜间摘要。",
    permissions: ["sleep-window", "sleep-stages", "heart-rate"],
  },
];

export function getVirtualSleepDevice(id: string | undefined): VirtualSleepDevice | undefined {
  return virtualSleepDevices.find((device) => device.id === id);
}

export function getSleepBridge(id: string | undefined): SleepBridge | undefined {
  return sleepBridges.find((bridge) => bridge.id === id);
}

