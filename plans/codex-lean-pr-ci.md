# 黑客松轻量 PR 门禁

- 状态：`in_progress`
- 优先级：P0
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex
- 分支：`codex/lean-pr-ci`
- 依赖：无
- 推进模式：`auto`

## 动机

四人黑客松并行、大量 AI 提 PR。当前 CI Gate 强制 Quality + Platform + 完整 Playwright（墙钟约 8 分钟，E2E 约占 7 分钟）。多数失败是 UI/选择器/设计细节或过时断言，很少真正拦住逻辑回归，却让贡献者与合并者反复跟 CI 打乒乓球。

合并者本机可以按需跑鲁棒性脚本；PR 远端只需快速挡住「装不上 / 测不过 / 构不出来 / 文档链断」。

## 范围

- PR／push 到 `main` 的 `CI Gate` 只要求 `Quality`（`npm test`、`lint`、`build`、`docs:check`）。
- 从默认 CI 去掉 `Platform` 与 `End-to-end` 阻塞任务。
- 保留本地可选脚本：`test:e2e`、`test:render`、合约命令；新增合并者用的 `test:robustness`。
- 同步 `Agents.md` 与 `docs/quality-baseline.md` 的门禁说明。

## 非目标

- 不删除 Playwright 用例文件（留给合并者本地鲁棒性）。
- 不改 Windows Smoke 周任务。
- 不改产品逻辑与 E2E 断言内容本身。
- 不在此 PR 修 option-wheel 造成的 E2E 过时选择器。

## 任务

- [ ] 计划与 PLANS 登记
- [ ] 精简 `.github/workflows/ci.yml`
- [ ] `package.json` 增加 `test:robustness`
- [ ] 更新 Agents.md / quality-baseline
- [ ] 退役计划并开 PR

## 验收标准

- PR 上 `CI Gate` 在 Quality 通过后即成功，墙钟约 1–2 分钟量级。
- 文档明确：完整浏览器／Sites／合约鲁棒性由合并者本地可选执行。
- `npm run test:robustness` 指向完整 Playwright。

## 验证

- 审阅 workflow YAML：gate 仅依赖 quality。
- `npm run docs:check`（文档改动）。

## 决定记录

- 2026-07-24：黑客松阶段门禁只保留 Quality；E2E/Platform 退出 PR 阻塞路径，改为合并者本地可选鲁棒性检验。
