# Night Shift Agent Handbook

本文件是仓库内所有开发代理的第一入口。开始工作前先阅读本文件，再读取 [[PLANS]] 和 [[docs/index]]。仓库以代码、文档、临时计划同步演进为原则：实现说明“现在是什么”，计划只在复杂任务施工期间说明“这条分支正在怎样改变”。

## 快速索引

- 产品与世界观：[[docs/product-overview]]、[[docs/story-bible]]、[[docs/rain-radio-story-bible]]、[[docs/thirteenth-loaf-story-bible]]、[[docs/chihaya-noa-story-bible]]
- 案件包创作：[[docs/campaign-authoring]]
- 北极星与参考原则：[[docs/north-star]]
- 工程与状态模型：[[docs/architecture]]
- 剧本翻译：[[docs/translation-guide]]
- 睡眠硬件与隐私：[[docs/sleep-hardware-bridge]]、[[docs/privacy-and-guardrails]]
- 链上藏品：[[docs/injective-keepsake-mint]]
- 视觉与素材：[[docs/art-direction]]、[[docs/asset-list]]、[[docs/art-prompts/global-style]]、[[docs/art-prompts/lin-du-handoff-portrait]]、[[docs/art-prompts/city-witness-portraits]]、[[docs/art-prompts/foglight-districts]]、[[docs/art-prompts/four-act-headers]]、[[docs/art-prompts/thirteenth-loaf-visual-archive]]、[[docs/art-prompts/chihaya-noa-visual-archive]]
- 演示与验收：[[docs/demo-script]]、[[docs/quality-baseline]]
- 文档维护规范：[[docs/documentation-guide]]
- 当前 checkout 的活跃计划：[[PLANS]]
- 计划维护规范：[[plans/README]]

## 多人协作与 PR 规范

- `main` 是受保护的集成分支。任何代码、文档、计划、资产或配置变更都必须从最新 `origin/main` 创建主题分支，通过面向 `main` 的 Pull Request 合入；禁止任何人或代理直接向 `main` push，包括 force push。
- 开工前先确认工作区干净并 `git fetch origin`，再从最新主线创建职责单一、名称清晰的分支，例如 `feat/...`、`fix/...`、`docs/...` 或 `codex/...`。不得为了省事直接在 `main` 上累计待发布提交。
- 多人并行期间定期同步 `origin/main`；发现主线变化时在主题分支内 rebase 或合并并解决冲突，不覆盖、丢弃或静默改写队友成果。共享分支禁止未经协商的历史重写。
- 准备交付时只 push 当前主题分支并创建 PR。PR 必须说明范围、计划／文档影响和验证证据；测试与必要评审未通过前不得合入。即使是文档、小修或紧急修复也遵循同一流程。
- 使用临时计划的 PR 禁止 squash merge；默认使用 merge commit，确保计划的创建、推进、完成和删除提交在 `main` 历史中可追溯。
- 完成范围内实现并通过验证后，默认授权代理 push 当前主题分支并创建面向 `main` 的 PR，不必再次询问；只有用户明确要求仅保留本地、凭据或冲突阻塞、验证失败等异常情况才停下。合并 PR 始终是后续独立动作，不因默认开 PR 而自动执行。

## 复杂任务与临时计划循环

简单修复、单点文案和范围明确且一次验证即可完成的小改动不强制创建计划。满足任一条件时视为复杂任务：跨多个功能域或稳定文档、需要分阶段验收、预计包含多笔实现提交、存在迁移／隐私／发布风险，或用户明确要求计划。

