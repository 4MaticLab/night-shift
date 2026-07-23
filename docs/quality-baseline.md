# 当前质量基线

## 已验证能力

- 公开书架只有持续更新的 `case-001` 雾灯城世界与标明“结构样板”的 `case-003`《黑水溪》；CASE 002、CASE 004 与 `?legacy=1` 都没有公开入口。
- 雾灯城纪事地图同时展示《零点四十三分的末班车》主线和河下区《潮汐不肯归档》支线，聚合“可安排／夜班中／待拆报告／已完结”状态、地点显影和三组跨线证物连接。
- 《末班车》把既有五段真相适配为五个顺序显影地点、十五个可计时 storylet、12 条线索和三种收束；界面不再使用“第几夜”作为产品进度。
- 河下区支线保留双路径、七地点、22 个行动、16 条证物、五份手札、九件物品、九名 NPC、0–7 回潮与四种收束；首批 1+3+3 插画进入城市地图、入口、地点和人物档案。
- 主线与支线分别保存在 `case-001:last-tram` 和 `case-001:tide-refused`，可以同时处于 `night`，分别恢复、结算、归档和完结；单元与浏览器测试均验证互不覆盖。
- 《黑水溪》仍以独立结构样板提供双入口、九地点、20 条证物、六份手札、12 名 NPC、0–7 污染和五种收场；真实夜班刷新后恢复并保持单次确定性结算。
- `CampaignManifest` 在载入时校验故事线 ID、解锁证物、跨线连接以及全部沙盒地点、行动、条件／效果、人物、阶段与收束引用；通用运行时不按故事线 ID 写业务分支。
- 三种睡眠质量都推进对应故事线，只改变晨报叙事层次；等待时长、硬件信号和醒转不改变固定事实、人物状态或收束资格。
- `night-shift-save-epoch` 当前为 `2`；不兼容时只清空世界、故事线、睡眠硬件与退役五夜四类存档，保留 `night-shift-locale` 和其他站点数据。活跃故事线 store 为 v3，硬件 store 为 v2。
- 英文模式覆盖公开书架、三幕开场、雾灯城纪事地图与《末班车》完整 story thread；内容投影单测覆盖全文无汉字，浏览器从主线入口走到首份晨报再次验证可玩界面无汉字。河下区和《黑水溪》明确回退中文。
- 美术继续使用 Literary Storybook Noir 全局媒介锚点；河下区只增加盐晶海绿与红色屋顶粉线作为局部口音，未来资产批次必须记录共用锚点、局部差异、文件映射与输出处理。
- 服务端可渲染产品标题与社交分享元数据。

## 验证命令

```bash
npm test
npm run lint
npm run build
npm run build:sites
npm run test:render
npm run docs:check
```

Playwright Happy Path 位于 `tests/e2e/night-shift.spec.ts`，共 7 条当前产品路径：英文城市纪事到《末班车》首份晨报且 `?legacy=1` 不分流、破坏性 epoch 清理边界、《黑水溪》真实夜班刷新恢复、河下区首份确定性晨报、主／支线双夜班并发、390 × 844 两卡书架，以及移动端河下区居民返程完整收束。Vitest 共 77 条，覆盖内容 manifest、主／支线矩阵、英文主线全文、并发 store、确定性结算、睡眠与硬件边界，以及 save epoch 只清 Night Shift 进度的规则；浏览器测试使用本机 Chrome channel。

## 已知边界

- 浏览器端尚未建立像素截图基线或多设备／多浏览器矩阵；当前响应式证据聚焦 390 × 844 Chrome 关键路径。
- 默认 `npm run build` 验证原生 Next.js/Vercel 产物；`npm run build:sites` 与 `npm run test:render` 验证 Vinext/Cloudflare Worker 产物。仅供 Cloudflare 使用的目录不进入 Next 类型检查，但仍由 Vinext 构建和 ESLint 覆盖。
- 河下区与《黑水溪》仍是中文内容；英文模式会清楚标记并在进入时整体回退中文。
- 叙事 story thread 可以并发，但睡眠硬件中心目前只维护一份活动采集；启动第二条线不会覆盖剧情会话，只会让设备摘要继续对应最近一次硬件采集。
- 《黑水溪》专属人物／场景插图和环境音批次尚未制作；当前使用原创 CSS 档案地图与纸本界面。项目负责人已批准现有学习项目的公开源码与 Vercel 自动部署；未来商业发行和新增原作资产仍需独立授权复核。

