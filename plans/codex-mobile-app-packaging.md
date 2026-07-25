# Android 与 iOS 黑客松安装包

- 状态：`completed`
- 优先级：P0
- 创建：2026-07-24
- 更新：2026-07-25
- 负责人：Codex
- 分支：`codex/mobile-app-packaging`
- 依赖：Node 22、Android SDK/JDK、Xcode；真机 iOS 安装最终需要可用 Apple 签名身份
- 推进模式：`manual`

## 动机

Night Shift 已有成熟的移动响应式网页、确定性的本地五夜循环和不依赖后台计时器的睡眠会话，但还没有 Android 或 iOS 原生工程，无法作为黑客松作品直接安装，也无法从系统健康数据仓读取真实睡眠摘要。用户已明确授权为两个移动平台完成可安装打包，不要求应用商店审核。

## 范围

- 增加共享的 Capacitor 移动运行时配置，默认加载现有 Vercel 生产站点，并允许开发／演示时覆盖地址。
- 生成并维护 Android 与 iOS 原生工程、品牌图标、启动配置和可重复构建脚本。
- 为 iOS HealthKit 与 Android Health Connect 增加最小原生桥：明确授权、按夜班时间窗读取睡眠会话、返回来源与阶段摘要，并保持无数据时的现有本地回退。
- 把真实系统来源接入现有睡眠硬件授权、采集和晨报边界，不改变线索、结局或睡眠质量的公平性护栏。
- 在仓库文档中记录黑客松安装、签名、运行、数据权限、平台限制和验证证据。
- 在当前环境实际构建 Android APK 和 iOS 可运行 App／归档中可由现有工具链完成的最高级别产物。

## 非目标

- 不提交 App Store 或 Google Play，不处理商店审核、付费、正式发布或公开分发。
- 不重写为 React Native、Flutter 或两套独立原生界面。
- 不在首版对接 Oura、Fitbit、小米等厂商私有 SDK；只读取已进入 HealthKit／Health Connect 的系统数据。
- 不承诺 App 在锁屏期间持续执行 JavaScript；夜班继续以时间戳恢复，后台健康更新只作为增强。
- 不把健康原始数据上传到服务器、写入剧情存档或用于惩罚玩家。
- 不为移动端重新设计 Home Assistant Connector 或 Injective 注入钱包；不可用时保持诚实降级。

## 任务

- [x] 建立 Capacitor 配置、移动构建命令和可测试的 Web 原生桥契约。
- [x] 生成 Android 工程，实现 Health Connect 权限与睡眠会话查询。
- [x] 生成 iOS 工程，实现 HealthKit 权限与睡眠样本查询。
- [x] 把系统健康来源接入硬件中心、夜班采集与晨报摘要。
- [x] 增加契约／状态测试，验证缺少原生桥、拒绝权限、空数据、延迟数据与成功摘要。
- [x] 构建并检查 Android APK。
- [x] 构建并检查 iOS 模拟器 App；若本机存在签名身份和连接设备，再验证真机安装或归档导出。
- [x] 更新架构、隐私、睡眠硬件和质量基线文档。

## 验收标准

- 仓库包含可重复同步的 `android/` 与 `ios/` Capacitor 工程，应用 ID 稳定且品牌名为 Night Shift。
- Android 构建命令成功生成可侧载 APK；包内默认打开 Night Shift 生产 URL，并可通过环境变量切换开发地址。
- iOS 构建命令至少成功生成模拟器 `.app`；仓库给出使用 Xcode 签名并安装到黑客松演示机的明确路径。若当前机器具备签名条件，必须进一步证明真机构建或 `.ipa` 导出。
- HealthKit 与 Health Connect 都只请求睡眠读取权限，能按活动夜班时间窗返回规范化摘要；没有权限、没有记录或桥不可用时核心五夜循环仍可完成。
- 健康摘要只保存在现有本地睡眠硬件域，晨报能标明真实系统来源，且不会进入线索、结局或医疗判断。
- `npm test`、`npm run lint`、`npm run build`、`npm run docs:check` 通过；Android/iOS 原生构建结果和已知签名边界有可复核证据。

## 验证

- `npm test`：21 个文件、142 项测试通过。
- `npm run lint`：通过。
- `npm run build`：Next.js 生产构建通过，19 条路由生成完成。
- `npm run docs:check`：96 篇 Markdown 的双链全部通过。
- `npm run mobile:sync && npm run mobile:doctor`：Capacitor 8.4.2 的 Android／iOS 工程与插件同步通过。
- `npm run mobile:build:android`：JDK 21／Android SDK 36 本机构建通过；生成 15 MB debug APK，SHA-256 为 `cbe92159b74fc8fdb397456fa9d8ba344f8c54fa3f5e7ae3e33b6cac1bfc4ddc`。
- `apkanalyzer`：application ID 为 `com.fourmaticlab.nightshift`；权限只有 `INTERNET`、`READ_SLEEP` 与包内动态接收器保护权限。
- GitHub Actions `Mobile Artifacts` run `30151124586`：Android APK job 4 分 48 秒通过并上传 `night-shift-android-apk`；iOS Simulator App job 1 分 40 秒通过，bundle ID／HealthKit 用途说明检查通过并上传 `night-shift-ios-simulator`。
- 当前 Mac 没有完整 Xcode、也没有 iOS Development 签名身份或连接设备；真机安装按稳定文档在 Xcode 中选择演示者 Team 执行，不把模拟器包伪装成可侧载 IPA。

## 决定记录

- 2026-07-24：用户明确要求完成 Android 与 iOS 两个平台安装包，且黑客松目标不包含商店审核；计划以 `manual` 模式直接进入 `in_progress`。
- 2026-07-24：选择 Capacitor 复用现有 Next.js 产品，黑客松包默认加载固定 Vercel 生产站点；不把服务端路由和 46 MB 资产强行改造成离线静态导出。
- 2026-07-24：真实睡眠只通过 HealthKit／Health Connect 系统仓读取，保持时间戳恢复和本地模拟器作为无数据回退。
- 2026-07-25：本机实际生成 15 MB debug APK；`apkanalyzer` 确认包名为 `com.fourmaticlab.nightshift`，合并权限只有 `INTERNET`、`READ_SLEEP` 与 Android 自身动态接收器保护权限。
- 2026-07-25：当前 Mac 只有 Command Line Tools、没有完整 Xcode；iOS 编译转由 `Mobile Artifacts` 的 `macos-15` job 验证，本机仍保留 Xcode 自动签名安装路径。
- 2026-07-25：GitHub Actions run `30151124586` 同时通过 Android APK 与 iOS Simulator App 构建、元数据检查和 artifact 上传；计划验收范围完成。

## 相关文档

- [[docs/architecture]]
- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[docs/quality-baseline]]
- [[docs/viewport-checklist]]
