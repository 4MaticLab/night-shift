# Night Shift Plans Index

本文件是计划的唯一总索引。具体方案、过程与验证证据写在 `plans/`；这里维护排序、状态和下一步。状态定义见 [[plans/README]]。

## 当前焦点

当前主计划是 [[plans/0005-city-postcards-and-return-ritual]]：把每夜归来做成一张可收藏、可复述旅程的城市明信片，继续强化异步等待的期待感。

## 计划清单

| 计划 | 状态 | 模式 | 优先级 | 进度 | 下一步 |
|---|---|---|---:|---:|---|
| [[plans/0001-hackathon-mvp]] | `completed` | `manual` | P0 | 7/7 | 已发布首个可玩版本 |
| [[plans/0002-docs-and-plans-system]] | `completed` | `manual` | P0 | 6/6 | 按新规范维护后续工作 |
| [[plans/0003-mvp-quality-hardening]] | `completed` | `auto` | P0 | 6/6 | 已完成结构、真实夜班、证物关系与自动化加固 |
| [[plans/0004-literary-city-and-waiting-loop]] | `completed` | `auto` | P0 | 8/8 | 已发布第一轮北极星升级 |
| [[plans/0005-city-postcards-and-return-ritual]] | `in_progress` | `auto` | P0 | 5/6 | 保存 Git checkpoint 并私密发布 |

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
