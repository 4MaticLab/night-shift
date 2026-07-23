# Injective 链上夜班藏品

- 状态：`completed`
- 优先级：P0
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex
- 分支：`feat/injective-keepsake-mint`
- 依赖：无
- 推进模式：`manual`

## 动机

Night Shift 已经把每夜带回的核心物证做成可见、可回看的收藏，但它们仍只停留在当前浏览器存档。黑客松版本需要一个明确、好看且可现场演示的 Injective 接点：玩家连接 EVM 钱包后，可以把已经由本案存档解锁的收藏品铸成测试网上的个人夜班藏品，并从交易回执回到雾灯城档案。

用户明确批准用服务端测试网密钥完成签名。实现仍保持私钥只在服务端：前端只取得钱包地址和最终交易哈希，绝不接收私钥、密码或可复用签名材料。

## 范围

- 采用 Injective EVM Testnet（chain ID `1439`）和标准 ERC-721／EIP-712 合约，提供可编译、可部署的 `NightShiftKeepsake` 合约与 ABI。
- 新增服务端授权 API：校验案件／收藏白名单、钱包地址和幂等键，用服务端测试网私钥签发限时 mint voucher；前端钱包调用合约 `redeem` 并取得交易哈希。
- 新增轻量 MetaMask／EVM 钱包连接与 Injective 测试网切换，不引入账号系统。
- 在收藏页为已解锁物证加入符合档案美学的“链上封存”流程：连接、确认、铸造中、成功回执、已铸造和明确失败状态。
- 在浏览器本地按 `campaignId + collectibleId + wallet` 保存成功回执，刷新后继续展示；链上交易哈希是可验证来源。
- 未配置合约或服务端密钥时，游戏主循环和收藏页保持完整可用，并明确显示“测试网铸造未启用”，不得伪装成功。
- 更新架构、产品、隐私、质量、部署说明与环境变量模板。

## 非目标

- 不接入主网，不承诺资产价值、稀有度、交易市场、版税或投资回报。
- 不把 NFT 变成线索、奖励倍率、真结局门槛或睡眠评价。
- 不把私钥、密码或服务端签名能力下发前端。
- 不建立账户、云存档、跨设备游戏进度或生产级反作弊。
- 不在本任务部署真实合约或保管用户／团队的测试网密钥；部署由环境变量和脚本完成。

## 任务

- [x] 创建计划并作为分支第一笔提交。
- [x] 固化 Injective EVM 网络、合约 ABI、元数据与请求／响应契约。
- [x] 实现服务端签名授权、白名单校验、幂等和测试。
- [x] 实现钱包连接、本地回执与收藏柜 mint UI。
- [x] 完成 Solidity 合约、部署脚本和配置说明。
- [x] 补齐桌面／移动响应式、美术细节与可访问状态。
- [x] 更新稳定文档并完成全量自动化／浏览器回归。
- [x] 记录最终证据；本计划将在下一笔提交中按规范退役。

## 验收标准

- 只有当前案件 manifest 中的收藏品 ID 能进入 mint 请求，非法案件／收藏／地址被拒绝。
- 私钥只从服务端 `INJECTIVE_MINT_SIGNER_PRIVATE_KEY` 读取，客户端 bundle、响应和错误信息均不包含密钥。
- 配置齐全时服务端签发绑定接收地址、案件、收藏品、元数据哈希和 15 分钟期限的 EIP-712 voucher；前端在 Injective EVM Testnet 调用 `redeem`，相同钱包／收藏由合约拒绝重复 mint。
- 未配置、无钱包、拒绝连接、切链失败、RPC／合约失败都有可理解且可恢复的 UI，不阻断本地收藏或五夜主循环。
- 已解锁物证可进入链上封存；锁定物证没有 mint 入口；成功回执刷新后保留且不改变游戏结算。
- 390 × 844、820 × 1180 与桌面宽度下弹层、按钮、地址、交易哈希无横向溢出，关键触控目标至少 44 px。
- 合约、API、客户端状态和稳定文档均有与风险相称的测试证据。

## 验证

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run build:sites`
- `npm run test:render`
- `npm run test:e2e`
- `npm run docs:check`
- `git diff --check`
- 本机浏览器检查未配置态、钱包缺失态、模拟成功态及桌面／平板／手机布局

## 决定记录

- 2026-07-24：用户明确要求为收藏品增加 Injective NFT mint，并批准黑客松测试网服务端签名方案。
- 2026-07-24：选用 Injective EVM Testnet 而非 CosmWasm，复用标准 Solidity、MetaMask 与 `viem`；官方网络参数为 chain ID `1439`、测试网 JSON-RPC 与 Blockscout。
- 2026-07-24：审计后采用 EIP-712 voucher：服务端只签限时、绑定钱包与元数据哈希的凭证，前端钱包调用 `redeem`；这最贴合“后端签完、前端 mint”，同时避免把密钥或可复用的开放签名能力发到浏览器。
- 2026-07-24：真实部署需要测试网合约地址、owner 私钥和测试网 INJ；仓库交付完整链路与部署脚本，但不伪造未发生的链上交易。
- 2026-07-24：收藏柜沿用每件物证现有编辑蚀刻画面，把 mint 设计为深蓝档案票据；390 px 使用可滚动底部档案，820 px 与桌面使用双栏，三档均保留 46 px 关闭键和 50 px 主操作。
- 2026-07-24：第二案现有收藏图与首案复用，链上文档明确称为“原型档案版画”，不伪装为案件专属美术；第三原创案件将在独立 PR 提供专属资产。

## 阶段验证

- `npm test`：82 项通过。
- `npm run lint`：通过。
- `npm run contract:compile`：Solidity 0.8.28 production profile 通过。
- `npm run contract:test`：2 项合约攻击／领取路径通过。
- `npm run build`：Next.js 16.2.11 通过，API 路由识别为动态 Node route。
- `npm run build:sites`、`npm run test:render`：Vinext 双目标与服务端渲染通过。
- `npm run docs:check`、`git diff --check`：通过。
- Playwright 新增 2 条 Injective 路径通过；全量首轮 32/33，通过项外仅旧“档案”模糊选择器与新“链上档案”文案发生歧义。精确选择器修复后失败路径通过，最终实现提交上 `npm run test:e2e` 为 33/33 通过。
- 本机浏览器：390 × 844、820 × 1180、1440 × 900 未配置态无横向溢出；关闭键 46 × 46，主操作高 50 px。

## 相关文档

- [[docs/product-overview]]
- [[docs/architecture]]
- [[docs/privacy-and-guardrails]]
- [[docs/art-direction]]
- [[docs/quality-baseline]]
- [[docs/asset-list]]

## 完成结论

全部范围与验收标准已经满足。真实测试网部署仍按非目标留给部署者：仓库提供合约、脚本、配置与诚实未配置态，不伪造链上地址或交易。下一笔提交删除本临时计划和 [[PLANS]] 活动行，长期事实由 [[docs/injective-keepsake-mint]] 与 ADR-017 承接。
