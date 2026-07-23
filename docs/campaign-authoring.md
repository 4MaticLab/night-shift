# 案件包创作与接入

## 当前模型

Night Shift 使用受信任的编译期案件包，而不是把某一份剧本写死在引擎里。每个案件由一个 `CampaignManifest` 组成，注册在 `src/content/campaigns/registry.ts`；运行时只读取当前 manifest，不按案件 ID 写专属分支。

当前注册的案件：

- `case-001`：[[docs/story-bible|《零点四十三分的末班车》]]
- `case-002`：[[docs/rain-radio-story-bible|《只在雨中播出的电台》]]
- `case-003`：[[docs/blackwater-creek-adaptation-bible|《黑水溪》]]，首个 `sandbox-expedition` 非商业本地原型

## Manifest 契约

`src/content/campaigns/types.ts` 定义并校验以下内容：

- `format`：省略或 `linear-night` 使用连续五夜；`sandbox-expedition` 使用地点／条件／效果运行时。
- `sandbox`：仅沙盒案件提供，包含入口、地点、行动、人物、证物、手札、物品、污染阶段、结局与署名许可。
- `case`：案件标题、连续章节、线索、收藏品和每夜固定报告。
- `routes`：每个章节 choice 都必须拥有且只拥有一条调查路线。
- `relations`：联合推理使用的确定性线索对；引用必须落在本案线索白名单内。
- `endings` 与 `rules`：三种裁决文本、真结局 ID，以及线索／收藏／关系门槛。
- `postcards`、`botanicals`、`watchEchoes`、`wakeEchoes`：每夜归来与等待叙事。
- `characters`、`districts`：可选的人物和地区档案；空人物表会让通用档案页隐藏该区块。
- `presentation`：档案编号、城市与侦探称呼、首页介绍、四幕图像、逐夜夜印和结案文案。

`defineCampaign` 会在模块载入时拒绝重复 ID、非连续章节、缺失路线、每夜配套内容不完整、跨案件引用和不可达的真结局条件。沙盒案件还会拒绝重复地点／行动、非法条件与效果引用，以及不完整的 0–7 污染阶段。Zod schema 继续校验线性案件的单条内容字段与文学文本下限。

## 新增案件

1. 先决定格式。连续睡眠叙事使用 `linear-night`；乱序地点、世界状态和条件／效果使用 `sandbox-expedition`，不要把某一案的分支写进通用组件。
2. 在 `src/content/campaigns/` 新建案件模块，定义该格式需要的完整内容；用 `defineCampaign({...})` 导出 manifest，案件 ID 与 `case.id` 必须一致。
3. 在 `registry.ts` 登记 manifest。除非要增加全新的玩法能力，不应修改 store、引擎或通用页面。
4. 为固定真相新增一篇故事圣经并从 [[docs/index]] 索引。
5. 增加内容测试、完整主循环或沙盒分支模拟、案件切换／独立存档测试，以及桌面与 390 × 844 冒烟路径。
6. 运行 [[docs/quality-baseline#验证命令|完整验证命令]]。

目前案件包随前端构建发布，不从远程加载代码。若未来需要可下载剧本或 Fallen London 式 storylet 条件／效果 DSL，应另立计划并重新评估内容签名、版本迁移和安全边界。

## 存档与链接

浏览器仍使用 `night-shift-save-v1`，持久化结构版本为 14。顶层 `campaignId` 指向当前案件；当前进度保持扁平以兼容组件，离开案件时会写入 `campaignSaves[campaignId]`，切回时恢复各自的章节、线索、关系、结局、案板坐标和夜间历史。v13 及更早的单案件存档默认迁移到 `case-001`。

好友线索链接使用 `?case=<案件 ID>&clue=<线索 ID>`。接收端先验证案件，再在该案件线索白名单中验证线索并切换到对应存档；非法交叉组合不会写入。旧的 `?clue=<线索 ID>` 仍按 `case-001` 解释。

沙盒案件使用独立的 `night-shift-sandbox-v1` v1 存档，并在 `saves[campaignId]` 下保存入口、地点、行动、人物、污染、威胁、手札、物品和结局。分开持久化是有意的兼容边界：前两案无需迁移不适用的沙盒字段，第三案也不会误读五夜历史。当前好友线索链接只服务线性案件，沙盒多人或手札分享需另立计划。

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
