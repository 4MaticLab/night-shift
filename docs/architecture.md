# 架构概览

## 运行形态

项目使用 Next App Router、React 与 TypeScript，并保留两套明确的生产目标：默认 `next build` 生成 Vercel 使用的 `.next/`；`build:sites` 通过 Vinext、Vite 与 Cloudflare 插件生成 Sites/Worker 使用的 `dist/`。URL 负责表达案件书架、序章和游戏页面位置，Zustand 状态机继续独占案件进度与 `day → ready → night → morning → ending` 转换；案件书架选择编译期注册的 `CampaignManifest`，两套目标都由服务端渲染首屏元数据和当前路由外壳。

原生 Next 构建的 TypeScript 范围排除 `build/`、`db/`、`examples/`、`worker/` 与 `vite.config.ts`：这些文件只属于 Sites 脚手架、Cloudflare 绑定或未启用的 D1 示例，不被产品应用导入。它们仍由 Vinext/Vite 实际构建和 ESLint 检查，不能把 Cloudflare Worker 模块混入 Vercel 的 Node 运行时。

## 关键模块

| 模块 | 位置 | 职责 |
|---|---|---|
| 案件包契约 | `src/content/campaigns/types.ts` | `CampaignManifest`、引用完整性校验与案件内容查询 |
| 案件序章 | `src/components/game/case-prologue.tsx` | 首次开案的三幕案件导入、返回与接案动作 |
| 案件注册表 | `src/content/campaigns/registry.ts` | 当前五案、默认案件和合法 `campaignId` 白名单 |
| 首案内容包 | `src/content/campaigns/last-tram.ts` | 组合既有首案模块与视觉／结局规则 |
| 本地化核心 | `src/i18n/core.ts`、`src/i18n/server.ts`、`src/i18n/request-locale-provider.tsx`、`src/i18n/provider.tsx` | Cookie／请求语言协商、案件能力回退、递归内容投影和界面翻译上下文 |
| 首案英文目录 | `src/i18n/en-catalog.ts`、`src/i18n/en-overrides.ts` | 首案完整英文覆盖与关键文学文本人工润色 |
| 第二案内容包 | `src/content/campaigns/rain-radio.ts` | 《只在雨中播出的电台》的五夜完整内容 |
| 第三案内容包 | `src/content/campaigns/thirteenth-loaf.ts` | 《黎明前出炉的第十三个面包》的五夜完整内容 |
| 第三案视觉包 | `src/content/thirteenth-loaf-assets.ts` | 第三案 34 张专属横幅、夜印、明信片、植物、收藏、人物与城区资产 |
| 第四案内容包 | `src/content/campaigns/chihaya-noa.ts` | 《千早诺亚的第十三次旅行》的五夜完整内容 |
| 第四案视觉包 | `src/content/chihaya-noa-assets.ts` | 第四案 34 张专属横幅、夜印、明信片、植物、收藏、人物与城区资产 |
| 第五案内容包 | `src/content/campaigns/fog-without-wolves.ts` | 《雾中无狼》的五夜完整内容与五条分层推论 |
| 第五案视觉包 | `src/content/fog-without-wolves-assets.ts` | 第五案 34 张专属横幅、夜印、明信片、植物、收藏、人物与城区资产 |
| 首案核心内容 | `src/content/case.ts` | 首案五夜章节、12 条线索、8 件藏品与固定报告文本 |
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
| 推论配方 | `src/content/relations.ts` | 三条核心推论、输入证物与成功解释 |
| 好友线索链接 | `src/lib/game-engine/clue-sharing.ts` | 白名单线索查询、深链接生成与 query 清理 |
| Injective 藏品契约 | `contracts/NightShiftKeepsake.sol`、`src/lib/injective/keepsake.ts` | ERC-721、EIP-712 voucher、规范元数据、网络与 ABI |
| Injective 授权 API | `app/api/injective/mint-authorization/`、`src/lib/injective/server.ts` | 服务端签名、白名单、同源、大小、幂等与限流降级 |
| Injective 藏品界面 | `src/components/game/injective-mint.tsx`、`src/lib/injective/client.ts` | 钱包切链、前端 redeem、交易确认与本地回执 |
| 夜班密文内容 | `src/content/ciphers.ts` | 按案件注册的确定性关卡、开放条件、答案归一化、提示与回执 |
| 内容契约 | `src/lib/game-engine/schema.ts` | Zod schema、引用与数量约束 |
| 夜间结算 | `src/lib/game-engine/resolve-night.ts` | 根据章节、睡眠质量、随身物与调查方向选择确定性结果 |
| 睡眠会话 | `src/lib/game-engine/sleep-session.ts` | 创建、恢复和结束 Demo／真实夜班，按时长生成质量与夜印进度 |
| 睡眠硬件契约 | `src/lib/sleep-hardware/` | 厂商无关设备／权限模型、确定性虚拟信号和本地摘要 |
| 睡眠硬件存档 | `src/stores/sleep-hardware-store.ts` | 可撤销授权、活动采集和最近 8 条本地摘要 |
| 睡眠硬件界面 | `src/components/game/sleep-hardware.tsx` | 硬件中心、交接状态、夜间遥测和晨报回执 |
| 空间外设契约 | `src/lib/ambient-hardware/` | Home Assistant 白名单实体、语义 cue、桥协议和浏览器客户端 |
| 空间外设 Connector | `apps/connector/` | loopback 设置页、Home Assistant 配置／发现、桥生命周期与无终端入口 |
| 空间外设桥 | `tools/home-assistant-bridge/` | loopback HTTP、显式配对、mDNS、Home Assistant WebSocket、状态订阅和受限 service 翻译 |
| 空间外设存档／协调 | `src/stores/ambient-hardware-store.ts`、`src/components/game/ambient-hardware-coordinator.tsx` | 只持久化启用与绑定，在阶段边界非阻塞发送幂等 cue |
| 放下纸条契约 | `src/lib/rest-ritual.ts` | 纸条／回信校验、确定性本地回信与最小模型请求契约 |
| AI 晨间回信 | `app/api/rest-reflection/` | 部署访问码、签名 HttpOnly 授权、持久化配额、OpenAI-compatible 受限风格选择与本地回退 |
| AI 服务端护栏 | `src/lib/server-ai-guard.ts` | Redis 跨实例访问限流、会话额度、部署预算、请求幂等与流式大小限制 |
| 推论合成 | `src/lib/game-engine/evidence-synthesis.ts` | 证物库存、就绪配方、统一档案投影与依赖图校验 |
| 结局资格 | `src/lib/game-engine/ending.ts` | 三结局白名单与真结局的线索、藏品、推论门槛 |
| 游戏存档 | `src/stores/game-store.ts` | Zustand 状态、阶段转换与浏览器持久化 |
| 路由契约 | `src/lib/game-routes.ts` | 稳定页面路径、阶段恢复目标与水合后路径规范化 |
| 产品运行时 | `src/components/game/app-runtime.tsx` | 案件本地化、首次加载、好友线索入口、全局弹层与阶段路由守卫 |
| 游戏路由外壳 | `src/components/game/game-layout.tsx`、`app/(night-shift)/game/` | 顶栏、底部链接导航、路由级页面与沉浸式夜班／结局边界 |
| 案件书架／序章路由 | `app/(night-shift)/page.tsx`、`app/(night-shift)/case-intro/page.tsx` | 案件选择、恢复入口与首次接案 |
| 落地叙事 | `src/components/game/landing.tsx` | 首页主视觉与案件书架 |
| 夜间循环 | `src/components/game/night-cycle.tsx` | 睡前准备、夜班会话、晨报与空晨报状态 |
| 调查与归档 | `src/components/game/investigation.tsx` | 案件板、收藏柜、档案与结局 |
| 证物信笺 | `src/components/game/evidence-letters.tsx` | 完整证物档案与核对成功后的推论揭示 |
| 好友线索界面 | `src/components/game/clue-sharing.tsx` | 二维码、复制链接与接收反馈 |
| 夜班密文台 | `src/components/game/cipher-desk.tsx` | 逐段开放、答案输入、无惩罚提示与已解密回执 |
| 游戏框架 | `src/components/game/shell.tsx` | 顶栏、底部导航与 Demo 控制台 |
| 共享游戏 UI | `src/components/game/shared.tsx` | 纸卡、印章、城市路线与睡眠文案 |
| 视觉系统 | `app/globals.css` | 色板、纸张、地图、雨雾、响应式与动效 |
| 全局背景音乐 | `src/components/background-music.tsx` | 根布局单实例音频、自动播放重试、可见性暂停与本地关闭偏好 |

