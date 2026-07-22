# 文档维护指南

## 信息放在哪里

| 内容 | 位置 | 示例 |
|---|---|---|
| 已实现且相对稳定的事实 | `docs/` | 状态模型、故事真相、视觉规则 |
| 将要改变什么、任务与验收 | `plans/` | 重构、体验改进、质量审计 |
| 所有文档入口 | [[docs/index]] | 分类索引 |
| 所有计划状态 | [[PLANS]] | 优先级、进度、下一步 |
| 代理工作规则 | [[AGENTS]] | 迭代循环和护栏 |

## 双链语法

双链以仓库根目录为基准并省略 `.md`：

```text
[[docs/architecture]]
[[docs/architecture#状态模型]]
[[docs/architecture|架构说明]]
[[plans/0003-mvp-quality-hardening]]
```

`README.md`、`AGENTS.md`、`PLANS.md` 和 `docs/**/*.md`、`plans/**/*.md` 都会被 `npm run docs:check` 检查。图片、代码文件与外部网页仍使用标准 Markdown 链接。

## 更新触发条件

- 产品定位、故事事实或用词改变：更新 [[docs/product-overview]] 或 [[docs/story-bible]]。
- 状态、模块职责、存档或数据契约改变：更新 [[docs/architecture]]。
- 色板、字体、生成 Prompt 或资产路径改变：更新 [[docs/art-direction]] 与 [[docs/asset-list]]。
- 验证流程或已知边界改变：更新 [[docs/quality-baseline]]。
- 重大取舍改变：向 [[docs/decision-log]] 追加记录，保留旧决定的上下文。
- 新需求、新不满意点或技术债：创建计划并更新 [[PLANS]]，不要提前修改稳定文档。

## 完成定义

一项涉及行为变化的工作，只有在代码、测试、计划进度、相关文档和索引一致时才算完成。文档改动至少运行：

```bash
npm run docs:check
```

## 相关文档

- [[AGENTS]]
- [[docs/index]]
- [[PLANS]]
- [[plans/README]]

