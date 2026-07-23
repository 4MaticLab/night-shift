# 架构概览

## 运行形态

项目使用 Next App Router、React 与 TypeScript，并保留两套明确的生产目标：默认 `next build` 生成 Vercel 使用的 `.next/`；`build:sites` 通过 Vinext、Vite 与 Cloudflare 插件生成 Sites/Worker 使用的 `dist/`。当前黑客松版本把游戏页面组织成一个客户端状态机，以减少现场演示中的切页等待；两套目标都由服务端渲染首屏元数据和外壳。

原生 Next 构建的 TypeScript 范围排除 `build/`、`db/`、`examples/`、`worker/` 与 `vite.config.ts`：这些文件只属于 Sites 脚手架、Cloudflare 绑定或未启用的 D1 示例，不被产品应用导入。它们仍由 Vinext/Vite 实际构建和 ESLint 检查，不能把 Cloudflare Worker 模块混入 Vercel 的 Node 运行时。

## 关键模块

| 模块 | 位置 | 职责 |
|---|---|---|
| 案件内容 | `src/content/case.ts` | 五夜章节、12 条线索、8 件藏品与固定报告文本 |
| 随身物内容 | `src/content/preparations.ts` | 三件准备物、五夜各自的确定性环境回响 |
| 归来明信片 | `src/content/postcards.ts` | 五夜地点、城市传闻、背面短笺与三种随身物附言 |
| 调查方向 | `src/content/routes.ts` | 五夜十五条确定性路线、夜间事件、城市遭遇与归来来信 |
| 夜生植物 | `src/content/botany.ts` | 五株植物、四阶段成长文案、睡眠层级说明与进度阶段推导 |
| 城市社团 | `src/content/societies.ts` | 三个社团、三层称呼与来函、跨夜关注累计和关系快照 |
| 城市问函 | `src/content/correspondence.ts` | 九个问函、十八种答复、三类总体姿态与最近答复回响 |
| 口袋纪念物 | `src/content/souvenirs.ts` | 九件小物、稳定哈希、方向与随身物亲和、无重复结算 |
| 机会告示 | `src/content/opportunities.ts` | 十二张午后短章、两种答复、稳定三张候选与未来回响 |
| 案件人物 | `src/content/characters.ts` | 四位见证人的章节映射、公共传闻、已知事实与证物揭示条件 |
| 城市地区 | `src/content/districts.ts` | 三个城区的首次章节、公共说法、生活规矩与固定地标 |
| 城市时辰 | `src/content/watches.ts` | 四个本地时段、五夜二十条场景／偶遇／短笺与时段边界推导 |
| 睡隙回声 | `src/content/wake-echoes.ts` | 五夜各一条声音、掠影与短笺，以及确定性回声记录创建 |
| 结局终函 | `src/content/endings.ts` | 三种结局的独立结果、林渡终函、档案标签与结案语 |
| 证物关系 | `src/content/relations.ts` | 三条核心推论、对应证物对与成功解释 |
| 好友线索链接 | `src/lib/game-engine/clue-sharing.ts` | 白名单线索查询、深链接生成与 query 清理 |
| 内容契约 | `src/lib/game-engine/schema.ts` | Zod schema、引用与数量约束 |
| 夜间结算 | `src/lib/game-engine/resolve-night.ts` | 根据章节、睡眠质量、随身物与调查方向选择确定性结果 |
| 睡眠会话 | `src/lib/game-engine/sleep-session.ts` | 创建、恢复和结束 Demo／真实夜班，按时长生成质量与夜印进度 |
| 结局资格 | `src/lib/game-engine/ending.ts` | 三结局白名单与真结局的线索、藏品、关系门槛 |
| 游戏存档 | `src/stores/game-store.ts` | Zustand 状态、阶段转换与浏览器持久化 |
| 产品外壳 | `app/page.tsx` | 阶段判断、视图编排、Demo 抽屉开关与顶层导航 |
| 落地叙事 | `src/components/game/landing.tsx` | 首页主视觉与三幕开场 |
| 夜间循环 | `src/components/game/night-cycle.tsx` | 睡前准备、夜班会话、晨报与空晨报状态 |
| 调查与归档 | `src/components/game/investigation.tsx` | 案件板、收藏柜、档案与结局 |
| 好友线索界面 | `src/components/game/clue-sharing.tsx` | 二维码、复制链接与接收反馈 |
| 游戏框架 | `src/components/game/shell.tsx` | 顶栏、底部导航与 Demo 控制台 |
| 共享游戏 UI | `src/components/game/shared.tsx` | 纸卡、印章、城市路线与睡眠文案 |
| 视觉系统 | `app/globals.css` | 色板、纸张、地图、雨雾、响应式与动效 |
| 资产清单 | `src/content/assets.ts` | 四幕页头／结局画面、物证、夜印、明信片、植物、社团纹章、纪念物、人物与地区的 manifest 和解析函数 |