收藏页把内容映射为五个显示组：核心物证、夜班归来、城市回声、夜兆牌桌与口袋小物。前四类案件成果只读取既有 game store；夜兆使用完全独立的 `night-shift-tarot-v1` 本地存档，按案件与本地自然日保存一张文学旁注，绝不写回游戏进度。CSS `order` 让核心物证在桌面连续长卷中位于首位；900 px 以下只显示当前 `activeCollectionCategory` 对应的 section。分类状态不持久化、不参与解锁或结局，夜兆边界见 [[docs/tarot-night-omens]]。

Demo、睡眠硬件、好友线索、Injective、证物信笺和推论信笺共用 `src/lib/use-accessible-dialog.ts`：挂载时记录触发焦点、锁定 Body 滚动，并沿弹层到 `body` 的祖先链把旁支节点设为 `inert` 与 `aria-hidden`；Tab 在当前对话框的可见可聚焦元素中循环，Escape 关闭；卸载时精确恢复原属性、滚动和焦点。弹层根节点使用 `data-dialog-layer`，确保遮罩仍可关闭，同时背景不能被指针或键盘访问。

全局背景音乐挂在根布局，案件库、序章、游戏和海报共享同一个 `<audio>`，站内路由不重建曲目。它读取独立布尔偏好 `night-shift-bgm-enabled-v1`，不进入 game store；默认立即尝试有声播放，浏览器策略拒绝时只在下一次可信交互中重试。标签页隐藏时暂停，音频缺失或解码失败只改变右上角控制器状态，不阻断任何页面。固定曲目路径和浏览器边界见 [[docs/background-music]]。

