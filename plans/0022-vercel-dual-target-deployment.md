# 0022 — Vercel／Sites 双目标构建与部署闭环

- 状态：`in_progress`
- 优先级：P0
- 创建：2026-07-23
- 更新：2026-07-23
- 负责人：Codex
- 依赖：[[plans/0021-cross-device-interaction-pass]]
- 推进模式：`manual`

## 动机

GitHub `main` 已接入 Vercel，但仓库默认 `build` 脚本仍执行面向 Cloudflare Worker 的 `vinext build`。该构建成功生成 `dist/` 后，Vercel 的 Next.js 适配器继续寻找 `.next/` 并终止部署。大于 500 kB 的客户端 chunk 只是性能警告，不是此次失败原因。

项目需要让原生 Next.js 成为 Vercel 的默认构建目标，同时保留已有 Vinext／Sites 本地预览、Worker 构建与服务端渲染护栏，避免为修一个平台破坏另一个平台。

## 范围

- 将默认 `dev`、`build`、`start` 调整为原生 Next.js/Vercel 流程。
- 为 Vinext／Sites 保留命名清晰的独立脚本，并让 Worker 渲染测试继续使用对应产物。
- 隔离仅供 Cloudflare 和示例使用的 TypeScript 文件，使 `next build` 只检查产品应用及共享代码。
- 固定 Vercel 使用的 Node 22 主版本，避免未来自动跃迁到不兼容的大版本。
- 本地验证两套生产构建、测试和文档，再直接推送已获用户批准的 GitHub `main`。
- 持续检查该提交对应的 Vercel 部署状态；若失败，读取新日志并继续修复，直到成功或出现必须由用户处理的外部权限阻塞。

## 非目标

- 不在本轮优化 500 kB chunk 警告或重构剧情模块；它不阻塞部署。
- 不删除 `.openai/hosting.json`、Vinext、Vite、Wrangler 或 Sites 能力。
- 不改变游戏内容、存档、交互、美术与线上访问策略。
- 不创建额外 PR；用户明确授权直接更新 `main`。

## 任务

- [x] 从 Vercel 日志与本地原生构建复现中确认根因。
- [x] 建立 Next.js/Vercel 与 Vinext/Sites 双目标脚本及类型边界。
- [x] 通过原生 Next、Vinext Worker、单元、Lint、E2E、渲染和文档验证。
- [ ] 提交并推送 GitHub `main`。
- [ ] 监测并修复 Vercel 部署，记录最终可访问结果。

## 验收标准

- `npm run build` 由 Next.js 生成可供 Vercel 使用的 `.next/`，没有 Cloudflare 专用类型错误。
- `npm run build:sites` 继续生成现有 `dist/server/index.js`，`npm run test:render` 继续通过。
- 47 个 Vitest、13 条 Playwright、ESLint 与双链检查保持通过。
- GitHub `main` 包含双目标配置且工作区干净。
- Vercel 对新提交的生产部署状态成功，不再报告缺少 `.next`。

## 验证

- `npm run build`
- `npm run build:sites`
- `npm test`
- `npm run lint`
- `npm run test:render`
- `npm run test:e2e`
- `npm run docs:check`
- GitHub commit status／Vercel deployment status

## 决定记录

- 2026-07-23：用户明确授权持续推进到 Vercel 可部署，并允许直接更新 GitHub `main`；本计划视为已批准并进入 `in_progress`。
- 2026-07-23：Vercel 失败发生在 `vinext build` 明确成功之后；平台随后寻找 `.next/`。本地 `next build` 进一步暴露 `db/index.ts` 的 `cloudflare:workers` 类型错误，证明需要同时修默认构建目标与 TypeScript 范围。
- 2026-07-23：保留双目标，而不是用 Vercel 设置把 `dist/` 假装成 Next 输出；Cloudflare Worker 包与 Vercel Next Build Output 不是同一种运行时契约。
- 2026-07-23：默认脚本已切为 `next dev/build/start`，Sites 使用并列的 `dev:sites/build:sites/start:sites`；`test:render` 明确消费 Worker 构建。Node 固定为 `22.x`，原生 Next 类型检查排除未被产品导入的 Cloudflare 脚手架目录。
- 2026-07-23：首次原生构建继续发现 `getLatestSocietyReply` 的类型谓词依赖 `Boolean(record)`，Next 严格检查不能据此缩窄；改为显式 `record !== undefined` 后，Next 16.2.6 已完成编译、类型检查、页面数据收集与动态 SSR 路由生成，Vinext Worker 构建也继续通过。
- 2026-07-23：本地交付门禁全部通过：原生 Next 与 Vinext Worker 双生产构建、47 个 Vitest、13 条以 `next dev` 为服务端的 Playwright、ESLint、Worker 服务端渲染冒烟，以及 48 份 Markdown 的双链检查。

## 相关文档

- [[docs/architecture]]
- [[docs/quality-baseline]]
- [[plans/0021-cross-device-interaction-pass]]
