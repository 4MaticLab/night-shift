# 0036 — 桌面证物拖动浏览器回归可靠性

- 状态：`proposed`
- 优先级：P1
- 创建：2026-07-23
- 更新：2026-07-23
- 负责人：Codex / Human
- 依赖：[[plans/0021-cross-device-interaction-pass]]
- 推进模式：`auto`

## 动机

计划 0035 的完整 Playwright 回归在当前本机 Chrome 上稳定出现一条既有失败：`remembers a hand-arranged evidence desk after reload` 的鼠标拖动没有触发 React Flow 节点落盘，其他 29 条路径全部通过。该测试与 CASE 004 变更无文件交集，单独复跑仍失败；需要在不降低移动端滚动护栏的前提下，确认是产品拖动回归、React Flow／Chrome 输入变化，还是测试手势不可靠。

## 范围

- 在当前 Chrome 与仓库依赖版本下复现桌面图钉拖动。
- 区分节点实际未移动、`onNodeDragStop` 未触发和 Zustand 持久化未写入三种原因。
- 修复产品交互或加固浏览器手势，保持“只拖图钉、点击卡片选证物”的边界。
- 重新验证刷新恢复、一键恢复默认摆放与 390 × 844 页面滚动。

## 非目标

- 不改变案件板推理规则、默认坐标或移动端禁用拖动的决定。
- 不通过跳过测试、直接写 localStorage 或放宽断言隐藏问题。

## 任务

- [ ] 建立最小可观察复现，记录节点 transform、拖动事件和 store 写入。
- [ ] 修复根因并补充稳定断言。
- [ ] 运行相关单元测试、桌面拖动路径、移动案件板路径与完整 Playwright。
- [ ] 更新质量基线与决定记录（如涉及交互契约变化）。

## 验收标准

- 桌面端从图钉拖动证物后写入有限坐标，刷新恢复同一位置。
- 卡片主体点击仍只选择证物，不误触拖动。
- 390 × 844 继续隐藏图钉拖动并允许页面纵向滚动。
- 完整 Playwright 不需要跳过或重试该路径即可通过。

## 验证

- `npm test`
- `npm run lint`
- `PLAYWRIGHT_PORT=<独立端口> npx playwright test tests/e2e/night-shift.spec.ts --grep "hand-arranged evidence desk|opens long collections"`
- `npm run test:e2e`

## 决定记录

- 2026-07-23：问题在计划 0035 的 CASE 004 新增路径之外单独复现；不把未经验证的 React Flow 改动混入内容扩展 PR。

## 相关文档

- [[docs/architecture]]
- [[docs/quality-baseline]]
- [[plans/0021-cross-device-interaction-pass]]