打开 Demo 控制台不再调用 `begin()`。`DemoDrawer` 只在玩家确认具体操作后调用现有 `jumpToChapter`、`unlockBoard` 或 `reset`；“完整案件板”确认路径先显式 `begin()`，其余章节快照由游戏 store 自身标记开始。确认层只解释并约束 UI 写入时机，不改变这些 store action 的确定性结果与案件隔离。
| 资产清单 | `src/content/assets.ts` | 四幕页头／结局画面、物证、夜印、明信片、植物、社团纹章、纪念物、人物与地区的 manifest 和解析函数 |

## 状态模型

`AppBootBoundary` 在应用首次进入时把真实产品内容标记为 `inert`，避免半水合页面被误点；它等待 `window.load` 与 `document.fonts.ready`，首页主视觉则由 Next Image 的单一 preload 路径负责。加载幕至少保留 700 ms 以避免冷暖缓存之间闪烁，最迟 7 秒主动放行。它位于 `(night-shift)` 共享 layout 内，客户端路由切换和案件切换都不会重复播放整页加载幕。游戏页面由 App Router 自身拆分，`game/loading.tsx` 为尚未到达的页面提供轻量局部反馈；硬件面板继续按需加载。

主要阶段为 `day → ready → night → morning → ending`。章节结算只通过当前案件 manifest 的确定性内容函数产生，不由生成模型决定。Zustand 使用 `night-shift-save-v1` 保存到浏览器 `localStorage`，当前持久化结构版本为 18。`campaignId` 标识活动案件，活动进度仍保持扁平供组件读取；切换时先把它快照到 `campaignSaves[campaignId]`，再恢复目标案件或创建新档。章节、线索、已合成推论、密文解答、结局、夜间历史和放下纸条因此按案隔离。v18 将旧二元关系与画布坐标替换为推论库存；`persist.migrate` 对任何低于 18 的版本直接返回首案新档，不保留旧进度。同版本读取仍按当前 manifest 白名单修复非法案件与内容 ID。

稳定页面路径为 `/` 案件书架、`/case-intro` 案件序章、`/game/tonight` 今晚、`/game/report` 今晨、`/game/board` 案件板、`/game/collection` 收藏、`/game/archive` 档案、`/game/night` 夜班运行与 `/game/ending` 结局。路径不保存 `campaignId`、章节或结算数据。共享运行时等待浏览器存档水合后调用纯函数守卫：未开案的游戏页回到书架，活动夜班强制停留 `/game/night`，结局中的游戏页强制进入 `/game/ending`，清晨访问今晚则回到当前晨报。普通底部链接写入浏览器历史；开始／结束夜班和进入结局使用 replace，避免历史记录出现已经失效的强制阶段。案件库在结局后保持可访问，以便切换案件。

