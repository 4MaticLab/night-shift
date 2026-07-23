# 案件包创作与接入

## 当前模型

Night Shift 使用受信任的编译期案件包，而不是把某一份剧本写死在引擎里。每个案件由一个 `CampaignManifest` 组成，注册在 `src/content/campaigns/registry.ts`；运行时只读取当前 manifest，不按案件 ID 写专属分支。

当前注册的案件：

- `case-001`：[[docs/story-bible|《零点四十三分的末班车》]]
- `case-002`：[[docs/rain-radio-story-bible|《只在雨中播出的电台》]]

## Manifest 契约

`src/content/campaigns/types.ts` 定义并校验以下内容：

- `case`：案件标题、连续章节、线索、收藏品和每夜固定报告。
- `routes`：每个章节 choice 都必须拥有且只拥有一条调查路线。
- `relations`：联合推理使用的确定性线索对；引用必须落在本案线索白名单内。
- `endings` 与 `rules`：三种裁决文本、真结局 ID，以及线索／收藏／关系门槛。
- `postcards`、`botanicals`、`watchEchoes`、`wakeEchoes`：每夜归来与等待叙事。
- `characters`、`districts`：可选的人物和地区档案；空人物表会让通用档案页隐藏该区块。
- `presentation`：档案编号、城市与侦探称呼、首页介绍、四幕图像、逐夜夜印和结案文案。

`defineCampaign` 会在模块载入时拒绝重复 ID、非连续章节、缺失路线、每夜配套内容不完整、跨案件引用和不可达的真结局条件。Zod schema 继续校验单条内容的字段与文学文本下限。

## 新增案件

1. 在 `src/content/campaigns/` 新建案件模块，先定义并解析案件、路线、关系、结局和每夜配套内容。
2. 用 `defineCampaign({...})` 导出一个完整 manifest；案件 ID 与 `case.id` 必须一致。
3. 在 `registry.ts` 登记 manifest。除非要增加全新的玩法能力，不应修改 store、引擎或通用页面。
4. 为固定真相新增一篇故事圣经并从 [[docs/index]] 索引。
5. 增加内容测试、完整主循环测试、案件切换／独立存档测试，以及桌面与 390 × 844 冒烟路径。
6. 运行 [[docs/quality-baseline#验证命令|完整验证命令]]。

目前案件包随前端构建发布，不从远程加载代码。若未来需要可下载剧本或 Fallen London 式 storylet 条件／效果 DSL，应另立计划并重新评估内容签名、版本迁移和安全边界。

## 存档与链接

浏览器仍使用 `night-shift-save-v1`，持久化结构版本为 14。顶层 `campaignId` 指向当前案件；当前进度保持扁平以兼容组件，离开案件时会写入 `campaignSaves[campaignId]`，切回时恢复各自的章节、线索、关系、结局、案板坐标和夜间历史。v13 及更早的单案件存档默认迁移到 `case-001`。

好友线索链接使用 `?case=<案件 ID>&clue=<线索 ID>`。接收端先验证案件，再在该案件线索白名单中验证线索并切换到对应存档；非法交叉组合不会写入。旧的 `?clue=<线索 ID>` 仍按 `case-001` 解释。

## 共享城市系统

三件随身物、三个地下社团、问函、机会告示和口袋纪念物目前属于雾灯城共享玩法层，可被多个案件使用；案件 manifest 负责提供路线到社团的映射。案件事实、线索、关系、结局、人物、地区、明信片、植物与回声必须留在各自案件包内。共享系统不得反向决定案件真相或跨案件污染进度。

## 相关文档

- [[docs/architecture]]
- [[docs/product-overview]]
- [[docs/story-bible]]
- [[docs/rain-radio-story-bible]]
- [[docs/quality-baseline]]
- [[plans/0025-multi-campaign-runtime]]
