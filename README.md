# 夜班侦探 Night Shift

> 你睡着以后，他才开始工作。

一款“旅行青蛙式期待感 × 睡眠行为 × 异步侦探叙事 × 收藏与推理”的本地优先网页游戏。案件书架目前收录《零点四十三分的末班车》《只在雨中播出的电台》与《黎明前出炉的第十三个面包》三套完整五夜剧本，各自拥有独立线索、推理、结局和本地存档；同一夜班运行时可以继续接入新的 `CampaignManifest`。真实夜班会按设备本地交接时间冻结掌灯、夜半、末更或白昼小憩，改变城市侧影而不评价作息；短暂醒转还可以留下每夜最多一次、不会结束调查的睡隙回声。

## 启动

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。项目无需环境变量、数据库、登录、API Key 或可穿戴设备。

“放下纸条”默认使用确定性本地晨间回信。若要启用玩家逐夜明确授权的 AI 个性化短笺，服务端必须同时配置 `OPENAI_API_KEY`、`REST_REFLECTION_ACCESS_CODE`、`UPSTASH_REDIS_REST_URL` 与 `UPSTASH_REDIS_REST_TOKEN`；缺少任一项都会保持本地回信。用户先用部署者提供的访问码取得 24 小时签名 HttpOnly 授权；Redis 对访问尝试、单会话调用、请求幂等和部署每日预算做跨实例限制，`REST_REFLECTION_DAILY_BUDGET` 可调整默认每日 200 次上限。可选的 `OPENAI_BASE_URL` 与 `OPENAI_MODEL` 用于 OpenAI-compatible 服务。模型只从固定枚举选择语气和意象，最终短笺由服务端安全模板组成。

## Injective 测试网藏品

已解锁收藏品可选择性领取为 Injective EVM Testnet ERC-721。默认未配置时界面只展示诚实的“链上档案尚未开门”，不影响任何游戏内容。启用步骤：

```bash
cp .env.example .env.local
npm run contract:compile
npm run contract:test
INJECTIVE_DEPLOYER_PRIVATE_KEY=0x... npm run contract:deploy
```

把部署地址写入 `INJECTIVE_NFT_CONTRACT_ADDRESS`，把合约 `claimSigner` 对应私钥写入仅服务端的 `INJECTIVE_MINT_SIGNER_PRIVATE_KEY`；固定域名部署还应设置 `INJECTIVE_NFT_METADATA_ORIGIN`。不要使用 `NEXT_PUBLIC_` 前缀。完整协议、测试网参数与 Vercel 配置见 [[docs/injective-keepsake-mint]]。

## 验证

```bash
npm test
npm run lint
npm run build
npm run contract:compile
npm run contract:test
```

Playwright Happy Path：`npm run test:e2e`。

## Demo Mode

点击右上角 `DEMO`，或按 `Shift + D`。可跳到任意一夜、解锁完整案件板、快速满足真结局条件或重置本地存档。夜间模拟默认 12 秒，也可直接跳到清晨。

存档保存在浏览器 `localStorage` 的 `night-shift-save-v1` 中。

## 项目知识与计划

代理和长期维护从 [[AGENTS]] 开始；稳定知识见 [[docs/index]]，计划、提案与完成进度见 [[PLANS]]。内部双链可通过 `npm run docs:check` 验证。

## 图像资产

核心主视觉使用内置图像生成能力制作，保存于 `public/art/headers/night-shift-hero.png`。最终 Prompt 见 `docs/art-direction.md` 与 `docs/art-prompts/global-style.md`。
