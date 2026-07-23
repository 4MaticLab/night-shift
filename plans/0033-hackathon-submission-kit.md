# 0033 — 黑客松提交作战卡与独立质量门禁

- 状态：`completed`
- 优先级：P0
- 创建：2026-07-23
- 更新：2026-07-23
- 负责人：GitHub Copilot / Human
- 依赖：[[plans/0032-ai-rest-intention-ritual]]
- 推进模式：`manual`

## 动机

Night Shift 的 Hack the Rest 产品闭环已经进入主线，但提交材料仍分散在产品、演示、隐私与质量文档中。此前 PR 的 Vercel 检查还因提交作者没有项目 Team 权限而失败，容易让代码质量问题和外部部署权限问题混在一起。黑客松提交前需要一份可直接使用的赛道叙事、90 秒演示、答辩事实边界和部署排障卡，同时需要与 Vercel 账户无关的 GitHub 质量门禁。

## 范围

- 新增黑客松提交作战卡，固定主赛道、标题、短介绍、评委问答、90 秒演示、材料文案和真实边界。
- 明确虚拟硬件、AI 受限能力、医疗边界与《黑水溪》授权边界，避免现场过度宣称。
- 记录 Vercel “Git author must have access” 的真实处理方法，区分部署权限与应用构建。
- 新增 GitHub Actions 质量门禁，在 PR 与 main 上运行单元测试、Lint、文档检查和生产构建。
- 更新文档与计划索引。

## 非目标

- 不通过伪造提交作者、空提交或规避 Vercel 检查来绕过团队权限。
- 不在仓库保存 Vercel、OpenAI、Redis 或其他密钥。
- 本轮不修改游戏运行时、叙事内容、存档或 AI 数据边界。
- 不替项目负责人完成需要账户登录、邀请接受或付费计划的外部操作。

## 任务

- [x] 编写赛道定位、项目标题、三十秒陈述与差异点。
- [x] 编写 90 秒演示节拍、演示前检查与评委问答。
- [x] 固定硬件、AI、医疗与授权的真实表达边界。
- [x] 记录 Vercel 权限失败的准确处理路径。
- [x] 新增独立 GitHub Actions 质量门禁。
- [x] 更新文档／计划索引并完成验证。

## 验收标准

- 提交者可以从一份文档复制项目标题、简介与差异点，并按秒完成现场演示。
- 每个核心宣称都能指向已实现界面或稳定文档，不把虚拟硬件说成真机。
- Vercel 权限失败不会被误判为代码构建失败，也不会建议无效的重复 PR。
- 新 PR 自动出现独立 `Quality Gate`，至少覆盖 `npm test`、`npm run lint`、`npm run docs:check` 与 `npm run build`。
- 文档双链、YAML 语法和本地质量命令通过。

## 验证

- `npm test`
- `npm run lint`
- `npm run docs:check`
- `npm run build`
- `git diff --check`
- GitHub PR 上确认 `Quality Gate` 启动。

## 决定记录

- 2026-07-23：用户要求以黑客松专家身份再次提交 PR；由于功能 PR #8 已合并且分支不再包含 main 之外的代码，选择建立新的提交材料与质量门禁 PR，而不是制造空 PR。
- 2026-07-23：Vercel 失败确认为项目 Team 成员权限问题；仓库只记录处理路径，不尝试绕过外部授权。
- 2026-07-23：Hack the Rest 继续作为唯一主叙事，其他赛道只作为备选，不在 90 秒演示中分散注意力。

## 相关文档

- [[docs/hackathon-submission-kit]]
- [[docs/demo-script]]
- [[docs/quality-baseline]]
- [[docs/privacy-and-guardrails]]