「今晨」不再把 `phase === morning` 当作晨报存在性的唯一来源。页面从 `completedReports` 选择最新合法章节，并把该章节显式传给 `MorningReport`；组件再从 `choiceHistory`、`preparationHistory`、`growthHistory`、`societyHistory`、`correspondenceHistory`、`souvenirHistory`、`opportunityHistory` 与 `restRitualHistory` 读取同一夜快照。方向、准备物、质量、时长、时辰和睡隙优先取同一份 `growthHistory`；只有 `endedAt`、质量与时辰均匹配时才允许全局 `lastSleepSession` 补充实际会话和硬件回执，避免跨章混读。去案件板只切换视图并保持 `morning`，明确结束当日才调用 `continueDay()`；进入 `day／ready` 后仍可严格只读地重放最新晨报，未寄出的问函也不能在日期结束后补答。该模型不增加存档字段或版本，也不会再次调用任何结算写入。

语言协商在服务端首帧前完成：合法的 `night-shift-locale` 偏好 Cookie 优先，其次按质量权重读取请求 `Accept-Language` 中第一个受支持的 `en-*` 或 `zh-*`，最后回退 `zh-CN`。根布局把同一结果写入 `<html lang>` 并通过 `RequestLocaleProvider` 交给加载幕与 `I18nProvider`，因此英文浏览器不会先看到中文首帧。自动检测本身不建立 Cookie；只有用户手动选择或迁移既有 `localStorage` 偏好时，才写入一年期、`SameSite=Lax` 的同名 Cookie。手动选择同时保留 `localStorage` 用于跨标签同步，优先级仍以 Cookie 为准；语言偏好不进入任一游戏 store、存档版本或结算函数。

`I18nProvider` 根据当前案件把偏好解析为有效展示语言：`case-001` 与 `case-002` 支持 `zh-CN` 与 `en`，未翻译案件明确回退中文；切回已翻译案件后继续使用原偏好。英文模式只递归投影 manifest 的字符串值，稳定 ID、引用、数字、规则和存档键保持原样，因此切换语言或刷新不会复制、重置或迁移游戏进度。案件级英文词典按案拆分在 `src/i18n/campaigns/` 下，与遗留总表和覆写表在 `src/i18n/en.ts` 合并。

案件 manifest 同时提供章节数、线索数、藏品数、真结局门槛、档案标题和逐夜视觉。`resolveNight`、关系匹配、结局资格、迁移过滤和页面投影都显式接收当前 manifest；通用模块不按具体案件 ID 写业务分支。`defineCampaign` 要求案件恰好五夜、章节从 1 连续排列、每个 choice 有路线、每夜拥有明信片／植物／四时辰回声／睡隙回声／夜印，并拒绝跨案件线索引用和不可达门槛。

新案件第一次从书架打开时，`/case-intro` 显示 manifest 提供的三幕 `CampaignPrologue`，再在玩家明确接案后调用 `begin()` 并 replace 到 `/game/tonight`。序章只拥有当前幕这一项组件内展示状态，不写存档，也不改变章节、路线或结算；玩家返回书架不会误开案件。已有 `started` 存档从书架按持久化阶段恢复到今晚、今晨、夜班或结局；重置本案后才会再次看见序章。由此所有案件共享“案件库 → 案件导入 → 今夜交接 → 等待 → 晨报”的首夜生命周期，同时保留各案自己的文字与美术。

睡眠质量为 `interrupted`、`regular`、`restful`：三者都至少解锁一条主线线索；差异只体现在路线长度、收藏数量、回声事件和环境观察。`selectedPreparationId` 记录当前随身物，`preparationHistory` 按章节保存已经归来的准备；`selectedChoice` 记录当前方向，`choiceHistory` 按章节保存路线履历。方向决定四个路线节点、五段夜间事件、城市遭遇与归来来信，但同章节三个方向的线索和藏品结果保持一致。完成一夜后，章节编号会加入持久化的 `nightSealIds` 与 `completedReports`，旅程册据此解锁明信片与路线履历。

