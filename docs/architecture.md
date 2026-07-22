# 架构概览

## 运行形态

项目使用 Next App Router、React、TypeScript 与 Sites/Vinext 运行时。当前黑客松版本把游戏页面组织成一个客户端状态机，以减少现场演示中的切页等待；部署仍由服务端渲染首屏元数据和外壳。

## 关键模块

| 模块 | 位置 | 职责 |
|---|---|---|
| 案件内容 | `src/content/case.ts` | 五夜章节、12 条线索、8 件藏品与固定报告文本 |
| 随身物内容 | `src/content/preparations.ts` | 三件准备物、五夜各自的确定性环境回响 |
| 归来明信片 | `src/content/postcards.ts` | 五夜地点、城市传闻、背面短笺与三种随身物附言 |
| 调查方向 | `src/content/routes.ts` | 五夜十五条确定性路线、夜间事件、城市遭遇与归来来信 |
| 夜生植物 | `src/content/botany.ts` | 五株植物、四阶段成长文案、睡眠层级说明与进度阶段推导 |
| 证物关系 | `src/content/relations.ts` | 三条核心推论、对应证物对与成功解释 |
| 内容契约 | `src/lib/game-engine/schema.ts` | Zod schema、引用与数量约束 |
| 夜间结算 | `src/lib/game-engine/resolve-night.ts` | 根据章节、睡眠质量、随身物与调查方向选择确定性结果 |
| 睡眠会话 | `src/lib/game-engine/sleep-session.ts` | 创建、恢复和结束 Demo／真实夜班，按时长生成质量与夜印进度 |
| 结局资格 | `src/lib/game-engine/ending.ts` | 三结局白名单与真结局的线索、藏品、关系门槛 |
| 游戏存档 | `src/stores/game-store.ts` | Zustand 状态、阶段转换与浏览器持久化 |
| 产品外壳 | `app/page.tsx` | 阶段判断、视图编排、Demo 抽屉开关与顶层导航 |
| 落地叙事 | `src/components/game/landing.tsx` | 首页主视觉与三幕开场 |
| 夜间循环 | `src/components/game/night-cycle.tsx` | 睡前准备、夜班会话、晨报与空晨报状态 |
| 调查与归档 | `src/components/game/investigation.tsx` | 案件板、收藏柜、档案与结局 |
| 游戏框架 | `src/components/game/shell.tsx` | 顶栏、底部导航与 Demo 控制台 |
| 共享游戏 UI | `src/components/game/shared.tsx` | 纸卡、印章、城市路线与睡眠文案 |
| 视觉系统 | `app/globals.css` | 色板、纸张、地图、雨雾、响应式与动效 |
| 资产清单 | `src/content/assets.ts` | 主视觉、八件物证、五枚夜印、五张明信片与五张植物学标本的 manifest 和解析函数 |

## 状态模型

主要阶段为 `day → ready → night → morning → ending`。章节结算只通过 `resolveNight` 产生，不由生成模型决定。Zustand 使用 `night-shift-save-v1` 保存到浏览器 `localStorage`，当前持久化结构版本为 5；迁移会为旧存档补齐睡眠模式、会话、夜印、随身物历史、方向历史与温室成长记录。

睡眠质量为 `interrupted`、`regular`、`restful`：三者都至少解锁一条主线线索；差异只体现在路线长度、收藏数量、回声事件和环境观察。`selectedPreparationId` 记录当前随身物，`preparationHistory` 按章节保存已经归来的准备；`selectedChoice` 记录当前方向，`choiceHistory` 按章节保存路线履历。方向决定四个路线节点、五段夜间事件、城市遭遇与归来来信，但同章节三个方向的线索和藏品结果保持一致。完成一夜后，章节编号会加入持久化的 `nightSealIds` 与 `completedReports`，旅程册据此解锁明信片与路线履历。

`sleepMode` 区分 12 秒压缩演示和真实夜班。开始交接时创建包含 `startedAt` 的 `activeSleepSession`；真实模式不依赖后台定时器，而是在重开页面后由开始时间与当前时间重新计算进度。玩家醒来结束会话时写入 `endedAt`、实际分钟数和按阈值派生的质量，并把会话保存为 `lastSleepSession` 供晨报读取。少于 5 小时为断续，5 小时至不足 7 小时为普通，7 小时及以上为安稳；任一结果都推进主线。

植物阶段由同一持久化进度推导：`0–<25%` 种核、`25–<50%` 抽芽、`50–<85%` 展叶、`85–100%` 开花。页面关闭期间无需运行后台计时器，重开后会根据会话时间直接恢复对应阶段。完成夜班时写入 `growthHistory` 快照，包含章节、时长、质量、方向、随身物与完成时间；断续睡眠也保存完整植株，只使用较紧凑的视觉层级。v5 迁移会为旧存档中已经完成的报告建立普通层级标本，避免历史成果丢失。

## 内容边界

生成式能力只用于视觉资产或未来对固定报告事实的文字润色。伊芙琳是否活着、人物动机、线索存在性、核心因果与结局条件必须来自确定性内容，详见 [[docs/story-bible]]。

案件板只接受 `src/content/relations.ts` 中定义的无序证物对。玩家选中两件已解锁证物后，`connectClues` 才能写入对应的 `confirmedRelations`；错误配对不会改变存档。已确认关系会生成持久连线，并继续作为真结局条件的一部分。

真结局资格由 `canUnlockTrueEnding` 统一判断，界面锁定与存档动作共用同一规则；因此不能通过绕开按钮直接写入未满足条件的真结局。旧存档迁移由可独立测试的 `migrateGameState` 提供。

调查方向必须来自当前章节的三个 choice ID。空值只用于兼容旧夜班并确定性回退到第一条方向；非空非法 ID 会被拒绝。内容测试遍历全部十五条分支，证明同章节、同睡眠质量下的固定线索与收藏不随方向改变。

## 交互基线与组件边界

0003 开工时冻结以下行为：Demo 仍可在 12 秒内完成一夜；三种睡眠都推进固定主线；随身物只改变环境回响；晨报、夜印和收藏结果保持兼容。

当前组件按以下功能边界拆分：

- `app/page.tsx`：阶段与视图编排，不拥有章节结算或功能域展示细节。
- `landing.tsx`：落地页与开场，不读取游戏结算规则。
- `night-cycle.tsx`：调查方向、随身物、Demo／真实模式、夜印显影、归来明信片和晨报。
- `investigation.tsx`：案件板、明信片旅程册、夜印收藏、物证档案和三结局。
- `shell.tsx`：跨视图导航与 Demo 控制台。
- `shared.tsx`：跨功能域复用的纸张、印章和路线视觉原语。

会话模型位于 `src/lib/game-engine`，跨页恢复依赖持久化时间戳而非组件生命周期。`app/page.tsx` 只保留顶层状态与视图编排，后续案件板和等待循环可以在各自功能域内独立演进。

## 相关文档

- [[docs/product-overview]]
- [[docs/decision-log]]
- [[docs/quality-baseline]]
- [[plans/0001-hackathon-mvp]]