## 状态模型

主要阶段为 `day → ready → night → morning → ending`。章节结算只通过确定性内容函数产生，不由生成模型决定。Zustand 使用 `night-shift-save-v1` 保存到浏览器 `localStorage`，当前持久化结构版本为 13；迁移会为旧存档补齐睡眠模式、会话、夜印、随身物历史、方向历史、温室成长记录、城市关系历史、问函答复历史、口袋纪念物、机会告示历史、案件板坐标、城市时辰、可选睡隙快照与好友送达线索 ID。

睡眠质量为 `interrupted`、`regular`、`restful`：三者都至少解锁一条主线线索；差异只体现在路线长度、收藏数量、回声事件和环境观察。`selectedPreparationId` 记录当前随身物，`preparationHistory` 按章节保存已经归来的准备；`selectedChoice` 记录当前方向，`choiceHistory` 按章节保存路线履历。方向决定四个路线节点、五段夜间事件、城市遭遇与归来来信，但同章节三个方向的线索和藏品结果保持一致。完成一夜后，章节编号会加入持久化的 `nightSealIds` 与 `completedReports`，旅程册据此解锁明信片与路线履历。

`sleepMode` 区分 12 秒压缩演示和真实夜班。开始交接时创建包含 `startedAt` 与 `watchId` 的 `activeSleepSession`；Demo 始终保存 `midnight`，真实模式按浏览器本地小时冻结掌灯（19:00–22:59）、夜半（23:00–01:59）、末更（02:00–05:59）或白昼小憩（06:00–18:59）。真实模式不依赖后台定时器，而是在重开页面后由开始时间与当前时间重新计算进度；刷新不会因当前时刻改变已经冻结的城市时辰。真实夜班的 `recordWakeEcho` 只在活动会话尚无 `wakeEcho` 时写入一次章节回声和本地时间，不改变 phase；Demo 只为 `interrupted` 质量预置一条确定性回声。玩家最终结束会话时写入 `endedAt`、实际分钟数和按阈值派生的质量，并把会话保存为 `lastSleepSession` 供晨报读取。少于 5 小时为断续，5 小时至不足 7 小时为普通，7 小时及以上为安稳；任一结果都推进主线。

植物阶段由同一持久化进度推导：`0–<25%` 种核、`25–<50%` 抽芽、`50–<85%` 展叶、`85–100%` 开花。页面关闭期间无需运行后台计时器，重开后会根据会话时间直接恢复对应阶段。完成夜班时写入 `growthHistory` 快照，包含章节、时长、质量、方向、随身物、城市时辰、可选睡隙回声 ID 与完成时间；断续睡眠也保存完整植株，只使用较紧凑的视觉层级。v5 迁移会为旧存档中已经完成的报告建立普通层级标本，v11 再为旧会话与温室记录补齐安全时辰；v12 校验可选回声记录，旧档没有回声时保留为空白而不伪造醒转。

每条 `RouteDirection` 只映射一个 `societyId` 和一条可解释的 `societyNotice`。完成夜班时，`societyHistory` 按章节保存社团、方向、完成时间与当时称呼层级；同一社团第一次、第二次、第三次及以后被触及时，依次使用 `noticed`、`known`、`entrusted`。层级只选择称呼与来函，不参与线索、藏品、植物、睡眠质量或结局判断。v6 迁移按已完成章节顺序读取 `choiceHistory`，从旧路线确定性重建同一关系历史。

