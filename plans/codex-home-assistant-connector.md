# Home Assistant Connector 下载应用

- 状态：`in_progress`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex
- 分支：`codex/home-assistant-connector`
- 依赖：PR #77 的 Home Assistant loopback 桥实现；Chrome 142+ Local Network Access；一台可访问的 Home Assistant 或模拟服务
- 推进模式：`manual`

## 动机

Night Shift 已有经过验证的 Home Assistant loopback 桥，但当前比赛演示仍要求开发者在终端提供环境变量并从 localhost 前端访问。Chrome 已能在 HTTPS 页面访问 localhost 时显示 Local Network Access 授权；用户批准把桥包装成可下载的跨平台 Connector，让评委通过“下载 App → 连接 Home Assistant → 在 Vercel 页面配对 → 试亮设备”完成真实闭环。目标是黑客松可演示和可复现，不追求商店级分发。

## 范围

- 在最新 `origin/main` 上吸收并保留 PR #77 的受限 Home Assistant 桥能力。
- 新增 Night Shift Connector 进程：自动启动 loopback 桥与本地设置页、发现 Home Assistant、接收 URL／token、显示状态和六位配对码，并可打开正式网页。
- 把浏览器配对从跨站 Cookie 改为短期、低权限 bearer session；Home Assistant token 仍只在本地 Connector 内存或用户明确选择的本地配置中。
- 让 Vercel HTTPS 前端在 Chrome 中对已知 localhost Connector 发起带 `targetAddressSpace: loopback` 的请求，提供权限／下载／重试状态，并允许显式配置生产 origin。
- 使用 Bun 把同一 TypeScript 入口编译为 macOS arm64、macOS x64、Windows x64 与 Linux x64 独立程序；macOS 额外生成可双击的 `.app` 包装。
- 新增本地、协议、浏览器和编译后二进制冒烟测试，以及 GitHub Actions 构建产物工作流。
- 更新架构、隐私、比赛接线、下载与真实边界文档。

## 非目标

- 不做 Apple notarization、正式代码签名、Windows SmartScreen 信誉、应用商店、自动更新或安装器。
- 不支持 Safari／Firefox 的本地网络路径，不实现普通网页的任意局域网扫描、mDNS multicast 或原始 TCP／UDP。
- 不把 Home Assistant token、设备状态或原始事件上传到 Vercel、GitHub Actions或任何云端中继。
- 不实现 Home Assistant Add-on、浏览器扩展、IWA、Electron 或 Tauri。
- 不在未合入代码上创建公开 GitHub Release；PR 只生成可验证的 CI artifact 与本地打包结果。

## 任务

- [ ] 将 PR #77 桥核心移植到最新主线并重新验证基线。
- [ ] 把桥配对改为短期 bearer session，并为 Chrome LNA／Vercel origin 建立安全请求边界。
- [ ] 实现 Connector 生命周期、Home Assistant 配置／发现、本地设置页与无终端启动体验。
- [ ] 实现 macOS／Windows／Linux Bun 编译和 macOS `.app` 包装。
- [ ] 扩展 Night Shift 硬件中心的 Connector 下载、权限、发现、配对与失败降级体验。
- [ ] 新增协议、store、浏览器、Connector 设置页、编译后二进制与 CI artifact 测试。
- [ ] 更新稳定文档并完成全量代码、构建、文档与人工浏览器验证。

## 验收标准

- 在 Chrome 142+ 打开 Vercel HTTPS 页面时，用户点击连接后会触发 localhost 的 Local Network Access 权限；允许后能读取 Connector 状态，拒绝或未安装时得到准确下载／重试指引。
- Connector 无需 Node、Bun 或仓库依赖即可在目标平台启动；macOS 可双击 `.app`，Windows 可双击 `.exe`，并自动打开只监听 loopback 的设置页。
- 设置页能发现 `_home-assistant._tcp.local.`、允许手填 URL／token、验证认证、显示安全实体数量和六位配对码；token 不出现在 URL、日志、浏览器 API 响应或 Night Shift 存档。
- Vercel 页面以六位码换取 12 小时随机 bearer session；session 只授权桥白名单 API，关闭 Connector 后失效，错误 origin、错误码、过期 token 和危险实体均拒绝。
- 用户能在 Vercel 页面选择实体、试运行并启用三个语义 cue；桥、权限、Home Assistant 或设备失败时游戏主循环不等待、不回滚。
- 至少生成 macOS arm64、macOS x64、Windows x64 和 Linux x64 四个 artifact；当前 macOS artifact 的真实二进制能启动并通过 `/v1/status` 冒烟测试。
- PR CI 构建并上传 Connector artifact，但不自动发布公开 Release。

## 验证

- `npm test`
- `npm run lint`
- `npm run docs:check`
- `npm run build`
- `npm run build:sites`
- `npm run bridge:test`
- `npm run connector:test`
- `npm run connector:build`
- `npm run connector:smoke`
- `PLAYWRIGHT_PORT=3107 npm run test:e2e -- --grep "Home Assistant|Connector"`
- 在 Chrome 中从 HTTPS／Vercel Preview 验证权限拒绝、未安装、配对、试亮、断桥和移动端提示。
- 在 macOS 双击打包后的 `.app`，验证设置页、真实／模拟 Home Assistant 和网页配对闭环。

## 决定记录

- 2026-07-24：用户批准以黑客松演示为目标推进跨平台下载 App，计划以 `manual` 模式进入 `in_progress`。
- 2026-07-24：选择 Bun standalone executable，而非 Electron／Tauri；设置 UI 由本地 loopback 页面承担，减小新技术面与包体。
- 2026-07-24：普通 Chrome 页面只发现固定 localhost Connector；mDNS 与 Home Assistant token 保留在 Connector，网页不扫描任意局域网。
- 2026-07-24：未签名／未公证是 Developer Preview 的真实边界，公开 Release 留待代码合入后的独立发布动作。

## 相关文档

- [[docs/architecture]]
- [[docs/privacy-and-guardrails]]
- [[docs/hackathon-submission-kit]]
- [[docs/decision-log]]
- PR #77
