# feat/rdk-x5-sentry：RDK X5 床头哨站与桌宠通讯端

- 状态：completed
- 模式：auto
- 分支：`feat/rdk-x5-sentry`
- 负责人：agent（桌宠系统延续）

## 动机

桌宠（PR #145）交付时把传感器留成了占位数据，并在 `apps/desk-pet/src/lib/fake-sensors.ts` 的 `createSensorSnapshot` 处预留了唯一对接点。现在引入真实硬件路径：一块地瓜机器人（D-Robotics）RDK X5 开发板摆在用户床头，利用其 MIPI/USB 摄像头与 40PIN I2C 兼容的空气质量、温度传感器，夜间就地分析睡眠环境与体动；桌宠作为这台设备的通讯端，把占位数据升级为实时读数，帮助用户系统性优化睡眠质量。

SDK 调研结论（2026-07 官方文档与社区示例）：RDK X5 跑 RDK OS（Ubuntu 系），Python 侧摄像头走 `hobot_vio.libsrcampy` 或 USB UVC + OpenCV，GPIO 走 `Hobot.GPIO`（BOARD 编码），I2C 传感器走标准 `smbus2`（40PIN 引脚兼容树莓派，3.3V）。因此板端代理用 Python 编写，桥接协议自定 HTTP/JSON。

## 范围

1. **板端代理 `apps/rdk-sentry/`（Python 3，标准库优先）**
   - `sentry.py`：局域网 HTTP 服务（默认端口 8302），端点 `GET /api/v1/health`、`GET /api/v1/snapshot`、`GET /api/v1/motion`。
   - `drivers/`：SHT3x 温湿度与 SGP30 空气质量（CO₂eq/TVOC）的 I2C 驱动（`smbus2`），可选 PMS5003 颗粒物（UART）；逐个探测，缺哪个硬件哪个字段自动降级，不拖垮整机。
   - `camera.py`：帧差法体动分析（OpenCV，USB UVC 优先，MIPI `libsrcampy` 留适配层）；**画面只在内存中处理，任何图像不落盘、不出网**，对外只暴露翻身次数、离床次数、最长安静片段、躁动指数等聚合统计。
   - `--mock` 模式：无硬件时在任意机器（含 macOS）生成形状一致的合成数据，供桌宠联调。
2. **桌宠端桥接（`apps/desk-pet`）**
   - 契约扩展：`SensorSource = "placeholder" | "rdk-x5"`，新增 `SentryConfig` / `SentryStatus`；`SensorSnapshot` / `VoidClipReport` / `SleepQuality` 的 `source` 泛化。
   - 新库 `src/lib/rdk-bridge.ts`：快照解析校验（`parseSentrySnapshot`）、体动统计映射为 `VoidClipReport`、超时与断线回退占位数据的纯逻辑（可测）。
   - `main.ts`：传感器 tick 在哨站在线时切换真实数据源，掉线自动回退占位并广播状态；新增 IPC `sentry:connect` / `sentry:disconnect` 与 `sentry:status` 事件；连接配置持久化。
   - dashboard：「床头哨站」连接卡片（host:port 输入 + 状态灯）；数据源徽标在「未接线 · 占位数据」与「RDK X5 · 实时」之间切换；哨站在线时睡眠报告采用实时体动统计，虚空摄像头导入仍保留为离线备选。
3. **测试与文档**
   - `tests/rdk-bridge.test.ts`：解析、映射、降级回退、异常输入。
   - `docs/rdk-x5-sleep-sentry.md`：硬件清单、40PIN 接线、板端安装运行、mock 联调、隐私护栏；纳入 docs/index 索引。

## 非目标

- 不做板端 AI 推理（`hobot_dnn` 睡姿识别等留给后续计划）。
- 不做云端中转、账号或远程访问；仅局域网直连。
- 不改主线五夜循环、积分规则与现有占位逻辑的默认行为（无哨站时体验与 PR #145 完全一致）。
- 不采购/验证具体传感器货号之外的硬件矩阵。

## 任务

- [x] 板端 `apps/rdk-sentry`：HTTP 服务 + I2C 驱动 + 帧差体动分析 + mock 模式
- [x] 桌宠契约扩展与 `rdk-bridge.ts` 纯逻辑
- [x] `main.ts` 数据源切换、IPC 与配置持久化
- [x] dashboard 连接 UI 与数据源徽标
- [x] `tests/rdk-bridge.test.ts` 全绿并入根 vitest
- [x] `docs/rdk-x5-sleep-sentry.md` 完成并入索引

## 验收标准

1. `python3 apps/rdk-sentry/sentry.py --mock` 在 macOS 可直接运行，三个端点返回合法 JSON。
2. 桌宠 dashboard 填入 mock 哨站地址后：传感器卡片显示 `rdk-x5` 来源与实时数据；停掉 mock 服务后 ≤2 个 tick 自动回退占位数据且 UI 明示。
3. 哨站在线时生成的睡眠报告带实时体动统计；离线时行为与旧版一致。
4. 根 `npm test`、`npm run lint`、子应用 `tsc` 构建、`npm run docs:check` 全部通过。
5. 隐私护栏成立：代码审查确认板端无任何图像持久化或图像出网路径；文档写明可随时断开且不惩罚。

## 验证方式

- 根 vitest（含新 `rdk-bridge.test.ts`）、eslint、desk-pet `tsc`、docs:check。
- 本机双进程联调：`--mock` 哨站 + `npm run pet:start`，人工验证连接、切换、回退与报告。

## 最终验证证据（2026-07-25，实现提交 4ecf0a8）

- `npm test`：25 个文件 / 178 用例全绿（含新增 `tests/rdk-bridge.test.ts` 13 用例与既有 `tests/desk-pet.test.ts` 12 用例未回归）。
- `npm run lint`：0 error（仅主线遗留的 1 个无关 warning）；`apps/desk-pet` `tsc` 构建通过；`python3 -m compileall apps/rdk-sentry` 通过。
- `npm run docs:check`：101 个 Markdown 文件双链全部可解析。
- mock 联调（macOS）：`python3 apps/rdk-sentry/sentry.py --mock` 三端点返回合法 JSON；编译后的 `rdk-bridge` 解析链路端到端验证：health 协议号匹配、snapshot 解为 `source: rdk-x5`（degraded 为空）、motion 映射为实测 `VoidClipReport`，`scoreSleepQuality` 输出带「床头哨站实测」叙述且 `source: rdk-x5`。
- 隐私护栏：`camera.py` 中帧仅内存处理，无任何图像落盘 / 出网路径；文档写明随时断开不惩罚。

## 决定记录

- 桥接协议选 HTTP/JSON 轮询而非 WebSocket/MQTT：板端零依赖（Python 标准库即可服务），桌宠端 `fetch` 即可消费，掉线语义简单，5s 轮询对睡眠场景绰绰有余。
- 摄像头分析放在板端而不是传视频给桌宠：隐私最小化（画面不出板），也符合 X5 的端侧算力定位。
- 传感器驱动按「探测-降级」设计：用户手上的传感器还没接线，任何硬件缺席都不能让哨站崩溃或锁功能，与工程护栏一致。

## 相关文档

- [[docs/sleep-hardware-bridge]]、[[docs/privacy-and-guardrails]]（护栏基线）
- [[docs/rdk-x5-sleep-sentry]]（本计划产出）