完成的工程加固见 [[plans/0003-mvp-quality-hardening]]；当前时间成长升级见 [[plans/0007-night-greenhouse-and-time-growth]]。

桌面与移动端人工核对项见 [[docs/viewport-checklist]]。

## 最近发布

2026-07-23 的第二个私密版本包含文学性城市语气、三件随身物、15 段确定性回响、五枚夜印、八件物证插画和新版分享封面。对应完成计划为 [[plans/0004-literary-city-and-waiting-loop]]。

同日发布的第三个私密版本加入真实夜班时间戳恢复、实际时长结算、晨报会话摘要和 v2 存档迁移，并修复本地静态图片回退与首屏水合竞态。线上地址为 `https://night-shift.ryuko233.chatgpt.site`。

第四个私密版本完成游戏 UI 功能域拆分；第五个私密版本把案件板升级为两证物配对推理，并保留同一线上地址。

第六个私密版本把五夜状态循环、真实存档重载、旧存档迁移和三个结局纳入自动化护栏，正式关闭 [[plans/0003-mvp-quality-hardening]]。

第七个私密版本为五夜加入独立城市明信片、晨报归来仪式、随身物背面附言、可持久解锁的旅程册与 v3 存档迁移，完成 [[plans/0005-city-postcards-and-return-ritual]]。

第八个私密版本加入五夜十五条调查方向、三种地图坡度、方向专属夜间事件、城市遭遇、归来来信、旅程履历与 v4 方向历史迁移，完成 [[plans/0006-investigation-directions-and-route-letters]]。

第九个私密版本加入五株章节专属夜生植物、夜班四阶段生长、晨报成果揭示、雾灯温室、v5 成长历史与旧存档重建；断续睡眠仍会留下完整植物，不引入枯死或失败惩罚，完成 [[plans/0007-night-greenhouse-and-time-growth]]。

第十个私密版本加入错页登记处、失物领事馆与熄灯测绘社，十五条方向均匀映射三种调查姿态；交接前会提示可能惊动谁，晨报按跨夜历史更换称呼与来函，收藏页保存城市人情簿。关系只改变礼数和旁支文本，完成 [[plans/0008-city-societies-and-remembered-favors]]。

第十一个私密版本为三个社团的三层关系加入九封问函和十八种答复；玩家可以回信或保持沉默，同社团后续来函只引用最近一次答复。问函履历进入城市人情簿，结局完成后显示非资格型城市附言，完成 [[plans/0009-city-correspondence-and-reply-echoes]]。

第十二个私密版本加入九件不请自来的城市纪念物、稳定旅程种子、v8 无重复历史、晨报口袋揭示与收藏页口袋抽屉。小物没有稀有度、货币、掉落表、案件优势或结局门槛，完成 [[plans/0010-unasked-for-souvenirs-and-pocket-drawer]]。

第十三个私密版本加入十二张机会告示、二十四种答复、四日稳定三选一、v9 历史、次晨回声与城市剪报册；短章可全部收起且没有行动点或主线门槛，完成 [[plans/0011-foglight-opportunity-notices-and-daytime-storylets]]。

第十四个私密版本为米娜、吉迪恩、奥林与伊芙琳加入四张原创编辑蚀刻肖像；第 2–5 夜晨报呈现相关人物，档案页按相遇和既有证物逐层展开固定事实，完成 [[plans/0012-city-witness-portraits-and-person-dossiers]]。

第十五个私密版本为灯港区、旧子午区与玻璃丘加入三张原创城市版画，并在档案页按第 1、3、4 夜进度展开公共说法、城市规矩与固定地标，完成 [[plans/0013-foglight-district-atlas]]。

第十六个私密版本用交接、夜行、归来与裁决四张原创横幅重建核心流程分幕；林渡造型与暖纸蚀刻媒介保持连续，夜间路线、晨报标题和结局交互继续位于图像之上，完成 [[plans/0014-four-act-header-triptych-and-ending-tableau]]。

