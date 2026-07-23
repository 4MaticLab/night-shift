# 文档维护指南

## 信息放在哪里

| 内容 | 位置 | 示例 |
|---|---|---|
| 已实现且相对稳定的事实 | `docs/` | 状态模型、故事真相、视觉规则 |
| 当前主题分支将改变什么、任务与验收 | `plans/<branch-slug>.md` | 重构、体验改进、质量审计 |
| 所有文档入口 | [[docs/index]] | 分类索引 |
| 当前 checkout 的活跃计划 | [[PLANS]] | 分支、状态、进度、下一步 |
| 代理工作规则 | [[AGENTS]] | 迭代循环和护栏 |

计划是施工期信息，不是完成后的文档层。复杂任务以计划提交开工，阶段中持续更新，验收完成后把稳定事实沉淀到 `docs/`，并在 PR 前删除计划。合入后的过程从 Git 历史取回。

## 双链语法

双链以仓库根目录为基准并省略 `.md`：

```text
[[docs/architecture]]
[[docs/architecture#状态模型]]
[[docs/architecture|架构说明]]
plans/fix-case-library-entry.md
```

`README.md`、`AGENTS.md`、`PLANS.md` 和 `docs/**/*.md`、`plans/**/*.md` 都会被 `npm run docs:check` 检查。图片、代码文件与外部网页仍使用标准 Markdown 链接。

临时计划可以在活动期间被稳定文档链接，但退役前必须移除或改写这些反链；长期文档不得指向已经删除的计划。0001–0043 legacy 计划及其旧反链暂时例外。

## 更新触发条件

- 产品定位、故事事实或用词改变：更新 [[docs/product-overview]] 或 [[docs/story-bible]]。
- 状态、模块职责、存档或数据契约改变：更新 [[docs/architecture]]。
- 色板、字体、生成 Prompt 或资产路径改变：更新 [[docs/art-direction]] 与 [[docs/asset-list]]。
- 验证流程或已知边界改变：更新 [[docs/quality-baseline]]。
- 重大取舍改变：向 [[docs/decision-log]] 追加记录，保留旧决定的上下文。
- 复杂的新需求、新不满意点或技术债：在主题分支创建临时计划并更新 [[PLANS]]，不要提前修改稳定文档。
- 计划完成：把最终事实和长期决定迁入相应 `docs/`，提交完成证据，再删除临时计划与活动索引项。

## 完成定义

一项复杂工作只有在代码、测试、计划验收和稳定文档一致时才算完成。创建 PR 前还必须完成计划退役，确保工作树不永久积累已完成计划。文档改动至少运行：

```bash
npm run docs:check
```

临时计划的提交与取回方式见 [[plans/README#提交与生命周期]] 和 [[plans/README#从 Git 历史取回计划]]。

## 相关文档

- [[AGENTS]]
- [[docs/index]]
- [[PLANS]]
- [[plans/README]]
