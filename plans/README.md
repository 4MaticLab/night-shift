# 临时 Plans 维护规范

`plans/README.md` 是永久规范；其他任务计划是主题分支内的临时施工文件。计划服务于开工审查、阶段推进和验收，不作为完成后的稳定文档。稳定事实进入 `docs/`，计划过程由 Git 提交历史保存。

## 什么时候需要计划

简单修复、单点文案或一次验证即可完成的局部改动可以不建计划。满足任一条件时必须建计划：

- 跨多个功能域、数据结构或稳定文档。
- 需要分阶段施工或多种验证。
- 预计包含多笔实现提交。
- 涉及迁移、隐私、权限、付费、发布或其他高风险决定。
- 用户明确要求先写计划。

## 文件与分支

- 先从最新 `origin/main` 创建职责单一的主题分支。
- 计划文件使用 `plans/<branch-slug>.md`；把分支名中的 `/` 替换为 `-`。
- 示例：`fix/case-library-entry` → `plans/fix-case-library-entry.md`。
- 不再分配全局递增编号，也不复用 0001–0043 legacy 命名。
- 每个计划必须在当前 checkout 的 [[PLANS]] 中登记；该索引不是跨分支排期数据库。

## 状态

- `proposed`：候选方案，尚未获准施工。
- `approved`：范围、验收与依赖已确认。
- `in_progress`：当前分支正在施工。
- `blocked`：存在明确阻塞，并记录解除条件。
- `completed`：验收与验证已完成，等待退役。
- `cancelled`：明确停止，等待记录原因后退役。

不同主题分支可以同时存在 `in_progress`，不再要求全仓库只有一个主计划。一个分支原则上只推进一个主计划；需要独立评审或可单独交付的范围应拆分分支。

## 推进模式

- `auto`：仓库内、可回滚、已有目标范围内且无外部副作用。范围、验收、验证和依赖明确后，代理可以自行批准并连续推进。
- `manual`：涉及产品方向、外部发布或消息、权限、付费资源、破坏性迁移、用户数据，或其他需要新授权的工作。

推进模式不绕过授权；`manual` 计划只有在用户已经明确批准时才能进入 `in_progress`。

## 计划模板

```markdown
# 计划标题

- 状态：`proposed`
- 优先级：P1
- 创建：YYYY-MM-DD
- 更新：YYYY-MM-DD
- 负责人：Codex / Human
- 分支：`type/short-name`
- 依赖：无
- 推进模式：`auto`

## 动机

为什么值得做，以及当前证据。

## 范围

- 本计划会改变什么。

## 非目标

- 明确不做什么。

## 任务

- [ ] 可验证任务一。
- [ ] 可验证任务二。

## 验收标准

- 用户或工程层面的完成条件。

## 验证

- 命令、测试或人工检查。

## 决定记录

- YYYY-MM-DD：创建计划。

## 相关文档

- [[docs/index]]
```

## 提交与生命周期

### 1. 开工提交

任何实现前：

1. 写完整计划并在 [[PLANS]] 登记。
2. 运行 `npm run docs:check`。
3. 单独提交计划与索引，提交信息使用 `plan: <slug>`。

第一笔提交不得混入实现，确保评审者能看到原始范围和验收标准。

### 2. 施工推进

- 按任务列表推进；完成代表已有可检查产物，不代表“做过尝试”。
- 每个可验证阶段同步更新勾选项、决定记录和验证结果。
- 范围增加时先更新计划；可独立交付的大范围另开分支和计划。
- 稳定事实在同一阶段进入 `docs/`，不得留在临时计划里充当长期文档。

### 3. 完成或取消

- 完成：所有验收满足后，把状态改为 `completed`，记录最终命令、结果与必要人工验证，提交 `plan: complete <slug>`。
- 取消：把状态改为 `cancelled`，记录原因和未落地范围，提交 `plan: cancel <slug>`。

### 4. PR 前退役

完成或取消提交之后：

1. 删除任务计划。
2. 从 [[PLANS]] 移除对应活动项。
3. 确认稳定事实已在 `docs/`，未完成范围已有去向。
4. 运行 `npm run docs:check` 与 `git diff --check`。
5. 单独提交 `plan: retire <slug>`。

因此最终 PR 的文件差异不应新增已完成任务计划，但提交列表必须保留计划的创建、完成／取消和退役记录。

## 合并规则

依赖临时计划历史的 PR 禁止 squash merge。默认使用 merge commit，使原始提交 SHA 和计划文件历史成为 `main` 的可达祖先。若团队选择 rebase merge，必须确认逐个提交仍被保留，并在 PR 中接受 SHA 改写。

PR 正文应记录：

- 临时计划路径。
- `plan: <slug>` 开工提交。
- `plan: complete <slug>` 或 `plan: cancel <slug>` 提交。
- `plan: retire <slug>` 提交。
- 最终验证证据和稳定文档位置。

## 从 Git 历史取回计划

计划退役并合入后可用以下命令查找：

```bash
git log main -- plans/fix-case-library-entry.md
git log --diff-filter=D --summary main -- plans/fix-case-library-entry.md
git show <plan-commit>:plans/fix-case-library-entry.md
git show <complete-commit>:plans/fix-case-library-entry.md
```

若只知道 PR，可先查看其提交列表，再定位 `plan:` 提交。计划长期可追溯依赖非 squash 合并。

## Legacy 计划

`plans/0001-*.md` 至 `plans/0043-*.md` 来自旧的永久编号制度，暂时只读保留，以维持既有文档反链。它们不再进入活动索引，也不作为新任务模板。未来如需清理，应单独规划反链迁移，而不是夹带在功能 PR 中。

## 相关文档

- [[AGENTS]]
- [[PLANS]]
- [[docs/documentation-guide]]
- [[docs/decision-log]]