第十七个私密版本把从新档连续完成五夜并选择结局、390 × 844 首夜闭环、长档案与案件板连接纳入 Playwright；同时把移动案件板的推论面板移到证物画布下方，消除触摸遮挡，完成 [[plans/0015-full-cycle-and-mobile-proof]]。

第十八个私密版本为十二条核心线索加入城市异议与林渡页边批注，把案件板升级为可阅档、可拖动并在刷新后保留摆放的调查桌；v10 迁移为旧档补齐安全的坐标表，完成 [[plans/0016-evidence-dossiers-and-remembered-desk]]。

第十九个私密版本为三种裁决补上独立林渡终函，用当前存档真实历史生成五夜归来总账与核心物证陈列，并加入不丢失结局的档案回看、禁用的后续案件出口和 390 × 844 结案闭环，完成 [[plans/0017-five-night-case-closing-ledger]]。

第二十个私密版本补齐林渡独立交接肖像，以既有四幕横幅为身份与媒介参考，并把方向、随身物和目的地组成肖像旁的实时交接单；桌面与 390 × 844 路径均验证人物、标题、交接单和主操作互不遮挡，完成 [[plans/0018-lin-du-handoff-portrait]]。

第二十一个私密版本把真实交接时刻冻结为掌灯、夜半、末更或白昼小憩，为五夜补齐二十条确定性城市侧影，并在交接、夜行、晨报、城市值更簿和结案履历中回显；v11 安全迁移旧会话与温室记录，时辰不参与固定成果或睡眠评价，完成 [[plans/0019-city-watches-and-real-time-echoes]]。

第二十二个私密版本为五夜补齐确定性睡隙回声；真实夜班可以记录一次短暂醒转并继续，断续 Demo 自动形成回声，晨报、睡隙回声簿与结案总账保存结果。v12 校验可选回声快照，同夜不可重复，回声不参与线索、植物、睡眠评价或结局资格，完成 [[plans/0020-sleep-gap-echoes-and-gentle-wake-check-in]]。

第二十三个私密版本完成桌面／移动端交互整修：视图切换与重复点击当前导航会回顶，晨报不再锁死其他视图；桌面交接改为稳定场景、独立计划滚动区与常驻主操作，移动交接恢复紧凑的两列／三列选择；底部导航支持安全区、`aria-current` 与 44 px 触摸护栏，可选项补齐 `aria-pressed`。本机浏览器实际覆盖 1440 × 900 与 390 × 844，完成 [[plans/0021-cross-device-interaction-pass]]。

第二十四个公开版本建立 Vercel 与 Sites 双生产目标：默认原生 Next 构建生成 `.next/`，Vinext Worker 由独立脚本生成 `dist/`。提交 `d12984e` 的 Vercel 生产部署状态为 `Ready`，固定地址 `https://night-shift-zeta.vercel.app` 返回 HTTP 200，完成 [[plans/0022-vercel-dual-target-deployment]]。

第二十五个公开版本修复移动案件板吞掉纵向手势的问题，关闭手机端画布拖移／缩放并保留页面滚动；联合推理改为常驻三步工具台、明确 A／B 槽、单独移除和选满保护。提交 `9021d2b` 已完成 Vercel 生产部署，完成 [[plans/0023-mobile-case-board-inference]]。

第二十六个公开版本加入“送给好友”线索二维码与复制链接；白名单深链接在好友本地幂等接收单条证物、清理 query 并标记来源，非法 ID 不启动存档，好友线索不直接满足真结局门槛。提交 `ce8e890` 的 Vercel 生产部署状态为 `Ready`，固定地址 `https://night-shift-zeta.vercel.app/?clue=postcard` 返回 HTTP 200，完成 [[plans/0024-friend-clue-sharing]]。

第二十七个公开版本建立 `CampaignManifest` 与编译期案件注册表，加入《只在雨中播出的电台》完整五夜剧本、案件书架、v14 独立存档和案件感知好友线索；首案与第二案均通过完整五夜、结局、切换隔离及 390 × 844 自动化。提交 `25732bb` 的 Vercel 部署状态为 `Deployment has completed`，案件感知固定地址返回 HTTP 200，完成 [[plans/0025-multi-campaign-runtime]]。

## 相关文档

- [[docs/architecture]]
- [[docs/demo-script]]
- [[PLANS]]
