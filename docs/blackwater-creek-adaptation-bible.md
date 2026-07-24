# 《黑水溪》原型退役记录

## 当前状态

《黑水溪》不再是 Night Shift 的可玩案件。CASE 003、内容数据、独立沙盒引擎、页面、存档读取与自动化路径已从现行产品移除；这里只保留一个历史双链目标，避免冻结的 legacy 计划失去上下文。

原型曾尝试把双入口、乱序地点、污染与人物状态放进案件书架，并为它建立独立导航和 `night-shift-sandbox-v1` 存档。实践证明它虽然复用了 `SleepSession`，但玩家身份、页面结构和进度生命周期都与 Night Shift 的“你睡了，我干活”主循环不同，等同于在同一首页嵌入另一款游戏。

## 撤销结论

- 案件可以更换题材、人物、地区、谜面和固定真相，但必须共享白天推理、睡前交接、林渡夜间调查与清晨归报的核心生命周期。
- 不再用 `CampaignManifest.format` 为另一套游戏生命周期开分支，也不保留独立沙盒 store 或案件专属顶层页面。
- 已存在于玩家浏览器的旧沙盒 localStorage 不主动删除，应用只是不再读取；旧 `case-003` 活动案件会由合法案件白名单安全回落到默认 CASE 001。
- 原实现、完整文案和测试证据仍可从 Git 历史与 legacy 计划恢复，不属于当前稳定能力。

## 相关文档

- [[docs/product-overview]]
- [[docs/campaign-authoring]]
- [[docs/architecture]]
- [[docs/decision-log]]
- [[plans/0026-blackwater-creek-sandbox-adaptation]]
- [[plans/0027-sandbox-delayed-expedition-loop]]
