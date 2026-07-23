# 城市故事线创作与接入

## 当前模型

Night Shift 使用受信任的编译期内容，而不是运行时自由生成案件事实。公开产品只有一个持续更新的雾灯城主案世界；`CampaignManifest` 承担世界容器、英文投影和内容引用校验，实际新增内容优先写成 `CampaignStoryline`，不再新增 CASE 编号。

当前公开结构：

- `case-001`：雾灯城内容世界；包含主线 [[docs/story-bible|《零点四十三分的末班车》]] 与支线 [[docs/tide-refused-story-bible|《潮汐不肯归档》]]。
- `case-003`：[[docs/blackwater-creek-adaptation-bible|《黑水溪》]]，唯一公开的 `sandbox-expedition` 非商业结构样板。
- `case-002`：[[docs/rain-radio-story-bible|《只在雨中播出的电台》]]只保留未挂载源稿，不提供入口或存档兼容。

## Manifest 契约

`src/content/campaigns/types.ts` 定义并校验以下内容：

- `storylines`：同一内容世界里的主线与支线。每条线拥有稳定 ID、`main | side` 角色、解锁证物、内容语言、地图介绍、`SandboxCampaignContent` 与跨线证物连接。
- `unlockClueIds`：空数组表示主线始终可进入；支线使用任一已归档证物显影。
- `connections`：显式声明“世界主线证物 ↔ 当前支线证物”及联合推论；两端引用在模块载入时校验。
- `content`：复用地点／行动条件效果运行时，包含入口、地点、行动、人物、证物、手札、物品、0–7 语义状态、结局、`presentation` 与 `credits`。
- `format` 与 `sandbox`：只用于《黑水溪》等独立结构样板。
- `case`、`routes`、`relations`、逐夜配套内容与旧 `rules`：是退役线性实现的源内容，不再挂载到公开入口；复用时应改写为 story thread，而不是恢复固定五夜。

`defineCampaign` 会拒绝重复故事线、未知解锁证物、未知跨线证物和无效 story thread 内容。`assertSandboxCampaign` 继续拒绝重复入口／地点／行动、非法条件与效果引用、缺失展示契约，以及不完整的 0–7 状态阶段。内部字段仍名为 `corruption`／`threat` 以兼容运行时，界面必须读取每条线的语义标签。

## 新增故事线与 storylet

1. 先确定它是长期主线还是由现有证物解锁的支线；为它分配稳定 `storyline.id`，存档键将是 `case-001:<storyline-id>`。
2. 在 `src/content/storylines/` 定义地点、行动、条件、效果、证物、人物与收束。顺序故事可以用行动显影下一个地点；开放故事使用冗余证据与多路径条件。
3. 在 `case-001` 的 `storylines` 中登记。新增内容不修改公开案件目录，也不增加 `case-00x`。
4. 若支线与现有事实相关，在 `connections` 中写出跨线证物对与推论；不要只在文案里暗示。
5. 为固定真相新增或更新故事圣经，并为新视觉批次记录风格锚点、提示词和运行时文件。
6. 增加内容矩阵、代表性收束、两条故事线并发夜班、桌面与 390 × 844 城市地图路径。
7. 运行 [[docs/quality-baseline#验证命令|完整验证命令]]。

故事线随前端版本发布，不从远程加载可执行代码；内容更新像版本补丁一样增加编译期 storylet 与资产。若未来需要远程下载内容，必须另立计划评估内容签名、版本迁移和安全边界。

## 本地化

中文 `CampaignManifest` 是案件事实和稳定 ID 的唯一规范来源；本地化是只读展示投影，不能复制内容 ID、改变引用或进入结算。为案件增加语言时：

1. 在 `src/i18n/core.ts` 的案件能力判断中显式声明支持范围，未支持的案件必须完整回退中文，不能伪装成混合语言版本。
2. 把完整字符串覆盖加入对应语言目录；自动基线可用于穷举覆盖，但章节报告、人物名、地点名、核心谜面和结局必须人工复核语气与事实。
3. 内容测试需要证明本地化 manifest 无遗漏汉字，并逐项比较章节、方向、线索、收藏、关系、结局 ID 与 `rules`。
4. 通用界面使用 `t` 或 `localize` 投影展示内容；语言偏好保存在独立的 `night-shift-locale` 键，不得写入游戏存档。
5. 浏览器验收至少覆盖书架切换、刷新保留、首夜交接／晨报／案板／档案，以及 390 × 844 无溢出路径。

## 存档与链接

`night-shift-sandbox-v1` v3 同时保存雾灯城 story thread 与《黑水溪》样板。每条故事线使用 `saves[case-001:<storyline-id>]`，因此《末班车》和河下区可以同时处于 `night`，分别恢复、结算和归档；完成或重置一条线不会覆盖另一条。`night-shift-world-v1` 只保存当前公开世界与是否进入，硬件仍使用独立 store。

所有前端进度受 `night-shift-save-epoch` 管理。内容或状态结构发生不兼容变化时，递增 `NIGHT_SHIFT_SAVE_EPOCH`；启动会定点删除 `night-shift-world-v1`、`night-shift-sandbox-v1`、`night-shift-sleep-hardware-v1` 与退役的 `night-shift-save-v1`。不要为早期版本新增迁移器，也不要清理 `night-shift-locale` 或无关 localStorage。

好友线索链接使用 `?case=<案件 ID>&clue=<线索 ID>`。接收端先验证案件，再在该案件线索白名单中验证线索并切换到对应存档；非法交叉组合不会写入。旧的 `?clue=<线索 ID>` 仍按 `case-001` 解释。

每个 story thread 保存入口、地点、行动、人物、状态、手札、物品、结局、`day | night | morning`、待执行行动、核心 `SleepSession` 与晨报差异快照。新行动必须先通过条件校验并写入交接单，夜班结束时才确定性结算，晨报归档后才能安排该线的下一段；同一时间可以启动其他线。等待时长与睡眠质量不得进入线索、人物、状态或结局条件。

## 共享城市系统

三件随身物、三个地下社团、问函、机会告示和口袋纪念物目前属于雾灯城共享玩法层，可被多个案件使用；案件 manifest 负责提供路线到社团的映射。案件事实、线索、关系、结局、人物、地区、明信片、植物与回声必须留在各自案件包内。共享系统不得反向决定案件真相或跨案件污染进度。

## 相关文档

- [[docs/architecture]]
- [[docs/product-overview]]
- [[docs/story-bible]]
- [[docs/rain-radio-story-bible]]
- [[docs/blackwater-creek-adaptation-bible]]
- [[docs/quality-baseline]]
- [[plans/0025-multi-campaign-runtime]]
