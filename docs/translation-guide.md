# Night Shift 剧本翻译规范

本文规定 Night Shift 从简体中文到英式英语的剧本翻译流程。目标不是逐字替换，而是在不改变任何剧情事实、结构 ID 或游戏规则的前提下，交付可以独立阅读、语气统一、完整可测试的英文案件。

## 翻译边界

- 源语言：`zh-CN`。
- 目标语言：`en-GB`；运行时 locale ID 仍为 `en`。
- 中文 `CampaignManifest` 是唯一剧情事实源，不维护第二份英文 manifest。
- 英文是构建期提交的静态字符串投影，运行时不调用模型、翻译 API 或后端。
- 一次 PR 只翻译一个案件。通用 UI 调整与剧本翻译应能分别审查。
- 只有全部内容与关键流程通过验收后，才能在 `campaignSupportsLocale` 中开启该案英文支持。
- `englishTitle` 只用于书架预览，不代表案件已经支持完整英文。

当前完整双语案件只有 `case-001`《零点四十三分的末班车》。其他案件在英文偏好下完整回退中文，禁止展示半中半英流程。

## 当前投影结构

| 层 | 文件 | 责任 |
|---|---|---|
| 请求语言 | `src/i18n/server.ts`、`src/i18n/request-locale-provider.tsx` | Cookie 优先、`Accept-Language` 次之，在首帧前确定语言 |
| 本地化核心 | `src/i18n/core.ts` | 支持能力、递归字符串投影、缺失回退、术语规范化 |
| 基础覆盖 | `src/i18n/en-catalog.ts` | 首案 legacy 全量覆盖；不继续混入新案件 |
| 人工覆盖 | `src/i18n/en-overrides.ts` | 通用 UI、品牌术语和高价值文学润色 |
| 合并入口 | `src/i18n/en.ts` | 按优先级合并英文目录 |
| React 上下文 | `src/i18n/provider.tsx` | 提供 `t`、`localize` 与当前案件的本地化 manifest |

`translateText` 使用完整中文原文作为查找键；`localizeValue` 递归翻译对象内所有字符串。稳定 ID、数字、布尔值、数组结构、引用和规则原样保留。`englishOverrides` 在 `englishCatalog` 之后合并，因此同一键以人工覆盖为准。

## 新案件文件组织

新翻译不要继续扩大 legacy `en-catalog.ts`。每案建立独立文件：

```text
src/i18n/campaigns/<campaign-slug>.en.ts
```

文件只导出静态映射：

```ts
export const rainRadioEnglish: Record<string, string> = {
  "中文原文": "English translation",
};
```

在 `src/i18n/en.ts` 中显式导入并合并，优先级固定为：

```ts
{
  ...englishCatalog,
  ...campaignEnglish,
  ...englishOverrides,
}
```

- 案件专属剧情写入案件文件。
- 多案共用 UI 与固定品牌术语写入 `en-overrides.ts`。
- 不复制已有键；先搜索全部英文目录。
- 如果同一中文原句在两个上下文需要不同英文，当前“原文作键”架构无法安全区分。记录冲突并提出独立结构化本地化计划，不得为了制造新键而改写中文剧情。

## 不可改变的结构

翻译不得改变、增加、删除或重排以下内容：

- 案件、章节、路线、线索、关系、人物、地区、收藏品、植物、明信片、夜印、回声、密文与结局的稳定 ID。
- `clueIds`、章节编号、解锁章节、关系图、结局门槛、密文答案与白名单。
- 枚举值、资产 ID、存档键、query 参数和 API 字段。
- 插值占位符、格式标记、换行意图、时间、频率、房号和其他解谜数字。
- 人物关系、动机、行动主体、因果、知情范围和结局责任。

翻译前必须阅读目标案件故事圣经。代码与圣经出现冲突时停止翻译并报告，不自行“修顺”剧情。

## 固定术语

下表优先于直译。大小写按界面语境调整，专名拼写不得变体。

| 中文 | 固定英文 |
|---|---|
| 夜班侦探 | Night Shift Detective |
| 夜班事务所／事务所 | Night Shift Agency / the agency |
| 雾灯城 | Foglight City |
| 林渡 | Lin Du |
| 案件板 | Caseboard |
| 联合推理 | Joint Inference |
| 核心推论 | Core Inference |
| 线索 | clue |
| 证物 | evidence |
| 晨报 | Morning Report |
| 夜印 | Night Seal |
| 夜班 | night shift |
| 雾灯温室 | Foglight Greenhouse |
| 睡隙回声 | Sleep-gap Echo |
| 城市时辰／值更 | City Watch |
| 收藏 | Collection；叙事标题可用 Night Cabinet |
| 档案 | Archive；单份材料按语境用 file / dossier / record |
| 零点四十三分的末班车 | The Last Tram at 00:43 |
| 米娜·索莱尔 | Mina Solair |
| 吉迪恩·韦尔 | Gideon Vale |
| 奥林·贝尔 | Orin Bell |
| 伊芙琳·奎尔 | Evelyn Quell |
| 灯港区 | Lantern Wharf |
| 旧子午区 | Old Meridian |
| 玻璃丘 | Glass Hill |

翻译新案件前，从故事圣经提取“人物、地点、机构、物件、核心事件”五类专名表并放进该 PR 的描述。出现新的跨案件固定术语时，补充本文；仅该案使用的专名保留在案件翻译文件和故事圣经中。

## 英文语气

### 总体

