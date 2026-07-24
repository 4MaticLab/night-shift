# GitHub Actions 质量门禁

- 状态：`in_progress`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex
- 分支：`codex/ci-quality-gate`
- 依赖：GitHub Actions 可用于当前仓库；现有 npm、Playwright、Vinext 与 Hardhat 验证命令可在无部署密钥时运行
- 推进模式：`manual`

## 动机

仓库当前没有 GitHub Actions workflow，Pull Request 主要依赖作者本机验证和 Vercel 状态。完整 Playwright 回归在本机约需数分钟，Windows 队友运行整套验证的成本尤其高；同时近期 PR #47 证明单测、lint 与构建通过仍可能遗漏刷新恢复回归。需要把仓库既有质量基线变成每个 PR 都能获得的、无密钥且可复现的远端证据。

## 范围

- 新增面向 `main` 的主 CI workflow，覆盖快速质量检查、Next/Vinext/合约平台验证、Chrome Playwright E2E 与稳定的汇总门禁。
- 为主 CI 配置 Node 22、npm 下载缓存、最小 GitHub Token 权限、同分支旧运行取消、超时和失败报告留存。
- 新增手动与定时 Windows smoke workflow，验证核心开发链路的跨平台兼容性，但不在每个 PR 重跑完整 E2E。
- 更新代理手册与质量基线，区分本地最小验证、PR 远端完整验证和失败后的复现责任。
- PR 正文关闭 GitHub issue #46，并在远端 CI 全绿后以 merge commit 合入 `main`。

## 非目标

- 不在本计划中修改仓库套餐、可见性、branch protection 或 GitHub ruleset。
- 不把 Vercel 部署状态纳入 CI 汇总门禁，也不处理外部贡献者的 Vercel 团队权限。
- 不引入部署、链上写入、生产密钥或 `pull_request_target`。
- 不在第一版增加多浏览器 E2E、每个 PR 的 Windows 矩阵、测试分片或复杂路径过滤。
- 不改变产品行为、故事内容、存档结构或现有测试断言。

## 任务

- [ ] 新增主 CI workflow，包含 `Quality`、`Platform`、`End-to-end` 与 `CI Gate`。
- [ ] 让主 CI 覆盖质量基线中的 npm、lint、Next、Vinext render、Hardhat、docs 与 Playwright 命令。
- [ ] 为 Playwright 失败上传短期报告与 trace，并确保 workflow 无需仓库 secrets。
- [ ] 新增每周与手动触发的 Windows smoke workflow。
- [ ] 更新 `AGENTS.md` 与 `docs/quality-baseline.md`，记录本地和远端验证职责。
- [ ] 完成本地验证、远端 PR CI 验证和 merge commit 合并。

## 验收标准

- 打开或更新面向 `main` 的 PR 时，主 CI 自动运行；push 到 `main` 与手动触发也受支持。
- 同一 PR 或分支的新提交会取消旧运行，GitHub Token 权限只读。
- `Quality` 运行 `npm test`、`npm run lint`、`npm run build` 与 `npm run docs:check`。
- `Platform` 运行 `npm run test:render`、`npm run contract:compile` 与 `npm run contract:test`。
- `End-to-end` 在临时 Ubuntu runner 安装 Chrome 依赖并运行全部 Playwright 测试；失败时上传 `playwright-report` 与 `test-results`。
- `CI Gate` 始终给出单一、稳定的汇总结论，任一必需 job 失败或取消时自身失败。
- Windows smoke 可按计划定时或手动运行 `npm ci`、单测、lint、Next build 与 docs check，不依赖 POSIX-only Sites 脚本。
- 稳定文档明确：开发者本地运行与改动相关的最小验证，完整 PR 门禁由 GitHub Actions 提供；CI 失败必须复现和修复。
- 最终 PR 不新增已完成计划文件，并以 merge commit 合入 `main`。

## 验证

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:render`
- `npm run contract:compile`
- `npm run contract:test`
- `npm run docs:check`
- `npm run test:e2e`
- `git diff --check`
- GitHub Actions：`Quality`、`Platform`、`End-to-end`、`CI Gate`
- GitHub Actions：手动触发一次 `Windows Smoke`，或在 PR 合并前审查其 workflow 结构并记录未触发原因

## 决定记录

- 2026-07-24：用户明确授权设计、施工、推送、创建 PR 并在验证通过后合并；计划以 `manual` 模式直接进入 `in_progress`。
- 2026-07-24：第一版对所有代码 PR 运行完整主门禁，不使用路径过滤；先换取稳定、容易理解的 check，再根据实际 Actions 用量优化。
- 2026-07-24：Ubuntu/Chrome 是合并权威环境；Windows 只做定时与手动 smoke，避免把队友本地困难转化为每个 PR 的双平台成本。
- 2026-07-24：Vercel 状态与 GitHub CI 解耦，外部贡献者无需为测试取得部署团队权限。

## 相关文档

- [[AGENTS]]
- [[docs/quality-baseline]]
- [[docs/architecture]]
- [[plans/README]]
- [GitHub issue #46](https://github.com/4MaticLab/night-shift/issues/46)