`sleepMode` 区分 12 秒压缩演示和真实夜班。开始交接时创建包含 `startedAt` 与 `watchId` 的 `activeSleepSession`；Demo 始终保存 `midnight`，真实模式按浏览器本地小时冻结掌灯（19:00–22:59）、夜半（23:00–01:59）、末更（02:00–05:59）或白昼小憩（06:00–18:59）。真实模式不依赖后台定时器，而是在重开页面后由开始时间与当前时间重新计算进度；刷新不会因当前时刻改变已经冻结的城市时辰。真实夜班的 `recordWakeEcho` 只在活动会话尚无 `wakeEcho` 时写入一次章节回声和本地时间，不改变 phase；Demo 只为 `interrupted` 质量预置一条确定性回声。玩家最终结束会话时写入 `endedAt`、实际分钟数和按阈值派生的质量，并把会话保存为 `lastSleepSession` 供晨报读取。少于 5 小时为断续，5 小时至不足 7 小时为普通，7 小时及以上为安稳；任一结果都推进主线。

睡眠硬件使用第三份独立存档 `night-shift-sleep-hardware-v1`。游戏存档只在 `SleepSession` 边界通知硬件域开始／结束采集，不保存任何硬件字段。只有经过本地授权的虚拟设备能创建活动采集；真实厂商桥接入口保持预演状态。虚拟模拟器从会话与设备 ID 确定性生成摘要，运行时变化不持久化，晨报最多保留最近 8 条摘要。设备撤销或切换会终止采集但不结束剧情会话，详见 [[docs/sleep-hardware-bridge]]。

Home Assistant 使用第四份独立存档 `night-shift-ambient-hardware-v1`，只保存启用状态与三项实体 ID 绑定。`AmbientHardwareCoordinator` 观察既有 `phase`、`activeSleepSession` 与 `lastSleepSession`，生成包含案件、章节、会话和 cue 的稳定请求 ID；它不写 game store，也不等待桥响应。Connector 设置页位于 `127.0.0.1:43118`，桥位于 `127.0.0.1:43117`；前者持有进程内 `HA_TOKEN` 并管理后者，后者持有短期配对摘要、实体投影、动作白名单与临时恢复快照。Vercel 浏览器通过 Chrome Local Network Access 和 `targetAddressSpace: loopback` 访问固定桥地址，但没有 mDNS、任意局域网枚举或任意 Home Assistant service 能力。桥离线只改变外设 store 的连接状态，详见 [[docs/home-assistant-ambient-bridge]]。

植物阶段由同一持久化进度推导：`0–<25%` 种核、`25–<50%` 抽芽、`50–<85%` 展叶、`85–100%` 开花。页面关闭期间无需运行后台计时器，重开后会根据会话时间直接恢复对应阶段。完成夜班时写入 `growthHistory` 快照，包含章节、时长、质量、方向、随身物、城市时辰、可选睡隙回声 ID 与完成时间；断续睡眠也保存完整植株，只使用较紧凑的视觉层级。v5 迁移会为旧存档中已经完成的报告建立普通层级标本，v11 再为旧会话与温室记录补齐安全时辰；v12 校验可选回声记录，旧档没有回声时保留为空白而不伪造醒转。

每条 `RouteDirection` 只映射一个 `societyId` 和一条可解释的 `societyNotice`。完成夜班时，`societyHistory` 按章节保存社团、方向、完成时间与当时称呼层级；同一社团第一次、第二次、第三次及以后被触及时，依次使用 `noticed`、`known`、`entrusted`。层级只选择称呼与来函，不参与线索、藏品、植物、睡眠质量或结局判断。v6 迁移按已完成章节顺序读取 `choiceHistory`，从旧路线确定性重建同一关系历史。

每个社团层级对应一个固定问函和两种答复。`answerCorrespondence` 只在当前章节存在社团记录、答复 ID 属于对应问函且本夜尚未答复时，才向 `correspondenceHistory` 写入章节、社团、层级、答复与三类姿态快照；未答复的章节不写记录，也不阻断 `continueDay`。后续来信通过 `getLatestSocietyReply` 只检索同一社团、当前章节之前最近一次已答问函。v7 迁移不会为 v6 玩家伪造历史答复；Demo 章节跳转则生成明确、确定性的第一选项履历，方便演示后续回响。