- 使用自然的英式英语：`colour`、`centre`、`catalogue`、`travelling` 等。
- 保留“文学性地下都市 × 温暖异步等待”：亲密、克制、略带忧郁，但不阴冷惩罚玩家。
- 城市制度的荒诞应保持一本正经，幽默来自官僚逻辑，不来自网络梗。
- 优先清楚而有节奏的英文，不保留中文语序，不堆叠形容词。
- 可以意译标题和比喻，但不得改写事实、视角或因果。
- 避免硬汉侦探陈词、赛博朋克套话、现代社交媒体口吻和 RPG 数值术语。

### 叙述者与界面

- 林渡的现场笔记：观察具体、句子克制、允许温柔的机锋；不能全知。
- 城市机构：礼貌、精确、荒谬，像一份认真否认现实的公文。
- 证物：先写可观察事实，再写文学余味；不要替玩家直接下结论。
- UI 操作：短、直接、可执行，避免文学化到看不懂按钮行为。
- 隐私与健康文案：准确、非医疗、不夸大真实硬件能力。

### 排版

- 保留 `\n`、JSX 分行、插值和模板变量。
- 时间写作 `00:43`，章节标签保持 `Night 01` 一类既定格式。
- 英文正文使用正常句式大小写；全大写只用于既有档案标签。
- 优先使用 em dash `—` 表示叙事停顿；不要连续使用多个破折号或省略号制造戏剧性。
- 不在翻译值中引入 HTML、Markdown 或新的引号层级。

## 分批施工

为了让快模型的差异可审查，按语义域翻译，不按文件行数机械切段：

1. 案件 presentation、标题、简介与书架文案。
2. 五夜章节标题、任务、调查方向、地点和夜行记录。
3. 线索、矛盾、关系与推论。
4. 人物、地区、社团及城市制度文本。
5. 收藏品、植物、明信片、夜印、纪念物与回声。
6. 密文说明、答案反馈与可选旁注。
7. 三个结局、林渡终函和结案总账文案。
8. 通用 UI 缺失项与最终术语统一。

每批完成后运行格式检查并提交一笔职责单一的 commit。不要在一个未审查的超大提交里同时翻译全案、改本地化架构和修无关 UI。

## 四轮审查

### 1. 覆盖

- 目标 manifest 投影后的所有玩家可见字符串均无汉字。
- 不用空字符串、拼音、`TODO`、`TBD` 或复制中文冒充翻译。
- 动态组合、数组成员、嵌套回声和结局文本同样覆盖。

### 2. 事实

- 对照故事圣经逐项检查人物关系、行动主体、时间、数量和因果。
- 对比中英文 manifest 的稳定 ID 集合与 `rules` 深度相等。
- 不把含蓄事实提前说破，不把未知或传闻翻译成确定陈述。

### 3. 语言

- 搜索专名变体、美国拼写、直译腔与术语漂移。
- 朗读长段落，拆掉中文式逗号长句。
- 标题、按钮和正文分别按各自语域审查。
- 高价值段落应进入人工覆盖或得到强模型／人类复核。

### 4. 产品

- 英文首页、首夜交接、晨报、案件板、收藏、档案和结局没有可见中文。
- 文案长度不会推出卡片、按钮、对话框或移动视口。
- 好友线索、存档、结局和案件切换在中英文之间保持同一进度。

## 开启支持的顺序

必须按以下顺序推进：

1. 完成案件独立翻译文件。
2. 合并到 `englishText`，但暂不修改 `campaignSupportsLocale`。
3. 添加内容测试，证明无汉字、ID 不变、规则不变。
4. 添加或扩展英文 E2E，至少覆盖首页进入、首夜、晨报、案件板、收藏／档案和结局。
5. 修完所有覆盖、术语和布局问题。
6. 最后修改 `campaignSupportsLocale`，正式开启该案英文。
7. 重新运行完整验证。

这样任何中途提交都不会让用户进入半翻译案件。

## 最低验证

翻译 PR 至少运行：

```bash
npm test
npm run lint
npm run build
npm run docs:check
npm run test:e2e
git diff --check
```

内容测试必须证明：

- `localizeCampaign(target, "en")` 返回新对象。
- 投影后的玩家可见字符串不含 `\p{Script=Han}`。
- 中英文稳定 ID 集合完全相等。
- 中英文 `rules` 完全相等。
- 目标案件的 `campaignSupportsLocale(id, "en")` 只有在验收完成后才为 `true`。

如果完整 E2E 因外部部署权限失败，仍需区分代码失败与部署权限失败；不得用权限红灯替代本地验证。

## PR 要求

- 从最新 `origin/main` 建主题分支，一次只翻译一个案件。
- 复杂翻译先建立临时计划，按 [[plans/README]] 推进和退役。
- PR 正文列出案件、翻译域、固定专名、事实检查、验证结果和仍需人工复核的段落。
- 标记翻译目录是批量初稿还是已人工润色；不能把机器初稿描述为最终文学定稿。
- 不夹带剧情改写、规则调整、资产替换或其他产品功能。
- 默认提 Draft PR；由人类或具备足够上下文的评审者确认文学质量后再转为 Ready。
- 翻译代理不得自行合并 PR。

## 相关文档

- [[docs/campaign-authoring]]
- [[docs/architecture]]
- [[docs/north-star]]
- [[docs/story-bible]]
- [[docs/rain-radio-story-bible]]
- [[docs/thirteenth-loaf-story-bible]]
- [[docs/quality-baseline]]
- [[plans/README]]

