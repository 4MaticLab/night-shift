# 剧本翻译规范与 Skill

- 状态：`completed`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex
- 分支：`codex/translation-workflow`
- 依赖：现有首案中英文投影与请求语言协商
- 推进模式：`manual`

## 动机

项目即将使用更快的模型批量翻译后续案件。现有实现以中文字符串为键，通过静态英文目录递归投影 manifest；如果没有明确的术语、文学风格、事实不变量、分批策略和验证门槛，批量翻译容易产生半中半英、角色与地点漂移、规则误改或不可审查的大型差异。

## 范围

- 建立仓库级剧本翻译规范，覆盖当前架构、风格、固定术语、分批策略、文件组织、验收和 PR 要求。
- 在 `AGENTS.md` 与文档索引中提供翻译入口。
- 创建并验证个人 Skill `night-shift-campaign-translation`，供同机新 Codex 任务直接调用。
- Skill 引导代理一次只翻译一个案件，遵守临时计划和面向 main 的 PR 流程。

## 非目标

- 不在本计划中翻译第二案或第三案。
- 不修改剧情事实、稳定 ID、关系、规则、结局条件或存档。
- 不用运行时模型或外部翻译 API。
- 不重构首案现有英文目录。
- 不自动合并任何后续翻译 PR。

## 任务

- [x] 编写并索引仓库翻译规范。
- [x] 在 Agent 手册加入翻译任务入口和护栏。
- [x] 初始化并编写可发现的个人翻译 Skill。
- [x] 校验 Skill 结构与指令完整性。
- [x] 运行文档检查并完成计划生命周期。

## 验收标准

- 快模型能从 Skill 得知应读取哪些文件、如何分批、哪些事实不得改变、何时才可开启英文支持。
- 规范明确区分基础覆盖、人工润色、剧本内容与通用 UI 文案。
- 规范提供固定英文术语、英式英语与 Night Shift 文学语气要求。
- 后续翻译必须通过无汉字覆盖、稳定 ID／规则一致、相关 E2E 与仓库提交前检查。
- Skill 通过 `quick_validate.py`，仓库通过 `npm run docs:check`。

## 验证

- `python3 /Users/ame/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/ame/.codex/skills/night-shift-campaign-translation`：通过。
- `npm run docs:check`：84 个 Markdown 文件双链通过。
- `git diff --check`：通过。

## 决定记录

- 2026-07-24：用户要求提供翻译规范和可交给快模型执行的 Skill。
- 2026-07-24：规范进入仓库，Skill 安装到个人 Codex Skills 目录；Skill 以仓库规范为长期事实源，避免复制两份术语表。
- 2026-07-24：`night-shift-campaign-translation` 已由官方初始化脚本创建并通过 `quick_validate.py`；仓库 84 个 Markdown 文件双链通过。
- 2026-07-24：仓库规范、Agent 入口和个人 Skill 验收完成。

## 相关文档

- [[docs/translation-guide]]
- [[docs/campaign-authoring]]
- [[docs/architecture]]
- [[docs/story-bible]]
