# 架构概览

## 运行形态

项目使用 Next App Router、React、TypeScript 与 Sites/Vinext 运行时。当前黑客松版本把游戏页面组织成一个客户端状态机，以减少现场演示中的切页等待；部署仍由服务端渲染首屏元数据和外壳。

## 关键模块

| 模块 | 位置 | 职责 |
|---|---|---|
| 案件内容 | `src/content/case.ts` | 五夜章节、12 条线索、8 件藏品与固定报告文本 |
| 随身物内容 | `src/content/preparations.ts` | 三件准备物、五夜各自的确定性环境回响 |
| 内容契约 | `src/lib/game-engine/schema.ts` | Zod schema、引用与数量约束 |
| 夜间结算 | `src/lib/game-engine/resolve-night.ts` | 根据章节与睡眠质量选择确定性结果 |
| 睡眠会话 | `src/lib/game-engine/sleep-session.ts` | 创建、恢复和结束 Demo／真实夜班，按时长生成质量与夜印进度 |
| 游戏存档 | `src/stores/game-store.ts` | Zustand 状态、阶段转换与浏览器持久化 |
| 产品界面 | `app/page.tsx` | 首页、交接、夜间、晨报、案件板、收藏和结局 |
| 视觉系统 | `app/globals.css` | 色板、纸张、地图、雨雾、响应式与动效 |
| 资产清单 | `src/content/assets.ts` | 主视觉、八件物证与五枚夜印的 manifest 和解析函数 |

## 状态模型

主要阶段为 `day → ready → night → morning → ending`。章节结算只通过 `resolveNight` 产生，不由生成模型决定。Zustand 使用 `night-shift-save-v1` 保存到浏览器 `localStorage`，当前持久化结构版本为 2；迁移会为旧存档补齐睡眠模式、会话和夜印字段。

睡眠质量为 `interrupted`、`regular`、`restful`：三者都至少解锁一条主线线索；差异只体现在路线长度、收藏数量、回声事件和环境观察。`selectedPreparationId` 记录当夜随身物，`resolveNight` 只用它选择环境回响，不改变固定线索。完成一夜后，章节编号会加入持久化的 `nightSealIds`。

`sleepMode` 区分 12 秒压缩演示和真实夜班。开始交接时创建包含 `startedAt` 的 `activeSleepSession`；真实模式不依赖后台定时器，而是在重开页面后由开始时间与当前时间重新计算进度。玩家醒来结束会话时写入 `endedAt`、实际分钟数和按阈值派生的质量，并把会话保存为 `lastSleepSession` 供晨报读取。少于 5 小时为断续，5 小时至不足 7 小时为普通，7 小时及以上为安稳；任一结果都推进主线。

## 内容边界

生成式能力只用于视觉资产或未来对固定报告事实的文字润色。伊芙琳是否活着、人物动机、线索存在性、核心因果与结局条件必须来自确定性内容，详见 [[docs/story-bible]]。

## 当前边界

当前 UI 集中在 `app/page.tsx`，适合快速演示但不利于长期局部迭代；案件板关系确认也仍偏向现场演示。这些问题统一收敛在 [[plans/0003-mvp-quality-hardening]]。

## 交互基线与目标组件边界

0003 开工时冻结以下行为：Demo 仍可在 12 秒内完成一夜；三种睡眠都推进固定主线；随身物只改变环境回响；晨报、夜印和收藏结果保持兼容。

后续拆分遵循以下功能边界：

- `GameShell`：阶段与底部导航编排，不拥有章节结算规则。
- `NightPreparation`：调查方向、随身物、Demo／真实模式选择。
- `NightSession`：可恢复的真实计时、Demo 压缩动画和夜印显影。
- `MorningReport`：只读取已结算的睡眠会话与章节结果。
- `CaseBoard`：证物节点、玩家连线和关系验证。
- `CollectionCabinet`：夜印与收藏品的持久陈列。

会话模型已经放进 `src/lib/game-engine`，跨页恢复依赖持久化时间戳而非组件生命周期。下一阶段按上述边界迁移组件，避免把更多规则固化在页面文件中。

## 相关文档

- [[docs/product-overview]]
- [[docs/decision-log]]
- [[docs/quality-baseline]]
- [[plans/0001-hackathon-mvp]]
