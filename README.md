# 夜班侦探 Night Shift

> 你睡着以后，他才开始工作。

Night Shift 是一款「异步等待」侦探叙事游戏：白天你在事务所读晨报、整理证物、决定调查方向；夜里侦探林渡替你出门。真实夜班按设备本地时间冻结掌灯、夜半、末更或白昼小憩，改变城市侧影而不评价作息。默认 local-first——没有环境变量、数据库、登录、API Key 或任何硬件，也能完成完整五夜主循环。

产品定位与核心循环见 [[docs/product-overview]]，设计北极星见 [[docs/north-star]]。

## 案件书架

五套完整五夜剧本，各自拥有独立线索、推理、结局和本地存档，中英文全部覆盖；同一夜班运行时可继续接入新的 `CampaignManifest`（见 [[docs/campaign-authoring]]）。

| 案件 | 故事圣经 |
| --- | --- |
| 零点四十三分的末班车 | [[docs/story-bible]] |
| 只在雨中播出的电台 | [[docs/rain-radio-story-bible]] |
| 面包奇谈 | [[docs/thirteenth-loaf-story-bible]] |
| 千早诺亚的现身 | [[docs/chihaya-noa-story-bible]] |
| 雾中无狼 | [[docs/fog-without-wolves-story-bible]] |

## 快速开始

需要 Node.js 22：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。存档保存在浏览器 `localStorage` 的 `night-shift-save-v1` 中，语言跟随浏览器并可在页面内切换。

**Demo Mode**：点击右上角 `DEMO` 或按 `Shift + D`，可跳到任意一夜、解锁完整案件板、快速满足真结局条件或重置本地存档；夜间模拟默认 12 秒，也可直接跳到清晨。90 秒演示路径见 [[docs/demo-script]]。

## 仓库地图

| 路径 | 内容 |
| --- | --- |
| `app/` + `src/` | Next.js 主游戏（内容、状态、i18n、案件包） |
| `apps/desk-pet/` | Electron 桌宠：林渡值更、睡眠报告，兼任 Mini Lindo 通讯端 |
| `apps/rdk-sentry/` | Mini Lindo 板端代理：RDK X5 床头哨站（Python，零第三方依赖） |
| `apps/connector/` + `tools/home-assistant-bridge/` | 本机 Home Assistant 空间外设桥与桌面连接器 |
| `contracts/` + `ignition/` | Injective EVM Testnet 藏品合约（Hardhat） |
| `docs/` | 稳定知识，入口 [[docs/index]] |
| `plans/` | 施工期临时计划，入口 [[PLANS]] |

## 可选扩展

每一项都默认关闭或可缺席，不影响主循环：

- **AI 晨间短笺** — “放下纸条”默认使用确定性本地回信。启用玩家逐夜授权的 AI 个性化短笺需服务端同时配置 `OPENAI_API_KEY`、`REST_REFLECTION_ACCESS_CODE`、`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`，缺一保持本地回信；`REST_REFLECTION_DAILY_BUDGET` 调整每日预算（默认 200），可选 `OPENAI_BASE_URL` / `OPENAI_MODEL` 接 OpenAI-compatible 服务。模型只从固定枚举选择语气意象，短笺由服务端安全模板组成，不进入线索或结局计算。
- **Injective 测试网藏品** — 已解锁收藏品可选择性领取为 ERC-721；未配置时界面诚实展示“链上档案尚未开门”。`npm run contract:compile && npm run contract:test`，部署与环境变量见 [[docs/injective-keepsake-mint]]。
- **睡眠硬件** — 网页内虚拟睡眠设备与 Xiaomi Watch S4 真实接入 PoC，见 [[docs/sleep-hardware-user-guide]] 与 [[docs/xiaomi-watch-hardware-test]]。
- **桌宠与 Mini Lindo（小林渡）** — `npm run pet:install && npm run pet:start` 启动桌宠；床头哨站在 RDK X5 上跑 `python3 apps/rdk-sentry/sentry.py`（任意机器加 `--mock` 联调），摄像头画面不出板、只回传聚合统计，见 [[docs/rdk-x5-sleep-sentry]]。
- **Home Assistant 空间桥** — `npm run bridge:start` 或桌面连接器 `npm run connector:start`，用受限实体做夜班环境 cue，见 [[docs/home-assistant-ambient-bridge]]。
- **海报序列** — `/posters` 提供五日案件碎片海报的网页预览与打印入口，见 [[docs/poster-series-guide]]。
- **移动端打包** — Capacitor 打 Android APK / iOS App，`npm run mobile:build:android` 等命令见 [[docs/mobile-app-packaging]]。

所有设备与健康信号只丰富叙事，不诊断、不惩罚、不锁内容，随时可撤销，详见 [[docs/privacy-and-guardrails]]。

## 验证

```bash
npm test              # 单元与内容测试
npm run lint
npm run build
npm run docs:check    # 文档双链检查
```

可选鲁棒性套件：`npm run test:robustness`（渲染快照 + 合约编译测试 + Playwright E2E，也可用 `test:e2e` / `test:render` / `contract:*` 单跑）。质量基线与已知边界见 [[docs/quality-baseline]]。

## 部署

默认 Vercel（Next.js 直出）；Cloudflare Workers 走 `npm run deploy`（OpenNext）或 `npm run deploy:sites`（vinext + wrangler）。赛道陈述与部署排障见 [[docs/hackathon-submission-kit]]。

## 协作与维护

- 开发代理与协作规范从 [[AGENTS]] 开始：`main` 受保护，一切变更走主题分支 + PR，复杂任务先建临时计划。
- 稳定知识入口 [[docs/index]]；剧本翻译规范见 [[docs/translation-guide]]；工程结构见 [[docs/architecture]]。
- 视觉遵循 Cozy Storybook Noir（[[docs/art-direction]]），主视觉与生成提示词见 `docs/art-prompts/`。
