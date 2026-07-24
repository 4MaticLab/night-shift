# 游戏页面薄路由

- 状态：`in_progress`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex
- 分支：`codex/game-surface-routing`
- 依赖：无
- 推进模式：`auto`

## 动机

当前产品已经使用 Next App Router，但案件书架、序章、五个底部主页面、夜班运行与结局仍全部由 `app/page.tsx` 内的组件状态和条件渲染编排。浏览器地址不能表达当前页面，前进／后退和直接访问缺少语义，案件库刷新还需要 `sessionStorage` 补丁。将稳定页面提升为薄路由，可以让 URL 管理位置、Zustand 继续管理确定性案件进度，并保持 local-first 存档与阶段状态机不变。

## 范围

- 为案件书架、案件序章、五个底部主页面、夜班运行和结局建立稳定 App Router 路径。
- 抽取共享客户端边界、游戏外壳与水合后的确定性路由守卫。
- 把底部导航、案件生命周期动作和 Demo 快捷动作迁移为客户端路由导航。
- 让新好友线索链接落到案件板路由，同时兼容既有根路径 query 链接。
- 更新架构文档与自动化，覆盖直接访问、刷新、前进／后退、强制阶段和双构建目标。

## 非目标

- 不改变 `night-shift-save-v1` 的字段、版本、迁移或案件隔离模型。
- 不把 `campaignId`、章节、睡眠会话、结算结果或弹层状态写入路径。
- 不改变案件事实、结局规则、页面视觉、文案或美术资产。
- 本次不启用 Next Cache Components，也不承诺跨路由保留组件局部搜索、展开或滚动状态。
- 不把 Demo、睡眠硬件、信笺或 Injective 铸造弹层提升为独立路由。

## 任务

- [x] 建立共享 route group、客户端提供器、页面路径和游戏布局。
- [x] 实现可单测的路径解析／阶段守卫，并迁移所有页面导航。
- [x] 迁移好友线索 query 入口和新分享 URL，保留旧链接兼容。
- [x] 更新架构稳定事实与路由自动化。
- [x] 通过单测、lint、文档、Next 构建、Vinext/Sites 构建和针对性 Playwright。
- [ ] 保存并发布通过验证的 Sites 版本。

## 验收标准

- `/`、`/case-intro`、`/game/tonight`、`/game/report`、`/game/board`、`/game/collection`、`/game/archive`、`/game/night` 与 `/game/ending` 都有明确页面职责。
- 未开案、普通白天、清晨、夜班和结局状态对直接访问与刷新产生确定、无循环的规范路径。
- 底部导航使用真实链接，浏览器前进／后退可恢复合法页面；状态机强制阶段无法被历史导航绕过。
- 刷新案件库不再依赖 `night-shift-view` sessionStorage，现有案件存档不迁移也不重置。
- 新旧好友线索链接都经过案件／线索白名单校验，成功后进入案件板并清理 query，非法链接不污染存档。
- Vercel Next 构建和 Vinext/Sites 构建均通过，现有主流程和新增路由 E2E 均通过。

## 验证

- `npm test`
- `npm run lint`
- `npm run docs:check`
- `npm run build`
- `npm run build:sites`
- `npx playwright test tests/e2e/night-shift.spec.ts`
- 对构建产物运行现有 rendered HTML 验证；必要时增加多路径断言。

## 决定记录

- 2026-07-24：用户批准按“URL 管位置、Zustand 管进度”的薄路由方案施工。
- 2026-07-24：首阶段使用显式页面文件和共享布局，不启用 Cache Components，不把案件 ID 放入路径。
- 2026-07-24：普通页面导航写入历史；夜班与结局等状态机强制转场使用 replace 规范路径。
- 2026-07-24：Next 生产构建、118 个 Vitest 用例与 6 条路由／分享针对性 Playwright 首轮通过；进入完整双构建和浏览器回归。
- 2026-07-24：Vinext/Sites 构建和九条页面的 Worker SSR 通过；完整 Playwright 首轮暴露 7 处旧测试假设，修正链接角色、英文匹配与开发模式图片 URL 断言后，51/51 完整回归通过。

## 相关文档

- [[docs/architecture]]
- [[docs/product-overview]]
- [[docs/quality-baseline]]
- [[docs/viewport-checklist]]
- [[plans/README]]
