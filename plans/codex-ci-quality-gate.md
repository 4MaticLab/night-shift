# GitHub Actions 质量门禁

- 状态：`completed`
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
- 修正最新主线 E2E 在推论信笺打开时越过模态层点击底部导航的问题，使测试按真实可访问交互关闭信笺后再继续。
- 更新代理手册与质量基线，区分本地最小验证、PR 远端完整验证和失败后的复现责任。

## 非目标

- 不在本计划中修改仓库套餐、可见性、branch protection 或 GitHub ruleset。
- 不把 Vercel 部署状态纳入 CI 汇总门禁，也不处理外部贡献者的 Vercel 团队权限。
- 不引入部署、链上写入、生产密钥或 `pull_request_target`。
- 不在第一版增加多浏览器 E2E、每个 PR 的 Windows 矩阵、测试分片或复杂路径过滤。
- 不改变产品行为、故事内容、存档结构或现有测试断言。

## 任务

- [x] 新增主 CI workflow，包含 `Quality`、`Platform`、`End-to-end` 与 `CI Gate`。
- [x] 让主 CI 覆盖质量基线中的 npm、lint、Next、Vinext render、Hardhat、docs 与 Playwright 命令。
- [x] 为 Playwright 失败上传短期报告与 trace，并确保 workflow 无需仓库 secrets。
- [x] 新增每周与手动触发的 Windows smoke workflow。
- [x] 更新 `AGENTS.md` 与 `docs/quality-baseline.md`，记录本地和远端验证职责。
- [x] 完成本地完整验证并准备计划退役；远端 PR CI 与 merge commit 按退役后的交付流程执行。

## 验收标准

- 打开或更新面向 `main` 的 PR 时，主 CI 自动运行；push 到 `main` 与手动触发也受支持。
- 同一 PR 或分支的新提交会取消旧运行，GitHub Token 权限只读。
- `Quality` 运行 `npm test`、`npm run lint`、`npm run build` 与 `npm run docs:check`。
- `Platform` 运行 `npm run test:render`、`npm run contract:compile` 与 `npm run contract:test`。
- `End-to-end` 在临时 Ubuntu runner 安装 Chrome 依赖并运行全部 Playwright 测试；失败时上传 `playwright-report` 与 `test-results`。
- `CI Gate` 始终给出单一、稳定的汇总结论，任一必需 job 失败或取消时自身失败。
- Windows smoke 可按计划定时或手动运行 `npm ci`、单测、lint、Next build 与 docs check，不依赖 POSIX-only Sites 脚本。
- 稳定文档明确：开发者本地运行与改动相关的最小验证，完整 PR 门禁由 GitHub Actions 提供；CI 失败必须复现和修复。

## 验证

- `npm test` — 8 files、91 tests 通过。
- `npm run lint` — 通过。
- `npm run build` — 通过；首次重跑遇到 Google Fonts 网络连接波动，按规范重试后成功。
- `npm run test:render` — Vinext build 与 server render 1/1 通过。
- `npm run contract:compile` — Solidity 0.8.28 编译通过。
- `npm run contract:test` — Hardhat 2/2 通过。
- `npm run docs:check` — 84 篇 Markdown 双链通过。
- `CI=1 PLAYWRIGHT_PORT=31051 npm run test:e2e -- --fail-on-flaky-tests` — Chrome 39/39 通过，零 flaky。
- Ruby/Psych 解析 `.github/workflows/ci.yml` 与 `.github/workflows/windows-smoke.yml` — YAML 语法通过。
- `git diff --check` — 通过。

远端 `Quality`、`Platform`、`End-to-end`、`CI Gate` 与合并后的 `Windows Smoke` 属于计划退役后的交付验证；任一失败都会阻止合并或触发后续修复。

## 决定记录

- 2026-07-24：用户明确授权设计、施工、推送、创建 PR 并在验证通过后合并；计划以 `manual` 模式直接进入 `in_progress`。
- 2026-07-24：第一版对所有代码 PR 运行完整主门禁，不使用路径过滤；先换取稳定、容易理解的 check，再根据实际 Actions 用量优化。
- 2026-07-24：Ubuntu/Chrome 是合并权威环境；Windows 只做定时与手动 smoke，避免把队友本地困难转化为每个 PR 的双平台成本。
- 2026-07-24：Vercel 状态与 GitHub CI 解耦，外部贡献者无需为测试取得部署团队权限。
- 2026-07-24：CI 中 Playwright 固定单 worker、失败重试一次并生成报告；同时禁止复用已有服务器，避免端口上意外存在的其他工作树掩盖当前提交行为。
- 2026-07-24：首次 CI 模式运行发现 #52 新增晨报回归在推论信笺仍打开时点击被 inert 的底部导航，并用单元素断言检查两个回信按钮；产品行为正确，测试补充显式关闭动作与逐项禁用断言，不改变产品结果。
- 2026-07-24：完整 CI 模式回归发现收藏动态模块的首次冷加载可能超过 Playwright 默认 5 秒；相关页面等待提高到 15 秒，并启用 `--fail-on-flaky-tests`，重试成功不再掩盖不稳定场景。
- 2026-07-24：本地完整验证满足实现验收。按 [[plans/README]] 生命周期，远端 PR CI 与 merge 不作为退役前的虚假完成证据，而在 PR 交付阶段继续跟踪。

## 相关文档

- [[AGENTS]]
- [[docs/quality-baseline]]
- [[docs/architecture]]
- [[plans/README]]
- [GitHub issue #46](https://github.com/4MaticLab/night-shift/issues/46)
