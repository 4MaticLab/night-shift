# Night Shift Plans Index

本文件是计划的唯一总索引。具体方案、过程与验证证据写在 `plans/`；这里维护排序、状态和下一步。状态定义见 [[plans/README]]。

## 当前焦点

当前主计划是 [[plans/0010-unasked-for-souvenirs-and-pocket-drawer]]：让林渡每夜带回一件玩家没有精确指定的城市小物，把旅行式等待补上真正可期待的意外成果。

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
| [[plans/0010-unasked-for-souvenirs-and-pocket-drawer]] | `in_progress` | `auto` | P0 | 5/6 | Git checkpoint 后私密发布第十二版 |

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
