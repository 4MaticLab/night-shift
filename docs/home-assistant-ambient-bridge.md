# Home Assistant 空间外设桥

## 定位

Home Assistant 是 Night Shift 的可选空间环境层：它把 HomeKit、Matter、Zigbee 或厂商设备先收敛成 Home Assistant 实体，再由本机桥把游戏的三个语义时刻翻译成受限灯光、场景、开关或风扇动作。它不读取睡眠健康数据，不参与案件结算，也不是浏览器直接扫描局域网设备。

普通网页无法可靠承担 mDNS、HomeKit HAP、Matter 或局域网令牌保管。本方案因此分成三层：

```text
Vercel 上的 Night Shift → 127.0.0.1 Connector → Home Assistant WebSocket API → 房间设备
 Chrome LNA + bearer       配对／白名单／mDNS        认证／状态订阅／service
```

网页只尝试已知的 `127.0.0.1:43117`，不会枚举局域网。Chrome 142+ 会在 HTTPS 网站第一次请求 loopback 时显示 Local Network Access 权限；用户允许后，HTTP loopback 请求才继续。mDNS 发现和 `HA_TOKEN` 都留在 Connector。

## 快速接线

### 下载应用路径

1. 从 GitHub Actions 的 `Connector Artifacts` 下载对应平台产物。macOS 解压后双击 `Night Shift Connector.app`；Windows 双击 `.exe`；Linux 给文件执行权限后启动。Developer Preview 未签名、未公证，系统可能要求用户显式确认。
2. Connector 自动打开 `http://127.0.0.1:43118` 设置页。点击自动发现，或填写 Home Assistant URL；粘贴长期访问令牌并验证。比赛机建议使用专用本地账号，并只向该账号暴露演示设备。
3. 设置页显示安全实体数量和六位配对码。保持 Connector 运行，点击“打开 Night Shift”进入 `https://night-shift-zeta.vercel.app`。
4. 在 Chrome 的“硬件中心 → 房间外设”点击连接；若出现“本地网络访问”提示，选择允许，再输入六位码。
5. 为“夜班出发”“睡隙回声”“晨报抵达”分别选择实体，先执行一次试运行，确认后再开启游戏自动响应。

Connector 设置页只监听 `127.0.0.1:43118`，桥只监听 `127.0.0.1:43117`。Home Assistant token 默认只存在于本次 Connector 进程内；关闭应用后必须重新连接和配对。

### 仓库开发路径

开发者可直接运行同一入口：

```bash
npm run connector:start
```

旧的纯 CLI 桥仍可用于协议调试：

```bash
HA_URL=http://homeassistant.local:8123 \
HA_TOKEN=replace-with-local-token \
npm run bridge:start
```

Connector 默认允许本地开发 origin 和固定 Vercel 生产 origin。设置页中的 Night Shift URL 会把用户明确填写的 preview origin 加入本次进程的精确白名单。

## 环境变量

| 变量 | 必需 | 作用 |
|---|---:|---|
| `HA_TOKEN` | 是 | Home Assistant 长期访问令牌；只由本地桥读取 |
| `HA_URL` | 推荐 | Home Assistant HTTP(S) 根地址；缺省时尝试 mDNS |
| `NIGHT_SHIFT_BRIDGE_PORT` | 否 | 本地桥端口，默认 `43117` |
| `NIGHT_SHIFT_PAIR_CODE` | 否 | 固定六位演示配对码；缺省时每次启动随机生成 |
| `NIGHT_SHIFT_ALLOWED_ORIGINS` | 否 | 逗号分隔的前端 origin 白名单 |
| `NIGHT_SHIFT_APP_URL` | 否 | Connector 打开的 Night Shift URL；默认固定 Vercel 生产地址 |
| `NEXT_PUBLIC_HOME_ASSISTANT_BRIDGE_URL` | 否 | 前端使用的桥 URL；默认 `http://127.0.0.1:43117` |
| `NEXT_PUBLIC_CONNECTOR_DOWNLOAD_URL` | 否 | 前端下载按钮；发布前可指向 Actions／Release 页面 |

