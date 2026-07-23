# Night Shift Agent Handbook

本文件是仓库内所有开发代理的第一入口。开始工作前先阅读本文件，再读取 [[PLANS]] 和 [[docs/index]]。仓库以代码、文档、计划同步演进为原则：实现说明“现在是什么”，计划说明“接下来改变什么”。

## 快速索引

- 产品与世界观：[[docs/product-overview]]、[[docs/story-bible]]、[[docs/rain-radio-story-bible]]、[[docs/blackwater-creek-adaptation-bible]]
- 案件包创作：[[docs/campaign-authoring]]
- 北极星与参考原则：[[docs/north-star]]
- 工程与状态模型：[[docs/architecture]]
- 视觉与素材：[[docs/art-direction]]、[[docs/asset-list]]、[[docs/art-prompts/global-style]]、[[docs/art-prompts/lin-du-handoff-portrait]]、[[docs/art-prompts/city-witness-portraits]]、[[docs/art-prompts/foglight-districts]]、[[docs/art-prompts/four-act-headers]]
- 演示与验收：[[docs/demo-script]]、[[docs/quality-baseline]]
- 文档维护规范：[[docs/documentation-guide]]
- 全部计划与进度：[[PLANS]]
- 计划维护规范：[[plans/README]]

## 自动迭代循环

处理非微小任务时遵循以下循环：

1. 读取 [[PLANS]]，继续唯一的 `in_progress` 计划；若没有，则选择最高优先级且依赖已满足的 `approved` 计划。
2. 如果需求尚未形成计划，先在 `plans/` 创建 `proposed` 计划并在 [[PLANS]] 登记；不会因“顺手”而扩大范围。`auto` 计划满足下述自治边界时可自行批准并继续，`manual` 计划必须等待用户批准。
3. 开工时把计划改为 `in_progress`，只允许一个主计划处于该状态。把验收条件拆成可勾选任务。
4. 每完成一个可验证阶段，更新计划进度与决定记录；实现改变稳定事实时，同步更新 `docs/`。
5. 运行与风险相称的测试，并把验证结果写回计划。
6. 所有验收条件满足后才能标记 `completed`；未完成项必须迁移到新计划或明确说明取消原因。
7. 完成后更新 [[PLANS]]、[[docs/index]]，并运行 `npm run docs:check`。

## 文档规范

- `docs/` 只记录相对稳定、对未来工作有复用价值的知识；临时待办、一次性排查过程和未来设想写入 `plans/`。
- 每篇专题文档只解决一个明确问题，文件名使用小写 kebab-case。
- 内部 Markdown 导航使用仓库根目录相对的双链，省略 `.md`，例如 `[[docs/story-bible]]`；允许 `[[docs/story-bible#固定事实]]` 和 `[[docs/story-bible|故事圣经]]`。
- 新文档必须被 [[docs/index]] 或另一篇已索引文档引用，且应包含“相关文档”段落，避免孤岛。
- 代码、产品行为或资产真相发生改变时，在同一个变更中更新对应文档。文档不得描述尚未实现的能力；未来能力应链接到相应计划。
- 重大、难以逆转的取舍追加到 [[docs/decision-log]]，不要悄悄覆盖历史原因。

## Plans 规范

- 计划文件位于 `plans/NNNN-short-name.md`；编号递增且不复用。
- 状态只能是 `proposed`、`approved`、`in_progress`、`blocked`、`completed`、`cancelled`。
- 每个计划必须写明动机、范围、非目标、任务、验收标准、验证方式、决定记录和相关文档。
- `proposed` 表示候选；`approved` 表示可进入排期；`in_progress` 表示正在执行。`manual` 提案不会自动获批，`auto` 提案只能按下一条自治边界晋级。
- 每个计划标记推进模式：`auto` 或 `manual`。`auto` 只适用于仓库内、可回滚、已有产品目标内、无外部副作用的改进；涉及发布、外部消息、数据删除、破坏性迁移、付费资源、权限或产品方向变化时必须使用 `manual`。
- 代理发现的 `auto` 提案，只有在范围、非目标、验收和验证都已写清且依赖满足后，才能自行从 `proposed` 调整为 `approved`；不得跳过计划直接开工。
- 计划状态、优先级或完成度变化时，必须同步更新 [[PLANS]]。
- 发现新问题时，若不属于当前验收范围，创建或补充 `proposed` 计划，不把它偷偷塞进当前任务。
- 完整模板和字段说明见 [[plans/README]]。

## 工程护栏

- 核心故事事实必须是确定性内容；生成能力不得改变人物关系、线索、结局条件或因果。
- 睡眠时长只能改变内容丰富度，不能让主线失败或惩罚玩家。
- 默认 local-first；没有环境变量、登录、后端或 API Key 时必须能完成五夜主循环。
- 保持“文学性地下都市 × 温暖异步等待”的原创统一语言，参见 [[docs/north-star]] 与 [[docs/art-direction]]。
- 提交前至少运行 `npm test`、`npm run lint`、`npm run build` 和 `npm run docs:check`；仅改文档时至少运行 `npm run docs:check`。