`journeySeed` 在新存档第一次开始夜班时只生成一次：Demo 使用固定值，真实夜班使用本地随机值。`selectSouvenir` 先排除 `souvenirHistory` 已出现的物件，再用种子、章节、方向、随身物与物件 ID 的稳定哈希排序；同社团方向和同随身物亲和只影响排序，不改变主线奖励。首次结算把结果与当夜路线、准备、种子和时间写成快照，此后重复结算直接返回原记录。v8 迁移使用固定旧档种子，按已完成章节顺序重建，确保五夜不重复且刷新不重抽。

第一夜归来后的四个白天各由 `getOpportunityCandidates` 从十二张告示中稳定取三张，并排除 `opportunityHistory` 里所有曾展示的 ID。选择一张会保存对应答复，全部收起则只保存三张展示记录；两种方式都不会重抽或阻断调查。下一份晨报读取同章节记录显示一句回响，收藏页剪报册保存结果。v9 迁移不替旧档伪造白天选择，Demo 跳章才生成明确的第一选项演示履历。

第四、第五案同样各把 34 张专属图像作为静态 WebP 提交，提示词与映射见 [[docs/art-prompts/chihaya-noa-visual-archive]] 与 [[docs/art-prompts/fog-without-wolves-visual-archive]]；所有案件都不在运行时生成画面或核心事实。

## 内容边界

链上藏品是确定性内容之外的可选公开回执层。服务端只为案件注册表中真实存在的收藏品生成元数据和 15 分钟 EIP-712 voucher，前端钱包在 Injective EVM Testnet 调用 ERC-721 合约；合约按钱包、案件和收藏拒绝重复领取。`night-shift-injective-mints-v1` 与游戏 store 完全分离，任何钱包、RPC、签名或交易失败都不得进入 `resolveNight`、存档迁移或结局资格。完整部署和隐私边界见 [[docs/injective-keepsake-mint]]。

生成式能力用于编译期视觉资产和玩家明确授权的晨间短笺风格。第三至第五案的专属图像已作为静态 WebP 随构建提交，运行时不会为案件生成画面或事实；提示词与映射分别见 [[docs/art-prompts/thirteenth-loaf-visual-archive]]、[[docs/art-prompts/chihaya-noa-visual-archive]] 与 [[docs/art-prompts/fog-without-wolves-visual-archive]]。晨间短笺部署必须同时配置模型密钥、访问码和持久化 Redis 配额；访问码只用于换取带独立会话 ID 的 24 小时 HMAC 签名 HttpOnly、SameSite Strict Cookie，不写入游戏存档。访问尝试、单会话额度、部署每日预算和纸条 `requestId` 幂等均由 Redis 跨实例执行，配额不可用时关闭 AI。模型只接收当前纸条、案件／章节标题、方向、地点、随身物和侦探名，并只能返回固定 `tone`／`image` 枚举；服务端以校验后的枚举组合安全短笺，不直接展示自由模型文本。未配置模型、权限失效、超时、上游错误和无效输出都返回有明确原因的本地确定性回信。人物动机、线索存在性、核心因果与结局条件必须来自各案故事圣经。

英文内容同样是随构建提交的确定性目录，不在运行时调用翻译服务或生成模型。内容测试要求首案英文投影不含汉字，并逐项比较章节、方向、线索、收藏、关系与结局的稳定 ID 及规则，防止翻译改变剧情图谱。

案件板读取当前 manifest 的 `syntheses`。每条配方拥有稳定输出 ID、至少两个 `inputIds`、标题和解释；输入既可引用原始线索，也可引用已合成推论。`validateEvidenceSynthesisGraph` 在案件载入时拒绝重复输出、未知引用、自引用与循环，保证所有推论都能从原始线索确定性抵达。`getReadyEvidenceSyntheses` 只返回输入已经全部进入库存且尚未完成的配方，`synthesizeEvidence` 再次校验后只把输出 ID 写入 `synthesizedEvidenceIds`。因此玩家需要主动整理，但不再通过穷举错误配对寻找作者答案。

调查页由可检索档案与推理合成台组成。原始线索和已经归档的推论共用搜索、筛选与阅档入口；合成台只展示当前已经到齐的配方，输入证物可先行打开复核，明确点击“整理这条推论”后打开推论信笺。合成输出立即成为档案库存，因而可以参与后续链式配方和真结局资格。页面不保存临时搜索、筛选或滚动状态。

城市时辰是只读叙事分支。`getCityWatchEcho(chapter, watchId)` 为五夜的每个时辰返回固定场景、匿名偶遇与林渡短笺；夜行、晨报、收藏履历和结案总账只读取快照，不把时辰传入 `resolveNight` 或任何结局判断，因此交接时间不会成为隐形评分或奖励倍率。