1. 从最新 `origin/main` 创建主题分支，读取 [[PLANS]]；它只索引当前 checkout 的活跃计划，不承担跨分支全局排期。
2. 在任何实现前创建 `plans/<branch-slug>.md`，在 [[PLANS]] 登记。计划名使用分支名把 `/` 换成 `-`，不使用全局递增编号。
3. 计划必须写清动机、范围、非目标、任务、验收、验证、负责人、分支和推进模式。第一笔提交只能包含计划与活动索引，提交信息为 `plan: <slug>`。
4. `auto` 计划满足自治边界后可直接进入 `in_progress`；`manual` 计划必须有用户批准。多人可在各自主题分支同时拥有 `in_progress`，不再要求全仓库唯一。
5. 按计划施工；每个可验证阶段同步勾选任务、记录范围变化与决定，并把计划更新纳入对应阶段提交。稳定事实仍同步到 `docs/`。
6. 所有验收满足后，把最终验证证据写入计划并提交 `plan: complete <slug>`。未完成项必须进入新的临时计划或明确取消原因。
7. 创建 PR 前删除该计划并从 [[PLANS]] 移除，提交 `plan: retire <slug>`，运行 `npm run docs:check`。PR 正常 diff 不应新增已完成计划文件。
8. PR 正文记录计划路径以及创建、完成、退役提交；使用 merge commit 合入。历史查询见 [[plans/README#从 Git 历史取回计划]]。

## 文档规范

- `docs/` 只记录相对稳定、对未来工作有复用价值的知识；临时待办、一次性排查过程和未来设想写入 `plans/`。
- 每篇专题文档只解决一个明确问题，文件名使用小写 kebab-case。
- 内部 Markdown 导航使用仓库根目录相对的双链，省略 `.md`，例如 `[[docs/story-bible]]`；允许 `[[docs/story-bible#固定事实]]` 和 `[[docs/story-bible|故事圣经]]`。
- 新的稳定文档必须被 [[docs/index]] 或另一篇已索引文档引用，且应包含“相关文档”段落，避免孤岛；临时计划只需在当前分支的 [[PLANS]] 登记。
- 代码、产品行为或资产真相发生改变时，在同一个变更中更新对应文档。文档不得描述尚未实现的能力；未来能力应链接到相应计划。
- 重大、难以逆转的取舍追加到 [[docs/decision-log]]，不要悄悄覆盖历史原因。

## Plans 规范

- `plans/README.md` 是永久规范；任务计划位于 `plans/<branch-slug>.md`，只在对应主题分支的施工生命周期存在。
- 计划文件不使用全局编号；分支 `fix/case-library-entry` 对应 `plans/fix-case-library-entry.md`。
- 状态只能是 `proposed`、`approved`、`in_progress`、`blocked`、`completed`、`cancelled`。
- 每个计划必须写明动机、范围、非目标、任务、验收标准、验证方式、决定记录和相关文档。
- `proposed` 表示候选；`approved` 表示可进入排期；`in_progress` 表示正在执行。`manual` 提案不会自动获批，`auto` 提案只能按下一条自治边界晋级。
- 每个计划标记推进模式：`auto` 或 `manual`。`auto` 只适用于仓库内、可回滚、已有产品目标内、无外部副作用的改进；涉及发布、外部消息、数据删除、破坏性迁移、付费资源、权限或产品方向变化时必须使用 `manual`。
- 代理发现的 `auto` 提案，只有在范围、非目标、验收和验证都已写清且依赖满足后，才能自行从 `proposed` 调整为 `approved`；不得跳过计划直接开工。
- [[PLANS]] 只记录当前 checkout 中仍活跃的计划；多个主题分支可并行推进，跨分支状态以 GitHub PR／分支为准。
- 发现新问题时，若不属于当前验收范围，创建或补充 `proposed` 计划，不把它偷偷塞进当前任务。
- `completed` 与 `cancelled` 是退役前的短暂终态：先提交最终证据或取消原因，再从工作树删除。长期事实进入 `docs/`，过程从 Git 历史取回。
- 0001–0043 是旧制度的 legacy 计划，只读保留，不作为新计划命名或生命周期模板。
- 完整模板和字段说明见 [[plans/README]]。

## 工程护栏

- 核心故事事实必须是确定性内容；生成能力不得改变人物关系、线索、结局条件或因果。
- 睡眠时长只能改变内容丰富度，不能让主线失败或惩罚玩家。
- 默认 local-first；没有环境变量、登录、后端或 API Key 时必须能完成五夜主循环。
- 健康数据默认最小化且可撤销；设备信号只丰富叙事，不得诊断、惩罚、锁线索或伪装未实现的真实连接，详见 [[docs/privacy-and-guardrails]]。
- 保持“文学性地下都市 × 温暖异步等待”的原创统一语言，参见 [[docs/north-star]] 与 [[docs/art-direction]]。
- 剧本翻译一次只处理一个案件；必须先读目标故事圣经与 [[docs/translation-guide]]。中英文共享稳定 ID、关系、规则和存档，全部覆盖与验证完成前不得在 `campaignSupportsLocale` 开启目标语言。个人 Skill 可用时调用 `$night-shift-campaign-translation`。
- 本地提交前按改动范围运行最小验证：代码至少运行 `npm test` 与 `npm run lint`，仅改文档至少运行 `npm run docs:check`，构建配置或入口变化另运行 `npm run build`。
- 面向 `main` 的 PR 必须等待 GitHub Actions `CI Gate` 成功。远端门禁**只**跑 `Quality`（单元／内容测试、lint、Next 构建、文档双链），目标是快速挡住装不上／测不过／构不出来，而不是做完整产品验收。
- Vinext render、Hardhat、完整 Playwright **不进 PR 门禁**。它们是合并者本机可选的鲁棒性检验：需要时在合并前拉分支跑 `npm run test:robustness`（或单独的 `test:e2e` / `test:render` / `contract:*`）。贡献者默认不必跟 E2E 打乒乓球；设计／布局问题用预览与人工判断处理。
