# feat-rain-radio-english-i18n

- 状态：in_progress
- 模式：auto
- 分支：feat/rain-radio-english-i18n
- 负责人：Qoder（用户委托）

## 动机

`case-002`《只在雨中播出的电台》此前只有中文内容。为让英文浏览器玩家获得与首案一致的完整体验，需要按 [[docs/translation-guide]] 为该案件建立英文投影，并在全部验证通过后开启 `campaignSupportsLocale`。

## 范围

- 新增 `src/i18n/campaigns/rain-radio.en.ts`：case-002 全部玩家可见字符串的英文词典（含模板合成串）。
- 更新 `src/i18n/en.ts` 合并案件词典（介于遗留总表与覆写表之间）。
- 更新 `src/i18n/core.ts`，`campaignSupportsLocale` 对 case-002 开启英文。
- 新增 `scripts/gen-rain-radio-en.mjs` 与 `scripts/rain-radio-static.mjs`：确定性生成器，保证中文弯引号键的字节级正确。
- 测试：`tests/i18n.test.ts` 新增 rain-radio 英文投影套件；`tests/content.test.ts` 更新语言开关断言。
- 文档：`docs/architecture.md` 语言解析段落同步 case-002。

## 非目标

- 不改动任何稳定 ID、关系、规则、结局条件或存档结构。
- 不翻译 case-004／case-005。
- 不修改语言协商、Cookie 或 store 逻辑。

## 任务

- [x] 阅读故事圣经与翻译规范，建立专有名词表（严洛 → Yan Luo、九十七点三兆赫 → 97.3 MHz 等）。
- [x] 翻译 presentation、五章（标题／副题／城市旁白／问题／选择／事件／日志／矛盾）。
- [x] 翻译线索、藏品、关系、结局、明信片、植物、地区。
- [x] 生成路线、四时辰回声、睡隙回声等模板合成串。
- [x] 合并进 `en.ts` 并开启 `campaignSupportsLocale`。
- [x] 新增投影测试并全量验证。

## 验收标准

- 英文投影不含任何汉字（`\p{Script=Han}` 全字符串扫描为空）。
- 稳定 ID、规则与中文 manifest 完全一致。
- `npm test`（除既有无关失败）、`npm run lint`、`npm run build`、`npm run docs:check` 通过。

## 验证方式

- `npx vitest run tests/i18n.test.ts`
- `npm test` / `npm run lint` / `npm run build` / `npm run docs:check`

## 决定记录

- 由于工具链会把中文弯引号（U+201C/U+201D）写成 ASCII 引号，翻译文件改为由 `scripts/gen-rain-radio-en.mjs` 确定性生成，静态词条与合成词条分离维护。

## 相关文档

- [[docs/translation-guide]]
- [[docs/rain-radio-story-bible]]
- [[docs/architecture]]
