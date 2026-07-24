# Home Assistant 空间外设桥

- 状态：`in_progress`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex
- 分支：`codex/home-assistant-ambient-bridge`
- 依赖：一台可访问的 Home Assistant 实例；真实硬件验收可由模拟 WebSocket 服务替代
- 推进模式：`manual`

## 动机

Night Shift 已有可撤销的虚拟睡眠硬件层，但浏览器和云端运行时不能可靠发现或控制玩家局域网中的通用外设。Home Assistant 可以统一 HomeKit、Matter、灯光、插座、风扇与环境传感器，并通过本地 API 提供稳定设备平面。用户已批准把它接入比赛版本，同时要求保持无设备可玩、外设失败不影响剧情和令牌不落前端。

## 范围

- 新增只监听 loopback 的 Node.js 本地桥，连接 Home Assistant WebSocket API，支持实例发现、显式配对、实体归一化、状态订阅和受限动作。
- 新增与睡眠摘要并列的环境外设契约、客户端 store、语义 cue 映射与断线降级。
- 在硬件中心增加“房间外设”入口，支持桥状态、配对、实体选择、试亮和 cue 绑定。
- 在游戏阶段边界发送幂等的 `night.started`、`wake.echo` 与 `morning.arrived` cue，不阻塞游戏状态机。
- 补齐单元、桥协议、状态与浏览器交互测试，并更新架构、硬件、隐私与决策文档。

## 非目标

- 不通过普通网页直接实现 mDNS、HomeKit HAP、Matter、Zigbee 或厂商协议。
- 不把 Home Assistant 环境设备伪装成睡眠／健康信号，也不让设备状态进入剧情结算或结局资格。
- 不支持门锁、车库门、安防、摄像头、任意脚本、任意 service 调用或自动控制未授权实体。
- 不在本计划内发布 Home Assistant add-on、移动原生壳或公网到 localhost 的跨浏览器连接方案。
- 不把 Home Assistant 令牌、原始状态流或完整家庭设备清单写入游戏存档。

## 任务

- [ ] 建立本地桥包、Home Assistant WebSocket 客户端、mDNS 发现、loopback API、配对会话与安全白名单。
- [ ] 建立环境外设契约、语义 cue、客户端 store 和断线／幂等行为。
- [ ] 扩展硬件中心并接入游戏阶段协调器，保持核心状态机非阻塞。
- [ ] 覆盖桥协议、实体归一化、安全拒绝、store 和关键 UI 流程。
- [ ] 更新稳定文档、决策记录、运行脚本与比赛接线说明。
- [ ] 完成代码、文档、构建与必要浏览器验证。

## 验收标准

- 本地桥只监听 `127.0.0.1`，默认只允许 Night Shift 本地开发 origin；未配对请求、错误 origin 和非白名单实体／动作被拒绝。
- `HA_TOKEN` 只由本地桥读取，不进入前端包、浏览器存档、日志或桥 API 响应。
- 桥能通过显式 `HA_URL` 或 `_home-assistant._tcp.local.` 发现实例，完成 Home Assistant WebSocket 认证、初始状态读取、`state_changed` 订阅与断线重连。
- UI 能配对桥、只展示受支持实体、选择并试运行一项外设、绑定三种语义 cue，并准确显示离线／失败状态。
- cue 以稳定请求 ID 幂等执行；支持 `scene`、`light`、`switch`、`fan`，传感器只读；危险域和任意脚本拒绝。
- 未运行桥、Home Assistant 断线、令牌失效、设备 unavailable 或命令失败时，五夜主循环与现有睡眠硬件行为不变。
- 不保存 Home Assistant 令牌、原始事件流或完整实体状态；浏览器只保留用户选择的实体 ID、cue 绑定与启用状态。

## 验证

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run docs:check`
- `npm run bridge:test`
- `npm run test:e2e -- --grep "Home Assistant"`
- 使用模拟 Home Assistant WebSocket 服务验证认证、初始状态、状态事件、命令、重连与拒绝路径。
- 使用本地浏览器验证无桥降级、配对、试亮、cue 绑定和游戏阶段不等待桥响应。

## 决定记录

- 2026-07-24：用户批准按设计方案推进，计划以 `manual` 模式直接进入 `in_progress`。
- 2026-07-24：Home Assistant 作为独立空间外设域，不改变 ADR-010 的睡眠健康数据边界。
- 2026-07-24：前端只发送语义 cue；Home Assistant token、service allowlist 和命令翻译保留在 loopback 本地桥。

## 相关文档

- [[docs/architecture]]
- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[docs/decision-log]]
- [[docs/hackathon-submission-kit]]
