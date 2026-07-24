# Night Shift Active Plans

本文件只索引当前 checkout 中尚未退役的临时计划，不是跨分支排期数据库，也不保存完成历史。多人并行状态以各自主题分支和 GitHub PR 为准；完整生命周期见 [[plans/README]]。

## 当前 checkout

| 计划 | 分支 | 状态 | 模式 | 进度 | 下一步 |
|---|---|---|---|---:|---|
| [[plans/codex-home-assistant-ambient-bridge]] | `codex/home-assistant-ambient-bridge` | `in_progress` | `manual` | 0% | 建立本地桥与受限 Home Assistant 协议 |

## 使用规则

- 复杂任务在实现前创建 `plans/<branch-slug>.md`，并把计划与本索引作为分支第一笔提交。
- 不分配全局编号；不同主题分支可以并行拥有 `in_progress`。
- 计划完成或取消后，先提交最终证据，再在 PR 前删除计划与本表条目。
- 主线通常保持空表；已退役计划通过 Git 历史和 PR 提交列表查询。
- 0001–0043 属于旧制度的 legacy 文件，只读保留但不再列入活动索引。

## Git 历史入口

```bash
git log main -- plans/<branch-slug>.md
git show <plan-commit>:plans/<branch-slug>.md
```

更多查询方法、模板和非 squash 合并要求见 [[plans/README#从 Git 历史取回计划]]。
