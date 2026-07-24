# Home Assistant 空间外设桥

## 定位

Home Assistant 是 Night Shift 的可选空间环境层：它把 HomeKit、Matter、Zigbee 或厂商设备先收敛成 Home Assistant 实体，再由本机桥把游戏的三个语义时刻翻译成受限灯光、场景、开关或风扇动作。它不读取睡眠健康数据，不参与案件结算，也不是浏览器直接扫描局域网设备。

普通网页无法可靠承担 mDNS、HomeKit HAP、Matter 或局域网令牌保管。本方案因此分成三层：

```text
Night Shift 浏览器 → 127.0.0.1 本地桥 → Home Assistant WebSocket API → 已接入的房间设备
       语义 cue          配对／白名单          认证／状态订阅／service
```

网页只知道受支持的实体投影、用户选择的绑定和桥在线状态。`HA_TOKEN` 始终只存在于本地桥进程。

## 快速接线

1. 在 Home Assistant 中创建一枚长期访问令牌。比赛机建议使用专用本地账号，并只把准备展示的设备暴露给该账号。
2. 启动 Night Shift 前端：

   ```bash
   npm run dev
   ```

3. 另开一个终端启动本地桥：

   ```bash
   HA_URL=http://homeassistant.local:8123 \
   HA_TOKEN=replace-with-local-token \
   npm run bridge:start
   ```

   若局域网可发现 `_home-assistant._tcp.local.`，可以省略 `HA_URL`；显式 URL 对比赛现场更稳定。
4. 终端会显示六位配对码。打开游戏的“硬件中心 → 房间外设”，输入配对码。
5. 为“夜班出发”“睡隙回声”“晨报抵达”分别选择实体，先执行一次试运行，确认后再开启游戏自动响应。

默认桥地址为 `http://localhost:43117`，只监听 `127.0.0.1`，默认只接受 `http://localhost:3000` 和 `http://127.0.0.1:3000`。比赛版本应在同一台电脑上运行前端、本地桥与浏览器。公网 Sites／Vercel 页面直接连接观众电脑的 localhost 不属于当前支持范围。

## 环境变量

| 变量 | 必需 | 作用 |
|---|---:|---|
| `HA_TOKEN` | 是 | Home Assistant 长期访问令牌；只由本地桥读取 |
| `HA_URL` | 推荐 | Home Assistant HTTP(S) 根地址；缺省时尝试 mDNS |
| `NIGHT_SHIFT_BRIDGE_PORT` | 否 | 本地桥端口，默认 `43117` |
| `NIGHT_SHIFT_PAIR_CODE` | 否 | 固定六位演示配对码；缺省时每次启动随机生成 |
| `NIGHT_SHIFT_ALLOWED_ORIGINS` | 否 | 逗号分隔的前端 origin 白名单 |
| `NEXT_PUBLIC_HOME_ASSISTANT_BRIDGE_URL` | 否 | 前端使用的桥 URL；默认按当前 hostname 选择 localhost |

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
- 配对会话使用 12 小时、HttpOnly、SameSite Strict Cookie；服务端只保存随机会话值的 SHA-256 摘要。
- 实体状态与事件流只保存在运行内存；完整 Home Assistant 状态不会进入游戏存档。
- 第一次试运行或 cue 前，本地桥为灯、开关和风扇抓取一份最小前态；“恢复原状态”尽力还原。场景无法通用恢复，会明确列为跳过。
- 本地桥重启后配对、状态快照和内存绑定都会失效；浏览器重新配对后会把已保存绑定同步回桥。

## 协议与验证

本地 API 版本前缀为 `/v1`。`GET /status` 可用于发现是否运行；配对后可访问 `/entities`、`/bindings`、`/events`，并通过 `/test`、`/cues`、`/restore` 执行受限动作。请求体上限为 32 KiB，非白名单 origin 会在路由前被拒绝。

常用验证：

```bash
npm run bridge:test
PLAYWRIGHT_PORT=3107 npm run test:e2e -- --grep "Home Assistant"
```

协议测试使用模拟 Home Assistant WebSocket 服务覆盖认证、初始状态、`state_changed`、命令、错误凭据、origin、配对、危险实体拒绝和令牌不泄漏。浏览器测试覆盖无桥降级、配对、绑定、试运行、启用、cue 失败与核心夜班继续运行。

## 相关文档

- [[docs/architecture]]
- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[docs/hackathon-submission-kit]]
- [[docs/decision-log]]