每个社团层级对应一个固定问函和两种答复。`answerCorrespondence` 只在当前章节存在社团记录、答复 ID 属于对应问函且本夜尚未答复时，才向 `correspondenceHistory` 写入章节、社团、层级、答复与三类姿态快照；未答复的章节不写记录，也不阻断 `continueDay`。后续来信通过 `getLatestSocietyReply` 只检索同一社团、当前章节之前最近一次已答问函。v7 迁移不会为 v6 玩家伪造历史答复；Demo 章节跳转则生成明确、确定性的第一选项履历，方便演示后续回响。

`journeySeed` 在新存档第一次开始夜班时只生成一次：Demo 使用固定值，真实夜班使用本地随机值。`selectSouvenir` 先排除 `souvenirHistory` 已出现的物件，再用种子、章节、方向、随身物与物件 ID 的稳定哈希排序；同社团方向和同随身物亲和只影响排序，不改变主线奖励。首次结算把结果与当夜路线、准备、种子和时间写成快照，此后重复结算直接返回原记录。v8 迁移使用固定旧档种子，按已完成章节顺序重建，确保五夜不重复且刷新不重抽。

第一夜归来后的四个白天各由 `getOpportunityCandidates` 从十二张告示中稳定取三张，并排除 `opportunityHistory` 里所有曾展示的 ID。选择一张会保存对应答复，全部收起则只保存三张展示记录；两种方式都不会重抽或阻断调查。下一份晨报读取同章节记录显示一句回响，收藏页剪报册保存结果。v9 迁移不替旧档伪造白天选择，Demo 跳章才生成明确的第一选项演示履历。

## 内容边界

生成式能力只用于视觉资产或未来对固定报告事实的文字润色。伊芙琳是否活着、人物动机、线索存在性、核心因果与结局条件必须来自确定性内容，详见 [[docs/story-bible]]。

案件板只接受 `src/content/relations.ts` 中定义的无序证物对。玩家点击已解锁证物时同时展开完整详情、城市异议与林渡页边批注，并把它放入联合推理台的 A／B 槽；推理台常驻显示“选第一件—选第二件—核对证词”，选满后点击第三件不会静默替换，必须先明确移除其中一件。`connectClues` 只会为合法配对写入 `confirmedRelations`，错误配对不改变存档。已确认关系会生成持久连线，并在参与作证的证物侧页回响，继续作为真结局条件的一部分。

React Flow 使用本地受控节点承接拖动过程，只在桌面端从图钉拖动结束时把最终坐标写入 `boardPositions`，避免逐帧写入浏览器存储；v10 迁移会过滤非有限坐标并为旧档建立空坐标表。“恢复摆放”同时清空持久坐标和当前画布位置。600 px 及以下关闭节点拖动、画布平移、滚轮／双击／捏合缩放，并把画布触摸动作声明为纵向滚动，保证手势可以离开案件板。

城市时辰是只读叙事分支。`getCityWatchEcho(chapter, watchId)` 为五夜的每个时辰返回固定场景、匿名偶遇与林渡短笺；夜行、晨报、收藏履历和结案总账只读取快照，不把时辰传入 `resolveNight` 或任何结局判断，因此交接时间不会成为隐形评分或奖励倍率。

睡隙回声同样是只读叙事分支。每章只有一个固定 `WakeEcho`；真实会话最多记录一次，Demo 只有断续预设会形成回声。`wakeEcho` 与 `wakeEchoId` 不进入 `resolveNight`、质量派生、植物进度、社团层级或结局判断；没有醒转的历史会在睡隙回声簿中显示为完整空白，而不是待补收集项。

案件板由常驻联合推理台、明确尺寸的证物画布和证物侧页组成：桌面端侧页叠放在画布右侧，390 px 手机端则顺序排列到画布下方。推理动作始终在画布上方完成，侧页只负责阅档和展示已确认推论；这样玩家无需在长档案末尾寻找提交按钮，React Flow 也不会拦截移动页面滚动。

好友线索使用 `?clue=<稳定线索 ID>` 的 local-first 深链接。分享端只从案件内容白名单生成链接和二维码；接收端在 hydration 后重新查同一白名单，合法 ID 才能经 `receiveSharedClue` 写入 `unlockedClueIds` 与 `receivedClueIds`，随后立即从地址栏移除该 query，未知 ID 不创建存档。重复链接保持幂等，不传送其他进度，也不会确认关系或推进章节。赠送线索可参与普通阅档与联合推理，但真结局只计算非 `receivedClueIds` 的亲自取得线索；玩家后来完成对应夜班时，该 ID 会从好友来源表移除，转为亲自取得。

