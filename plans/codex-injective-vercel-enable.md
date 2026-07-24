# 启用 Vercel Injective mint

- 状态：`completed`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex / Human
- 分支：`codex/injective-testnet-deploy`
- 依赖：Injective Testnet 合约已部署；Vercel CLI 已登录并可访问 `luokerenx4-s-team/night-shift`
- 推进模式：`manual`

## 动机

Injective EVM Testnet 合约已经部署并验证，但公开 Vercel 站点尚未配置签名私钥、合约地址和固定 metadata origin，`/api/injective/mint-authorization` 仍无法签发真实领取凭证。比赛演示需要把现有轻量后端接到已部署合约并验证 production mint 授权链路。

## 范围

- 将本地测试网 signer 私钥作为 Vercel production secret 配置。
- 配置测试网合约地址和公开固定 metadata origin。
- 触发 `night-shift` 项目的 Vercel production 部署。
- 验证生产 API 返回 `configured: true` 且公开参数与链上部署一致。
- 使用临时测试钱包请求一份白名单收藏品的 EIP-712 voucher，并在本地验证签名；不代替玩家钱包提交 NFT mint 交易。
- 把稳定的线上接线事实同步到部署文档。

## 非目标

- 不把 signer 私钥写入 Git、前端变量或用户可见输出。
- 不部署新合约，不修改合约 owner／`claimSigner`。
- 不向主网发布，不实现生产级防作弊或跨实例限流。
- 不自动使用玩家钱包提交 `redeem`，因此本计划不会铸造具体 NFT。

## 任务

- [x] 绑定本地 checkout 到正确的 Vercel team/project，并核对现有 production 环境。
- [x] 配置三个 Injective production 环境变量。
- [x] 触发并等待 production deployment 成功。
- [x] 验证 production 状态 API、voucher 签名和 metadata origin。
- [x] 更新稳定文档并记录最终验证证据。

## 验收标准

- `https://www.shiftx.top/api/injective/mint-authorization` 返回 `configured: true`。
- API 返回的合约地址为 `0x4016a9165f655618055c8bbd2f992FB20895288C`、chain ID 为 `1439`。
- production POST 能为仓库白名单收藏品返回可由链上 `claimSigner` 验证的限时 voucher。
- metadata 图片与 external URL 使用 `https://www.shiftx.top`。
- Vercel 环境中 signer 为 secret，私钥未进入 Git 或公开日志。

## 验证

- `vercel env list production --scope luokerenx4-s-team`
- `vercel deploy --prod --scope luokerenx4-s-team`
- `GET /api/injective/mint-authorization`
- `POST /api/injective/mint-authorization`
- 本地 `verifyTypedData`
- `npm run docs:check`
- `git diff --check`

## 最终验证证据

- Vercel project：`luokerenx4-s-team/night-shift`
- production deployment：`night-shift-jqjs676be-luokerenx4-s-team.vercel.app`，已别名到 `https://www.shiftx.top`
- Vercel deployment inspect：`https://vercel.com/luokerenx4-s-team/night-shift/3B6zdm3TqoiT7owRT8d5az4WER9X`
- production 环境已配置 `INJECTIVE_MINT_SIGNER_PRIVATE_KEY`（Sensitive）、`INJECTIVE_NFT_CONTRACT_ADDRESS` 和 `INJECTIVE_NFT_METADATA_ORIGIN`。
- `GET https://www.shiftx.top/api/injective/mint-authorization` 返回 `configured: true`、chain ID `1439` 和合约 `0x4016a9165f655618055c8bbd2f992FB20895288C`。
- production POST 为 `case-001 / torn-ticket` 返回 `authorized`；本地 `verifyTypedData` 恢复到链上 `claimSigner`，metadata 哈希一致，图片和 `external_url` origin 均为 `https://www.shiftx.top`。
- smoke test 未调用合约 `redeem`，未铸造 NFT。
- `npm run docs:check`：通过，86 个 Markdown 文件的双链均可解析。
- `git diff --check`：通过。

## 决定记录

- 2026-07-24：用户明确授权使用 Vercel CLI 配置并发布现有 production 项目。
- 2026-07-24：选择 `https://www.shiftx.top` 作为永久 metadata origin；它是 Vercel 当前列出的 `night-shift` production URL。
- 2026-07-24：用部署／签名测试钱包作为 voucher 的接收地址进行只读 smoke test；不提交 mint 交易。

## 相关文档

- [[docs/injective-keepsake-mint]]
- [[docs/privacy-and-guardrails]]