睡隙回声同样是只读叙事分支。每章只有一个固定 `WakeEcho`；真实会话最多记录一次，Demo 只有断续预设会形成回声。`wakeEcho` 与 `wakeEchoId` 不进入 `resolveNight`、质量派生、植物进度、社团层级或结局判断；没有醒转的历史会在睡隙回声簿中显示为完整空白，而不是待补收集项。

案件板桌面端使用档案库／推理台双栏：档案库承担搜索、筛选和整卡阅档，右侧推理台在正常文档布局中显示就绪配方与已归档推论，不增加固定底栏。900 px 以下推理台先出现、档案库随后出现，保证移动端先看见当前可行动项，再在单列卡片中查阅证物。证物与推论信笺仍是可访问覆盖层；现有纸张、黄铜、墨色、蝴蝶封印和字体资产原样复用，不生成或替换美术。

晨报以 900 px 为阅读层级断点。宽屏默认展开完整夜班档案；平板与手机默认把硬件回执、放下纸条、明信片、时辰、睡隙、植物、人物、机会、纪念物和社团来函收进原生 `details`，主文档流只保留夜印／日志、随身物、路线、新证物、矛盾和下一步。玩家可随时展开，折叠状态不写存档也不改变内容。案件板把档案库与推理合成台置于主文档流，再把密文台放在其后的独立 `details`；密文默认收起，以 DOM 顺序和原生展开语义表达“补充档案而非主线门槛”。

好友线索使用 `/game/board?case=<案件 ID>&clue=<稳定线索 ID>` 的 local-first 深链接。分享端只从当前案件白名单生成链接和二维码；共享 route layout 在普通阶段守卫之前验证案件和该案线索，切换到对应存档后才经 `receiveSharedClue` 写入 `unlockedClueIds` 与 `receivedClueIds`，随后 replace 到无 query 的案件板。旧的根路径 `/?case=...&clue=...` 与仅含 `clue` 的链接继续兼容，后者默认解释为 `case-001`。跨案件组合与未知 ID 不创建或污染存档；重复链接保持幂等，不传送其他进度，也不会合成推论或推进章节。赠送线索可参与普通阅档与推论合成，但真结局只计算非 `receivedClueIds` 的亲自取得线索；玩家后来完成对应夜班时，该 ID 会从好友来源表移除，转为亲自取得。

密文关卡使用独立的 `solvedCipherIds` 保存已经核对的稳定 ID。每个案件注册一份 `CipherDeskDefinition`，同时提供标题、说明、三段关卡、最终接线与全关完成回执；单个关卡可选 `CipherDial`，声明范围、步长、初始值、目标、精度和显示模式。显示模式支持时刻、MHz 和案件通用计数，并可由内容提供仪表及信号标签；刻度盘值先按范围与步长对齐并按精度截断，最终仍通过同一答案白名单进入 `solveCipher`，避免浮点漂移或绕过作者答案。文本答案经 NFKC、大小写和常见分隔符归一化后精确匹配，最终接线则要求碎片 ID 数量、唯一性与顺序完全一致，全部不使用模糊判断或生成模型。只有成功关卡和接线 ID 持久化；未提交刻度与临时排序只存在组件状态。迁移会按当前案件的三关与接线 ID 合集过滤未知和跨案件值。未注册密文的案件不显示空面板。

真结局资格由 `canUnlockTrueEnding` 统一判断，界面锁定与存档动作共用同一规则；因此不能通过绕开按钮直接写入未满足条件的真结局。旧存档迁移由可独立测试的 `migrateGameState` 提供。

调查方向必须来自当前章节的三个 choice ID。空值只用于兼容旧夜班并确定性回退到第一条方向；非空非法 ID 会被拒绝。内容测试遍历全部十五条分支，证明同章节、同睡眠质量下的固定线索与收藏不随方向改变。

社团关注同样属于确定性旁支：十五条方向均有且只有一个主要社团，三个社团各覆盖五条。界面在交接前只提示“可能惊动谁”，不展示累计数字或兑换表；晨报和城市人情簿展示称呼、礼数与路线履历，不提供可刷取的声望货币。

