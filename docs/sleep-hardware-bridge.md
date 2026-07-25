# 睡眠硬件桥

## 产品原则

睡眠硬件是 Night Shift 延迟探索的可选感官层，不是新的胜负系统。未接设备、权限被撤销、数据残缺或睡眠断续时，所有案件都必须继续结算同一组关键事实。设备信号只改变夜行中的环境反馈和晨报摘要，不进入 `resolveNight` 或结局资格。

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

硬件中心提供 Apple Health、Android Health Connect、Oura Cloud 与 Fitbit Web API 的厂商选择、拟用权限和数据映射。它们当前明确标记为“接口预演”，不会发起 OAuth、SDK 调用或真实采集，也不会显示“已连接”。浏览厂商只修改面板内的临时草稿，不覆盖已连接虚拟设备；每个厂商都提供一台能力相近的虚拟设备作为可玩的后续入口。真实接入需要独立的原生权限层或服务端令牌桥。

网页玩家的完整操作步骤见 [[docs/sleep-hardware-user-guide]]。以 Xiaomi Watch S4、Mi Fitness 和 Health Connect 为例的数据源验证、原生 Companion 方案与甲方演示边界见 [[docs/xiaomi-watch-hardware-test]]；只有测试手机的 Health Connect 确实出现可追溯的 Mi Fitness 睡眠记录，才能把该段判定为真实数据源链路通过。

### Home Assistant 空间外设

硬件中心的第三个入口连接真实 Home Assistant，但它属于房间环境域，不是睡眠健康来源。浏览器经 `127.0.0.1` 本地桥显式配对，只能把夜班出发、睡隙回声与晨报抵达绑定到白名单中的场景、灯、开关或风扇；传感器只读。任何连接或动作失败都不影响 `SleepSession`、硬件采集、晨报或案件结算。完整接线、安全范围和本地存档见 [[docs/home-assistant-ambient-bridge]]。

## 交互模型

硬件中心采用三段式链路：

1. 选择虚拟设备。点选只更新面板草稿，现有授权和活动采集不变。
2. 确认摘要字段。睡眠窗口是建立会话边界所必需的最小字段，其他字段可以逐项关闭。
3. 明确授权后原子替换设备与权限。连接成功会给出可返回游戏的完成态，下一次夜班自动采集。

抽屉每次打开都回到顶部；关闭按钮在深层滚动时保持可见。若夜班正在采集，界面禁止更换设备或权限，直到晨报生成，避免同一份回执混用来源。手机顶栏保留“睡眠设备／设备已接／记录中”的文字状态，不退化为无法辨认的抽象图标。

## 运行时结构

| 模块 | 职责 |
|---|---|
| `src/lib/sleep-hardware/types.ts` | 设备、权限、采集和标准化摘要契约 |
| `src/content/sleep-devices.ts` | 四类虚拟设备、四个桥接方向及权限说明 |
| `src/lib/sleep-hardware/simulator.ts` | 确定性摘要和运行时信号投影 |
| `src/stores/sleep-hardware-store.ts` | 独立 localStorage 授权、活动采集与最近摘要 |
| `src/components/game/sleep-hardware.tsx` | 硬件中心、交接状态、夜间遥测和晨报回执 |
| `src/lib/ambient-hardware/` | Home Assistant 实体、语义 cue 与浏览器桥客户端契约 |
| `src/stores/ambient-hardware-store.ts` | 独立的外设启用／绑定存档和非阻塞连接状态 |
| `tools/home-assistant-bridge/` | loopback 桥、Home Assistant WebSocket、实体白名单与动作翻译 |

`game-store` 只在 `SleepSession` 开始／结束边界调用 `beginCapture` 和 `finishCapture`。硬件域不持有剧情进度，游戏域也不持有健康字段，因此更换或移除硬件层不会迁移案件存档。

## 生命周期

```text
浏览设备草稿 → 确认摘要 → 原子授权 → 开始 SleepSession → 运行时信号投影
                                                         ↓
撤销即停止采集 ← 最近 8 条本地摘要 ← 结束 SleepSession
```

活动采集冻结设备、权限、开始时间和睡眠质量快照。中途切换来源或撤销会终止设备采集，但不会结束 `SleepSession`。桥接预演永远不创建活动采集。

## 相关文档

- [[docs/architecture]]
- [[docs/sleep-hardware-user-guide]]
- [[docs/xiaomi-watch-hardware-test]]
- [[docs/privacy-and-guardrails]]
- [[docs/home-assistant-ambient-bridge]]
- [[docs/product-overview]]
- [[docs/art-prompts/sleep-hardware-dossiers]]
- [[plans/0028-sleep-hardware-bridge]]
- [[plans/0029-sleep-hardware-ux-pass]]
