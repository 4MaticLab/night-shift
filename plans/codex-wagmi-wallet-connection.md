# Wagmi 3 钱包连接

- 状态：`in_progress`
- 优先级：P1
- 创建：2026-07-24
- 更新：2026-07-24
- 负责人：Codex / Human
- 分支：`codex/wagmi-wallet-connection`
- 依赖：现有 Injective EVM Testnet mint 对话框和 viem 合约调用
- 推进模式：`auto`

## 动机

当前 mint 对话框直接读取单一 `window.ethereum`，没有 connector 状态层、EIP-6963 多钱包选择或持久连接。安装多个钱包时无法明确选择 provider；未注入钱包时只会进入错误态。比赛演示需要用积极维护且与现有 viem 栈兼容的 wagmi 3 接管 injected 钱包连接，同时保留项目已有视觉和 mint 授权协议。

## 范围

- 引入 wagmi 3 与 TanStack Query。
- 为 Injective EVM Testnet 建立客户端 Wagmi provider 和 injected connector。
- 在现有 mint 对话框中展示可用浏览器钱包并使用所选 connector。
- 用 wagmi 的连接、切链和 wallet client 状态替代直接读取 `window.ethereum`。
- 补充连接状态测试与稳定文档。

## 非目标

- 不启用 WalletConnect，不申请或配置 Reown project ID。
- 不引入 RainbowKit、Reown AppKit 或其他成套钱包 UI。
- 不支持 Cosmos 原生钱包或 Injective native transaction。
- 不修改后端 voucher、合约或生产部署配置。
- 不自动部署 Vercel；本计划只提交可评审的仓库变更。

## 任务

- [ ] 安装并配置 wagmi 3、TanStack Query 和 Injective 测试网 connector。
- [ ] 把全局客户端 provider 接入 Next 应用。
- [ ] 将 mint 对话框迁移到 wagmi 钱包发现、连接、切链与 wallet client。
- [ ] 覆盖钱包选择、无 provider 和 mint 主路径测试。
- [ ] 更新稳定文档并完成全量最小验证。

## 验收标准

- 浏览器注入一个或多个 EIP-1193/EIP-6963 钱包时，mint 对话框可以列出并连接所选钱包。
- 没有注入钱包时，界面明确说明需要浏览器钱包，不出现空操作。
- 连接后能切换或添加 Injective EVM Testnet，并继续使用现有 voucher 和 `redeem` 流程。
- 页面刷新后的连接状态由 wagmi 管理，不再直接依赖全局 `window.ethereum`。
- 项目不包含 WalletConnect connector、project ID 或相关运行时依赖。

## 验证

- `npm test`
- `npm run lint`
- `npm run build`
- 针对 Injective mint 的 Playwright／组件现有测试
- `npm run docs:check`
- `git diff --check`

## 决定记录

- 2026-07-24：用户选择 wagmi 3，原因是维护活跃。
- 2026-07-24：比赛范围只支持 injected/EIP-6963 钱包；不配置 WalletConnect，接受普通手机浏览器和无扩展内嵌浏览器不能连接的边界。
- 2026-07-24：保留现有夜班视觉，自建轻量钱包列表，不引入完整钱包 Kit。

## 相关文档

- [[docs/injective-keepsake-mint]]
- [[docs/architecture]]
- [[docs/quality-baseline]]
