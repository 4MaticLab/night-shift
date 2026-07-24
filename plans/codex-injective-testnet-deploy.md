# Injective 测试网合约部署

- 状态：`completed`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex / Human
- 分支：`codex/injective-testnet-deploy`
- 依赖：用户向临时部署地址领取 Injective EVM Testnet INJ
- 推进模式：`manual`

## 动机

仓库已实现 `NightShiftKeepsake`、EIP-712 领取凭证和前端 mint 流程，但尚无真实 Injective EVM Testnet 合约地址。比赛演示需要一份可读取、可验证的测试网部署，使后端签发的 voucher 能被玩家钱包实际兑换。

## 范围

- 创建并本地保存一个仅用于本次 Injective EVM Testnet 演示的临时 EVM 钱包。
- 使用该钱包作为合约 owner 和 `claimSigner` 部署现有 `NightShiftKeepsake`。
- 在 Blockscout 与 RPC 上核对部署字节码、owner、`claimSigner`、名称和符号。
- 在可行时验证合约源码，并把稳定的测试网部署信息同步到部署文档。
- 交付合约地址及后端所需环境变量映射。

## 非目标

- 不部署 Injective EVM Mainnet。
- 不实现生产级密钥托管、跨实例限流、玩法进度证明或反自动化。
- 不改变 NFT 供应、metadata、收藏品美术或 mint 产品交互。
- 本计划不自动修改或发布 Vercel／Sites 运行环境；网站接线在合约部署验收后另行执行。

## 任务

- [x] 生成临时测试网钱包，安全保存私钥并交付收款地址。
- [x] 确认部署地址在 chain ID 1439 上有足够 Testnet INJ。
- [x] 编译并运行现有合约测试。
- [x] 部署 `NightShiftKeepsake` 并保存 Ignition 部署记录。
- [x] 通过 RPC 与 Blockscout 核对部署状态，尝试源码验证。
- [x] 更新稳定部署文档并记录最终验证证据。

## 验收标准

- Injective EVM Testnet 上存在可读取字节码的 `NightShiftKeepsake` 合约。
- 合约 `owner` 与 `claimSigner` 均为本次临时部署地址。
- 合约名称为 `Night Shift Keepsakes`、符号为 `NIGHT`。
- 仓库测试继续通过，部署地址和浏览器链接被准确记录。
- 未把私钥加入 Git、公开日志或前端变量。

## 验证

- `npm run contract:compile`
- `npm run contract:test`
- Injective RPC：`eth_chainId`、`eth_getBalance`、`eth_getCode`
- 合约读取：`owner()`、`claimSigner()`、`name()`、`symbol()`
- Blockscout 合约页与可用时的源码验证结果
- `npm run docs:check`

最终结果：

- 合约：`0x4016a9165f655618055c8bbd2f992FB20895288C`
- 交易：`0xbe4520df00904a6d67341f226f04e8836a826879785fa270844ff2e4b3b66d39`
- 区块：`134536213`
- `owner`／`claimSigner`：`0xC02b873Ef4F79Da50435c164C76e941365a7b7ca`
- RPC 读取：名称 `Night Shift Keepsakes`，符号 `NIGHT`，部署字节码存在
- Blockscout：Solidity 源码验证成功
- `npm test`：9 个文件、100 项测试通过
- `npm run lint`：通过
- `npm run contract:compile`：通过
- `npm run contract:test`：2 项合约测试通过
- `npm run docs:check`：86 个 Markdown 文件通过
- `git diff --check`：通过
- `npx hardhat ignition status chain-1439`：successful

## 决定记录

- 2026-07-24：用户明确批准创建临时测试网钱包并在取得测试水后执行合约部署。
- 2026-07-24：为比赛 Demo 保持最小结构，临时部署钱包同时作为 owner 与 `claimSigner`；不在本计划内扩展生产级密钥架构。
- 2026-07-24：临时钱包已生成并保存于 Git 忽略、权限为 `0600` 的本地环境文件；RPC 复算地址一致，初始测试网余额为 0 INJ。
- 2026-07-24：用户领取 1 Testnet INJ 后执行部署。公共 RPC 未在 Ignition 轮询窗口内返回交易／回执，导致 CLI 报 dropped；随后从部署区块、`eth_getBlockReceipts`、合约字节码和状态读取确认交易成功，并据真实链上回执恢复 Ignition journal，避免重复部署。
- 2026-07-24：Blockscout 验证通过，稳定部署信息已进入 [[docs/injective-keepsake-mint]]，计划完成。

## 相关文档

- [[docs/injective-keepsake-mint]]
- [[docs/architecture]]
- [[docs/privacy-and-guardrails]]