不要把 `HA_TOKEN` 写进 `.env` 的 `NEXT_PUBLIC_*` 变量、浏览器存储、演示录屏或错误截图。若必须保存本机环境文件，应保持它不受 Git 跟踪。

## 支持边界

桥只归一化以下 Home Assistant 域：

| 域 | 行为 |
|---|---|
| `scene` | 只允许 `turn_on`；场景没有可通用还原的前态 |
| `light` | 允许开灯；按 cue 使用固定亮度、过渡与受支持的 RGB 色彩 |
| `switch` | 允许开；还原时恢复最初开／关状态 |
| `fan` | 允许开；支持时使用 25% 档位，还原最初状态与百分比 |
| `sensor`、`binary_sensor` | 只读显示，从不发送 service |

门锁、车库门、安防、摄像头、警报、任意脚本、任意 automation 和任意 service 调用都不会进入前端实体列表或控制白名单。实体 unavailable 时拒绝动作。浏览器不能提交自定义 service、domain 或 service data。

三个语义 cue 是稳定契约：

- `night.started`：夜班真正进入 `night` 阶段时发送。
- `wake.echo`：真实夜班第一次记录醒转回声时发送。
- `morning.arrived`：夜班结束并进入 `morning` 时发送。

请求 ID 由案件、章节、睡眠会话和 cue 组成；本地桥在 30 分钟窗口内去重。桥失败、Home Assistant 断线、设备 unavailable 或 service 调用失败都只改变外设状态，不等待或回滚游戏状态机。

## 本地状态与恢复

- 浏览器存档 `night-shift-ambient-hardware-v1` 只保留启用开关和三个实体 ID 绑定。
- 配对返回 12 小时随机 bearer；网页只把它放进当前标签页的 `sessionStorage`，Connector 只保存 SHA-256 摘要。它不是 Home Assistant token，不能调用白名单外 API。
- 实体状态与事件流只保存在运行内存；完整 Home Assistant 状态不会进入游戏存档。
- 第一次试运行或 cue 前，本地桥为灯、开关和风扇抓取一份最小前态；“恢复原状态”尽力还原。场景无法通用恢复，会明确列为跳过。
- 本地桥重启后配对、状态快照和内存绑定都会失效；浏览器重新配对后会把已保存绑定同步回桥。

## 协议与验证

本地 API 版本前缀为 `/v1`。`GET /v1/status` 可用于检查 Connector；`POST /v1/pair` 用六位码换取 bearer；配对后可访问 `/v1/entities`、`/v1/bindings`，并通过 `/v1/test`、`/v1/cues`、`/v1/restore` 执行受限动作。请求体上限为 32 KiB，非白名单 origin 会在路由前被拒绝。浏览器 fetch 明确设置 `targetAddressSpace: "loopback"`；不支持该路径的浏览器需要原生 App、扩展或云中继，本项目只承诺 Chrome。

常用验证：

```bash
npm run bridge:test
npm run connector:test
npm run connector:build
npm run connector:smoke
PLAYWRIGHT_PORT=3107 npm run test:e2e -- --grep "Home Assistant|Connector"
```

`npm run connector:build:all` 生成 macOS arm64、macOS x64、Windows x64 与 Linux x64 四个目录；PR 的 `Connector Artifacts` workflow 执行相同构建并上传临时 artifact，不创建公开 Release。协议测试使用模拟 Home Assistant WebSocket 服务覆盖认证、状态、命令、错误凭据、origin、配对、危险实体拒绝和令牌不泄漏；浏览器测试覆盖无 Connector 降级、下载指引、配对、绑定、试运行、启用、cue 失败与核心夜班继续运行。

## 相关文档

- [[docs/architecture]]
- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[docs/hackathon-submission-kit]]
- [[docs/decision-log]]
