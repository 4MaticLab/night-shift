# Night Shift Plans Index

本文件是计划的唯一总索引。具体方案、过程与验证证据写在 `plans/`；这里维护排序、状态和下一步。状态定义见 [[plans/README]]。

## 当前焦点

当前主计划是 [[plans/0021-cross-device-interaction-pass]]：用本机浏览器实测并整修桌面／移动端交互手感。

## 计划清单

| 计划 | 状态 | 模式 | 优先级 | 进度 | 下一步 |
|---|---|---|---:|---:|---|
| [[plans/0001-hackathon-mvp]] | `completed` | `manual` | P0 | 7/7 | 已发布首个可玩版本 |
| [[plans/0002-docs-and-plans-system]] | `completed` | `manual` | P0 | 6/6 | 按新规范维护后续工作 |
| [[plans/0003-mvp-quality-hardening]] | `completed` | `auto` | P0 | 6/6 | 已完成结构、真实夜班、证物关系与自动化加固 |
| [[plans/0004-literary-city-and-waiting-loop]] | `completed` | `auto` | P0 | 8/8 | 已发布第一轮北极星升级 |
| [[plans/0005-city-postcards-and-return-ritual]] | `completed` | `auto` | P0 | 6/6 | 已发布五夜城市明信片与归来仪式 |
| [[plans/0006-investigation-directions-and-route-letters]] | `completed` | `auto` | P0 | 6/6 | 已发布十五条方向路线、来信与履历 |
| [[plans/0007-night-greenhouse-and-time-growth]] | `completed` | `auto` | P0 | 6/6 | 已发布五株夜生植物、四阶段成长与雾灯温室 |
| [[plans/0008-city-societies-and-remembered-favors]] | `completed` | `auto` | P0 | 6/6 | 已发布三个地下社团、跨夜称呼、来函与城市人情簿 |
| [[plans/0009-city-correspondence-and-reply-echoes]] | `completed` | `auto` | P0 | 6/6 | 已发布九封问函、十八种答复、跨夜余波与结局附言 |
| [[plans/0010-unasked-for-souvenirs-and-pocket-drawer]] | `completed` | `auto` | P0 | 6/6 | 已发布九件纪念物、v8 稳定结算与口袋抽屉 |
| [[plans/0011-foglight-opportunity-notices-and-daytime-storylets]] | `completed` | `auto` | P0 | 6/6 | 已发布十二张机会告示、v9 历史、次晨回声与城市剪报册 |
| [[plans/0012-city-witness-portraits-and-person-dossiers]] | `completed` | `auto` | P0 | 6/6 | 已发布四张人物肖像、晨报会面与渐进人物档案 |
| [[plans/0013-foglight-district-atlas]] | `completed` | `auto` | P0 | 6/6 | 已发布三张地区版画与渐进雾灯城分区志 |
| [[plans/0014-four-act-header-triptych-and-ending-tableau]] | `completed` | `manual` | P0 | 6/6 | 已发布交接、夜行、归来与裁决四幕原创画面 |
| [[plans/0015-full-cycle-and-mobile-proof]] | `completed` | `manual` | P0 | 6/6 | 已发布完整五夜与 390×844 浏览器验收闭环 |
| [[plans/0016-evidence-dossiers-and-remembered-desk]] | `completed` | `auto` | P0 | 6/6 | 已发布证物阅档、真实拖动与 v10 桌面记忆 |
| [[plans/0017-five-night-case-closing-ledger]] | `completed` | `auto` | P0 | 6/6 | 已发布三封终函、五夜归来总账与可逆档案回看 |
| [[plans/0018-lin-du-handoff-portrait]] | `completed` | `auto` | P0 | 6/6 | 已发布林渡交接肖像与实时交接单 |
| [[plans/0019-city-watches-and-real-time-echoes]] | `completed` | `auto` | P0 | 6/6 | 已发布四时辰、二十条回声与 v11 时辰快照 |
| [[plans/0020-sleep-gap-echoes-and-gentle-wake-check-in]] | `completed` | `auto` | P0 | 6/6 | 已发布五条睡隙回声、一次醒转记录与 v12 存档 |
| [[plans/0021-cross-device-interaction-pass]] | `in_progress` | `manual` | P0 | 5/6 | 完成全套验证、Git checkpoint 与第二十三个私密版本发布 |

## 状态规则

```text
proposed → approved → in_progress → completed
                         ├→ blocked → in_progress
                         └→ cancelled
```

- 同一时间只保留一个主计划为 `in_progress`。
- `blocked` 必须写明阻塞原因、解除条件和可继续推进的非阻塞事项。
- `completed` 必须满足计划内全部验收条件，并记录最终验证结果。
- `auto` 计划可在自治边界内连续推进；`manual` 计划和任何外部发布都保留人工确认点。

## 提案入口

新的不满意点、技术债或产品机会先复制 [[plans/README#计划模板]]，创建下一个递增编号的 `proposed` 计划，再添加到上表。不要只在对话、代码注释或提交信息里留下待办。
