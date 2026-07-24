# Injective 链上夜班藏品

## 产品定位

已由当前案件存档解锁的核心收藏品，可以选择性铸成 Injective EVM Testnet 上的 ERC-721 纪念凭证。它是黑客松演示中的“链上档案回执”，不是通关证明、投资产品、稀有度市场或游戏奖励；不连接钱包、不配置合约或链上请求失败时，五夜主循环与本地收藏完全不受影响。

入口位于收藏柜的已解锁物证卡。锁定物证没有入口；成功后浏览器以 `campaignId + collectibleId + wallet` 保存公开交易回执，并在卡片上显示“此浏览器已有链上回执”。游戏存档、结局资格和睡眠硬件存档都不读取这份回执。

## 为什么使用签名领取凭证

服务端不会替用户托管钱包，也不会把私钥或“密码”发给前端。具体流程是：

1. 客户端连接 EVM 钱包并切换到 Injective EVM Testnet（chain ID `1439`）。
2. `POST /api/injective/mint-authorization` 校验同源请求、大小、地址、案件和收藏品白名单，并检查同一钱包是否已经领取。
3. 服务端从 `INJECTIVE_MINT_SIGNER_PRIVATE_KEY` 读取签名密钥，为接收地址、案件哈希、收藏品哈希、元数据 URI 哈希和 15 分钟期限签发 EIP-712 `MintVoucher`。
4. 前端只收到限时 voucher 和签名，由用户钱包调用 `NightShiftKeepsake.redeem`。
5. 合约验证签名、期限、接收钱包和元数据哈希，并以 `recipient + campaignKey + collectibleKey` 拒绝重复领取。
6. 交易确认后，客户端从 `tokenOf` 读取 token ID，把 Blockscout 链接保存在 `night-shift-injective-mints-v1`。

服务端 API 对相同 `requestId + wallet + campaign + collectible` 保留 15 分钟进程内幂等结果，每个来源地址每小时最多创建 8 份新授权。该限制是黑客松部署的滥用护栏，不是生产级跨实例配额；合约才是最终的重复铸造防线。

## 合约与元数据

- 合约：`contracts/NightShiftKeepsake.sol`
- 部署模块：`ignition/modules/NightShiftKeepsake.ts`
- 网络：Injective EVM Testnet
- chain ID：`1439`（`0x59f`）
- 默认 RPC：`https://k8s.testnet.json-rpc.injective.network/`
- 浏览器：`https://testnet.blockscout.injective.network`
- 标准：ERC-721 URI Storage、EIP-712、ECDSA、Ownable

元数据只从编译期案件注册表和资产 manifest 生成，客户端不能自定义名称、描述、图片或属性。token URI 使用内嵌 JSON data URI，图片和回到游戏的链接使用部署 origin；部署在固定域名时应设置 `INJECTIVE_NFT_METADATA_ORIGIN`，避免预览域名进入永久元数据。

第二案目前与首案复用部分收藏品画面，这是现有内容资产的公开边界；第三案的八件收藏品则使用 `/art/cases/thirteenth-loaf/collectibles/` 中的专属画面。链上卡面应被理解为当前案件 manifest 绑定的档案版画，不能把第二案宣称为已有完全独立美术。新增案件应按 [[docs/campaign-authoring]] 与 [[docs/art-direction]] 提供专属资产。

## 当前测试网部署

- 合约地址：[`0x4016a9165f655618055c8bbd2f992FB20895288C`](https://testnet.blockscout.injective.network/address/0x4016a9165f655618055c8bbd2f992FB20895288C)
- 部署交易：[`0xbe4520df00904a6d67341f226f04e8836a826879785fa270844ff2e4b3b66d39`](https://testnet.blockscout.injective.network/tx/0xbe4520df00904a6d67341f226f04e8836a826879785fa270844ff2e4b3b66d39)
- 部署区块：`134536213`
- 部署日期：2026-07-24
- owner／`claimSigner`：`0xC02b873Ef4F79Da50435c164C76e941365a7b7ca`
- 验证状态：Blockscout 已验证 Solidity 源码和编译设置

这是比赛演示用 Injective EVM Testnet 部署；临时 owner／签名钱包不得复用于主网。Ignition 部署记录保存在 `ignition/deployments/chain-1439/`。公共 RPC 在这笔交易确认后曾短暂无法通过 `eth_getTransactionReceipt` 返回回执，但区块级回执、部署字节码、nonce、owner、`claimSigner`、名称、符号和 Blockscout 均已交叉验证；不得因单点回执缺失重复部署。

## 本地部署

安装、编译和测试：

```bash
npm install
npm run contract:compile
npm run contract:test
```

为部署钱包取得 Injective EVM Testnet INJ 后：

```bash
export INJECTIVE_DEPLOYER_PRIVATE_KEY=0x...
npm run contract:deploy
```

Ignition 默认把部署账户同时设为 owner 和 `claimSigner`，适合一次性 Demo。若要分离签名人，在 Ignition 参数中为 `NightShiftKeepsakeModule#claimSigner` 指定服务端签名地址。部署完成后，Vercel／Next 服务至少配置：

Blockscout 源码验证使用与部署相同的 production build profile 和构造参数：

```bash
npx hardhat verify blockscout \
  --network injectiveTestnet \
  --build-profile production \
  --contract contracts/NightShiftKeepsake.sol:NightShiftKeepsake \
  -- "$CONTRACT_ADDRESS" "$OWNER_ADDRESS" "$CLAIM_SIGNER_ADDRESS"
```

```bash
INJECTIVE_MINT_SIGNER_PRIVATE_KEY=0x...
INJECTIVE_NFT_CONTRACT_ADDRESS=0x...
INJECTIVE_NFT_METADATA_ORIGIN=https://your-fixed-origin.example
```

`INJECTIVE_EVM_RPC_URL` 可选。缺少密钥或合约地址时 `GET /api/injective/mint-authorization` 返回 `configured: false`，界面展示未配置态，不伪造交易。部署私钥不需要进入 Vercel；运行时签名私钥不应以 `NEXT_PUBLIC_` 前缀配置。

## 验证边界

- Solidity 测试覆盖正常领取、重复领取、冒领、过期、URI 篡改和错误签名。
- Vitest 覆盖白名单、规范元数据、EIP-712 可验证签名、既有 token、同源、未配置、幂等、限流和本地回执净化。
- Playwright 覆盖未配置态、模拟既有 mint 成功、刷新保留，以及 `390 × 844`、`820 × 1180`、`1440 × 900` 响应式几何。
- 当前仓库不提交真实测试网私钥；已部署的测试网合约不声称本地存档能证明玩家在链下完成案件。

Injective 官方参考：[EVM 网络参数](https://docs.injective.network/developers-evm/network-information)、[连接 MetaMask](https://docs.injective.network/developers-evm/dapps/connect-with-metamask)、[Solidity 合约](https://docs.injective.network/developers-evm/smart-contracts)。

## 相关文档

- [[docs/product-overview]]
- [[docs/architecture]]
- [[docs/privacy-and-guardrails]]
- [[docs/quality-baseline]]
- [[docs/art-direction]]
- [[docs/campaign-authoring]]
