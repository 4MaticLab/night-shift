# 睡眠硬件桥

## 产品原则

睡眠硬件是 Night Shift 延迟探索的可选感官层，不是新的胜负系统。未接设备、权限被撤销、数据残缺或睡眠断续时，普通案件与沙盒案件都必须继续结算同一组关键事实。设备信号只改变夜行中的环境反馈和晨报摘要，不进入 `resolveNight`、`resolveSandboxAction` 或结局资格。

## 当前可用来源

### 虚拟硬件

四类虚拟设备已经完整接入交接、夜班和晨报：

| 设备 | 主要能力 | 说明 |
|---|---|---|
| 雾灯睡眠戒 | 睡眠窗口、分期、心率、动作、呼吸 | 功能最完整的演示样机 |
| 十七号夜表 | 睡眠窗口、分期、心率、动作 | 模拟手表／手环能力 |
| 床下潮汐带 | 睡眠窗口、动作、呼吸 | 模拟床垫下非穿戴传感器 |
| 静默枕 | 睡眠窗口、动作、呼吸 | 最少数据、最低介入样机 |

模拟器以 `sessionId + sourceId` 生成确定性摘要；相同会话和设备重复计算结果一致。夜间 UI 可以投影变化中的信号，但原始逐点序列不会写入存档。归来时只保存时长、派生质量、置信度和已授权字段的少量汇总。

### 真实桥接预演

硬件中心提供 Apple Health、Android Health Connect、Oura Cloud 与 Fitbit Web API 的厂商选择、拟用权限和数据映射。它们当前明确标记为“接口预演”，不会发起 OAuth、SDK 调用或真实采集，也不会显示“已连接”。真实接入需要独立的原生权限层或服务端令牌桥。

## 运行时结构

| 模块 | 职责 |
|---|---|
| `src/lib/sleep-hardware/types.ts` | 设备、权限、采集和标准化摘要契约 |
| `src/content/sleep-devices.ts` | 四类虚拟设备、四个桥接方向及权限说明 |
| `src/lib/sleep-hardware/simulator.ts` | 确定性摘要和运行时信号投影 |
| `src/stores/sleep-hardware-store.ts` | 独立 localStorage 授权、活动采集与最近摘要 |
| `src/components/game/sleep-hardware.tsx` | 硬件中心、交接状态、夜间遥测和晨报回执 |

线性 `game-store` 与沙盒 `sandbox-store` 都只在 `SleepSession` 开始／结束边界调用 `beginCapture` 和 `finishCapture`。硬件域不持有剧情进度，游戏域也不持有健康字段，因此更换或移除硬件层不会迁移案件存档。

## 生命周期

```text
选择虚拟设备 → 逐项授权 → 开始 SleepSession → 运行时信号投影
                                               ↓
撤销即停止采集 ← 最近 8 条本地摘要 ← 结束 SleepSession
```

活动采集冻结设备、权限、开始时间和睡眠质量快照。中途切换来源或撤销会终止设备采集，但不会结束 `SleepSession`。桥接预演永远不创建活动采集。

## 相关文档

- [[docs/architecture]]
- [[docs/privacy-and-guardrails]]
- [[docs/product-overview]]
- [[docs/art-prompts/sleep-hardware-dossiers]]
- [[plans/0028-sleep-hardware-bridge]]

