# 0040 — Cookie 与浏览器语言自动本地化

- 状态：`completed`
- 优先级：P0
- 创建：2026-07-23
- 更新：2026-07-23
- 负责人：Codex
- 依赖：[[plans/0030-last-tram-english-i18n]]、[[plans/0038-first-load-experience]]
- 推进模式：`auto`

## 动机

当前语言偏好只从浏览器 `localStorage` 读取，首次访问永远以中文服务端首帧开始，英文用户必须手动切换，且刷新前可能经历语言跳变。产品已有完整首案英文版，应使用标准请求语言与 Cookie 在首次渲染前确定界面语言。

## 范围

- 以手动语言 Cookie、`Accept-Language`、中文默认值依次解析请求语言。
- 服务端 `<html lang>`、路由加载幕和客户端本地化使用同一个初始语言。
- 手动语言按钮同步 Cookie 与 `localStorage`，刷新后保持。
- 把既有 `localStorage` 偏好一次性迁移为 Cookie，保护老用户选择。
- 保留未翻译案件完整回退中文的既有能力边界。
- 覆盖解析函数、首次请求、手动覆盖、刷新持久化和 390×844 回归。

## 非目标

- 不增加语言选择弹窗、账户设置或服务端用户档案。
- 不翻译第二案与《黑水溪》。
- 不根据 IP、时区或地理位置猜测语言。
- 不让语言偏好进入任一游戏存档或案件结算。

## 任务

- [x] 复核现有本地化、服务端首帧与持久化边界。
- [x] 实现可测试的 Cookie／`Accept-Language` 语言协商。
- [x] 让布局、加载幕与客户端 Provider 共用请求语言。
- [x] 完成手动选择与旧 `localStorage` 迁移。
- [x] 增加自动化与稳定文档。
- [x] 完成浏览器、测试、lint、双构建与文档验收。

## 验收标准

- 无偏好 Cookie 时，英文浏览器首次响应直接以英文首帧与加载幕呈现；中文或未知语言安全使用中文。
- 合法 Cookie 覆盖浏览器语言；非法 Cookie 不阻断并回退浏览器协商。
- 手动切换后 Cookie 与 `localStorage` 一致，刷新不闪回另一语言。
- 旧 `localStorage` 偏好在首次 hydration 后迁移为 Cookie。
- 进入未翻译案件时仍完整回退中文，切回首案后恢复偏好语言。

## 验证

- `npm test`：71/71 通过。
- `npm run lint`：通过。
- `npm run build`：Next.js 生产构建通过。
- `npm run build:sites`：vinext/Sites 生产构建通过。
- `npm run docs:check`：69 份 Markdown、全部双链通过。
- `npm run test:e2e`：29/29 通过，包含自动语言、手动覆盖、旧偏好迁移、三个案件和 390×844 移动端。
- 本机真实浏览器通过中文、英文切换及刷新复核；直接请求验证英文 `Accept-Language` 首帧与中文 Cookie 覆盖均在服务端生效。

## 决定记录

- 2026-07-23：用户提出以 Cookie 和浏览器语言免配置识别本地化语言。
- 2026-07-23：协商优先级确定为“合法偏好 Cookie > `Accept-Language` 中首个受支持语言 > `zh-CN`”。
- 2026-07-23：自动检测结果不写 Cookie，浏览器语言变化可在未来新请求生效；只有手动选择和旧偏好迁移才建立长期 Cookie。
- 2026-07-23：范围属于仓库内、可回滚的既有本地化体验优化；提案由 `proposed` 批准为 `approved`，随后进入施工。
- 2026-07-23：请求语言由服务端解析并通过只读请求上下文交给加载幕和客户端 Provider；旧版 `localStorage` 偏好在 hydration 后迁移为同值 Cookie。
- 2026-07-23：全部验收与双目标构建完成，计划关闭。

## 相关文档

- [[docs/architecture]]
- [[docs/campaign-authoring]]
- [[docs/quality-baseline]]
- [[docs/viewport-checklist]]
