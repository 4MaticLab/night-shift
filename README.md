# 夜班侦探 Night Shift

> 你睡着以后，他才开始工作。

一款“旅行青蛙式期待感 × 睡眠行为 × 异步侦探叙事 × 收藏与推理”的本地优先网页游戏。案件书架目前收录《零点四十三分的末班车》与《只在雨中播出的电台》两套完整五夜剧本，各自拥有独立线索、推理、结局和本地存档；同一夜班运行时可以继续接入新的 `CampaignManifest`。真实夜班会按设备本地交接时间冻结掌灯、夜半、末更或白昼小憩，改变城市侧影而不评价作息；短暂醒转还可以留下每夜最多一次、不会结束调查的睡隙回声。

## 启动

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。项目无需环境变量、数据库、登录、API Key 或可穿戴设备。

## 验证

```bash
npm test
npm run lint
npm run build
```

Playwright Happy Path：`npm run test:e2e`。

## Demo Mode

点击右上角 `DEMO`，或按 `Shift + D`。可跳到任意一夜、解锁完整案件板、快速满足真结局条件或重置本地存档。夜间模拟默认 12 秒，也可直接跳到清晨。

存档保存在浏览器 `localStorage` 的 `night-shift-save-v1` 中。

## 项目知识与计划

代理和长期维护从 [[AGENTS]] 开始；稳定知识见 [[docs/index]]，计划、提案与完成进度见 [[PLANS]]。内部双链可通过 `npm run docs:check` 验证。

## 图像资产

核心主视觉使用内置图像生成能力制作，保存于 `public/art/headers/night-shift-hero.png`。最终 Prompt 见 `docs/art-direction.md` 与 `docs/art-prompts/global-style.md`。
