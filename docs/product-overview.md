# 产品概览

## 一句话定位

《夜班侦探 Night Shift》是一款与你轮班生活的异步侦探游戏：玩家白天分析线索并安排方向，睡着以后，侦探林渡替玩家进入城市调查。

核心情绪不是睡眠管理，而是：**我想早点睡，因为我想知道侦探今晚会发现什么。**

长期叙事、玩法与美术方向见 [[docs/north-star]]。

## 核心循环

```text
雾灯城纪事地图 → 选择一条或多条故事线 → 为每条线安排下一段调查
       ↑                                             ↓
跨线证物与新地点 ← 分别拆开晨报、归档结果 ← 林渡按真实时间并行推进
```

公开主案不再按“五夜”倒数。每个 `story thread` 由一组有条件的 storylet、确定性行动、证物、人物状态和独立收束组成；完成一份晨报只推进对应故事线，线索可以显影同一张城市地图上的新地点，也可以和另一条线的证物形成跨线推论。林渡可以在《末班车》仍处于夜班计时中时，接受河下区的另一份交接；两条 `SleepSession` 与晨报分别保存在 `case-001:<storyline-id>`，互不覆盖。

《零点四十三分的末班车》现有五段真相已适配为第一条主线 story thread：每段仍提供三个调查方向，但“章节 1–5”只保留内容顺序，不再表现为必须连续完成的五个夜晚，也不承担旧存档迁移。《潮汐不肯归档》是由主线证物解锁的河下区支线；“箱子上的姓氏”“被刮掉的轨迹”与“同一批黄铜”会分别连接夜渡名册、盐结门牌和原始工程总账。

交接仍提供 12 秒 Demo 与真实计时。开始一条线的调查后，玩家可以返回城市地图继续安排其他线；回到对应故事线时再拆开确定性晨报。等待时长只决定叙事层次和何时可读，不改变固定线索、人物存亡、世界状态或结局资格。睡眠硬件仍是可撤销的感官层，详见 [[docs/sleep-hardware-bridge]] 和 [[docs/privacy-and-guardrails]]。

既有五夜案件板、好友线索、密文台、植物、明信片、社团、问函、纪念物与结案总账不再挂载到公开产品路径，`?legacy=1` 也不会恢复它们。源内容可供后续 storylet 重写复用，但不再限制未来版本只能添加五段内容。

## 当前内容世界

公开首页只展示两个入口：`case-001` 是持续更新的雾灯城主案世界，`case-003`《黑水溪》是验证双入口、地点网络与开放收场的非商业结构样板。`case-002`《只在雨中播出的电台》只保留未挂载的源稿，不提供入口、存档迁移或兼容保证。

雾灯城当前有两条可并行故事线。主线《零点四十三分的末班车》包含五个顺序显影的地点段落、十五个方向、12 条核心线索和三种收束；支线《潮汐不肯归档》包含七个地点、22 个行动、16 条线索、九名人物、0–7“回潮”与四种收束。两条线共享城市地图和跨线证物，却拥有独立计时、晨报、行动状态与结局。后续内容更新优先追加 story thread、storylet、跨线连接与同风格素材，而不是新增 CASE 编号。

当前前端存档 epoch 为 `2`。版本升级若与当前结构不兼容，启动时会清空 Night Shift 自己的世界选择、故事线、睡眠硬件和退役五夜存档并从新世界开始；语言偏好和其他站点数据不在清理范围。早期开发阶段不维护逐版本向下迁移。

## 成功标准

- 15 秒内让新玩家理解“你睡着时侦探工作”。
- 60–90 秒内演示完整的交接、夜间调查、晨报和推理循环。
- 无后端、登录、环境变量或 API Key 时可完整体验。
- 国际玩家可以用英文完成城市纪事入口与《末班车》主线 story thread；河下区当前明确标记为中文版。
- 睡眠差异增加叙事丰富度，不惩罚玩家。
- 美术统一为温暖故事书黑色电影，参见 [[docs/art-direction]]。

## 非目标

本项目不是医疗产品、睡眠评分工具、健康仪表盘、开放式聊天机器人、签到积分应用或随机故事生成器。当前版本不建设登录、云存档、数据库、支付、实时多人房间或远程可执行剧本；睡眠设备仅有本地虚拟样机，真实厂商 SDK、OAuth 和云端令牌服务尚未接入。好友线索只是一条 local-first 异步深链接；AI 只在部署授权与逐夜同意后选择单张晨间短笺的受限风格。

## 相关文档

- [[docs/architecture]]
- [[docs/campaign-authoring]]
- [[docs/story-bible]]
- [[docs/tide-refused-story-bible]]
- [[docs/blackwater-creek-adaptation-bible]]
- [[docs/demo-script]]
- [[docs/quality-baseline]]
- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[plans/0003-mvp-quality-hardening]]
- [[plans/0005-city-postcards-and-return-ritual]]
- [[plans/0006-investigation-directions-and-route-letters]]
- [[plans/0007-night-greenhouse-and-time-growth]]
- [[plans/0008-city-societies-and-remembered-favors]]
- [[plans/0009-city-correspondence-and-reply-echoes]]
- [[plans/0010-unasked-for-souvenirs-and-pocket-drawer]]
- [[plans/0011-foglight-opportunity-notices-and-daytime-storylets]]
- [[plans/0012-city-witness-portraits-and-person-dossiers]]
- [[plans/0017-five-night-case-closing-ledger]]
- [[plans/0018-lin-du-handoff-portrait]]
- [[plans/0019-city-watches-and-real-time-echoes]]
- [[plans/0020-sleep-gap-echoes-and-gentle-wake-check-in]]
- [[plans/0037-primary-case-city-storylines]]