真结局资格由 `canUnlockTrueEnding` 统一判断，界面锁定与存档动作共用同一规则；因此不能通过绕开按钮直接写入未满足条件的真结局。旧存档迁移由可独立测试的 `migrateGameState` 提供。

调查方向必须来自当前章节的三个 choice ID。空值只用于兼容旧夜班并确定性回退到第一条方向；非空非法 ID 会被拒绝。内容测试遍历全部十五条分支，证明同章节、同睡眠质量下的固定线索与收藏不随方向改变。

社团关注同样属于确定性旁支：十五条方向均有且只有一个主要社团，三个社团各覆盖五条。界面在交接前只提示“可能惊动谁”，不展示累计数字或兑换表；晨报和城市人情簿展示称呼、礼数与路线履历，不提供可刷取的声望货币。

问函答复不参与 `resolveNight`、`canUnlockTrueEnding` 或 `canChooseEnding`。三类总体姿态只在结局完成后选择一段城市附言；没有答复时使用独立的“未寄出的答复”附言，因此沉默同样不是失败状态。

纪念物同样不参与 `resolveNight` 固定线索、植物成长、社团层级、问函姿态、睡眠质量或任何结局资格；它们没有稀有度、价值、货币、重复碎片或可见掉落表。

机会告示没有行动点、日历登录、抽取按钮或奖励差。`resolveOpportunity` 与 `dismissOpportunities` 只写独立历史，不进入夜间结算、社团层级或结局判断。

人物档案同样是确定性内容视图：第 2–5 夜晨报各映射一位人物；档案页只用 `completedReports` 判断是否见过，用既有 `unlockedClueIds` 判断保留意见是否展开。人物模块不写存档，不进入 `resolveNight`、睡眠质量、奖励或结局判断。

分区志只用 `completedReports` 判断地区是否已经被走过：第 1、3、4 夜分别展开灯港区、旧子午区与玻璃丘。地区内容不写存档，不替换路线图，也不进入任何结算或资格判断。

结案卷宗同样是只读投影，不增加新的持久化结构：它按 `completedReports` 排列五夜，再从 `choiceHistory`、`preparationHistory`、`growthHistory` 与 `souvenirHistory` 读取当夜真实履历；核心物证只过滤 `unlockedCollectibleIds`。三封终函由 `src/content/endings.ts` 的 schema 校验内容选择，城市附言仍独立取自问函总体姿态。“重看档案”只切换结局页内的本地视图，不清除 `endingId`；只有“重新调查”调用既有重置动作。

## 交互基线与组件边界

0003 开工时冻结以下行为：Demo 仍可在 12 秒内完成一夜；三种睡眠都推进固定主线；随身物只改变环境回响；晨报、夜印和收藏结果保持兼容。

当前组件按以下功能边界拆分：

- `app/page.tsx`：阶段与视图编排，并统一承担视图切换／重复点击导航时的页面回顶；不拥有章节结算或功能域展示细节。
- `landing.tsx`：落地页与开场，不读取游戏结算规则。
- `night-cycle.tsx`：调查方向、随身物、林渡交接肖像与交接单、Demo／真实模式、夜印显影、归来明信片和晨报。
- `investigation.tsx`：案件板、明信片旅程册、夜印收藏、物证档案、三结局与五夜结案卷宗。
- `clue-sharing.tsx`：单条证物二维码、复制链接与接收结果提示；不拥有存档校验规则。
- `shell.tsx`：跨视图导航与 Demo 控制台。
- `shared.tsx`：跨功能域复用的纸张、印章和路线视觉原语。

会话模型位于 `src/lib/game-engine`，跨页恢复依赖持久化时间戳而非组件生命周期。`app/page.tsx` 只保留顶层状态与视图编排，后续案件板和等待循环可以在各自功能域内独立演进。

桌面交接页是唯一采用“稳定场景栏 + 独立计划滚动区 + 固定主操作”的应用内视图；900 px 以下恢复普通文档流。固定底部导航不拥有各页面滚动状态，所有跨视图回顶仍由 `app/page.tsx` 统一保证。

## 相关文档

- [[docs/product-overview]]
- [[docs/decision-log]]
- [[docs/quality-baseline]]
- [[plans/0001-hackathon-mvp]]