问函答复不参与 `resolveNight`、`canUnlockTrueEnding` 或 `canChooseEnding`。三类总体姿态只在结局完成后选择一段城市附言；没有答复时使用独立的“未寄出的答复”附言，因此沉默同样不是失败状态。

纪念物同样不参与 `resolveNight` 固定线索、植物成长、社团层级、问函姿态、睡眠质量或任何结局资格；它们没有稀有度、价值、货币、重复碎片或可见掉落表。

机会告示没有行动点、日历登录、抽取按钮或奖励差。`resolveOpportunity` 与 `dismissOpportunities` 只写独立历史，不进入夜间结算、社团层级或结局判断。

人物档案同样是确定性内容视图：第 2–5 夜晨报各映射一位人物；档案页只用 `completedReports` 判断是否见过，用既有 `unlockedClueIds` 判断保留意见是否展开。人物模块不写存档，不进入 `resolveNight`、睡眠质量、奖励或结局判断。

分区志只用 `completedReports` 判断地区是否已经被走过：第 1、3、4 夜分别展开灯港区、旧子午区与玻璃丘。地区内容不写存档，不替换路线图，也不进入任何结算或资格判断。

结案卷宗同样是只读投影，不增加新的持久化结构：它按当前 manifest 的章节和 `completedReports` 排列旅程，再从 `choiceHistory`、`preparationHistory`、`growthHistory` 与 `souvenirHistory` 读取当夜真实履历；核心物证只过滤本案 `unlockedCollectibleIds`。三封终函与真结局门槛来自当前 manifest，城市附言仍独立取自问函总体姿态。“重看档案”只切换结局页内的本地视图，不清除 `endingId`；“选择其他案件”回到书架并保留本案结局，“重新调查”只重置当前案件。

## 交互基线与组件边界

0003 开工时冻结以下行为：Demo 仍可在 12 秒内完成一夜；三种睡眠都推进固定主线；随身物只改变环境回响；晨报、夜印和收藏结果保持兼容。

当前组件按以下功能边界拆分：

- `app/(night-shift)/`：用稳定路径承载案件书架、序章和七个游戏页面；页面只组合功能组件，不拥有章节结算。
- `app-runtime.tsx`：共享本地化、首次加载、全局弹层、好友线索接收和水合后阶段守卫。
- `game-layout.tsx`：普通游戏页的顶栏与真实链接底部导航；夜班和结局保持沉浸式全屏。
- `landing.tsx`：落地页与案件书架，不读取游戏结算规则。
- `case-prologue.tsx`：读取当前案件的三幕序章，拥有幕间导航，不写进度或结算。
- `night-cycle.tsx`：调查方向、随身物、林渡交接肖像与交接单、Demo／真实模式、夜印显影、归来明信片和晨报。
- `investigation.tsx`：案件板、明信片旅程册、夜印收藏、物证档案与 manifest 驱动的结案卷宗。
- `clue-sharing.tsx`：单条证物二维码、复制链接与接收结果提示；不拥有存档校验规则。
- `shell.tsx`：跨视图导航与 Demo 控制台。
- `sleep-hardware.tsx`：跨案件的硬件中心、授权、信号与回执；不拥有剧情结算。
- `ambient-hardware.tsx`：硬件中心内的 Home Assistant 配对、实体绑定、试运行和只读传感器；不拥有设备令牌或剧情结算。
- `shared.tsx`：跨功能域复用的纸张、印章和路线视觉原语。

会话模型位于 `src/lib/game-engine`，跨页恢复依赖持久化时间戳而非组件生命周期。路由页只负责把导航回调接到既有 store action；后续案件板和等待循环可以在各自功能域内独立演进。

桌面交接页是唯一采用“稳定场景栏 + 独立计划滚动区 + 固定主操作”的应用内视图；900 px 以下恢复普通文档流。固定底部导航不拥有各页面滚动状态：新链接按 App Router 默认行为进入页首，重复点击当前链接显式回顶；本次没有启用 Cache Components，也不承诺保留离开页面前的组件局部状态。

## 相关文档

- [[docs/product-overview]]
- [[docs/campaign-authoring]]
- [[docs/decision-log]]
- [[docs/quality-baseline]]
- [[docs/sleep-hardware-bridge]]
- [[docs/home-assistant-ambient-bridge]]
- [[docs/privacy-and-guardrails]]
- [[plans/0001-hackathon-mvp]]
