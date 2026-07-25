# Mini Lindo：RDK X5 床头睡眠哨站

本文记录 **Mini Lindo（小林渡）** —— `apps/rdk-sentry`（运行在地瓜机器人 RDK X5 开发板上的床头哨站）与 `apps/desk-pet`（Electron 桌宠，哨站的通讯端）的完整链路：名分与世界观、硬件形态、板端代理、桥接协议、桌宠侧回退逻辑与隐私边界。

## 名分

- **产品名：Mini Lindo（中文口语：小林渡）**，指整套「床头硬件哨站 + 桌宠通讯端」方案，而非单指某一端。
- **世界观身份**：林渡派驻在你床头的迷你分身，替他值离你最近的那一班岗——看着你睡，把夜里的事记成聚合统计交回桌上的林渡。口吻与主线一致：守夜不监视，陈述不诊断。
- **称呼规范**：面向用户的文案用 Mini Lindo / 小林渡；技术标识保持不变——协议 `device: "rdk-x5"`、契约 `SensorSource: "rdk-x5"`、目录 `apps/rdk-sentry/`（存档与契约兼容，不随产品名漂移）。板端 `rdk_sentry/__init__.py` 以 `PRODUCT_NAME = "Mini Lindo"` 为唯一产品名常量，`/api/v1/health` 附带 `product` 字段。

## 硬件形态

- 开发板：D-Robotics（地瓜机器人）RDK X5，Sunrise 5 芯片，RDK OS（Ubuntu 系），40PIN 树莓派兼容排针（3.3V，I2C/SPI/UART/PWM）。
- 摆放：床头，摄像头朝向睡眠区域，接入用户家里的局域网。
- 摄像头：USB UVC 摄像头（默认 `--camera 0`）；MIPI CSI 需按板端 `hobot_vio.libsrcampy` 适配，`camera.py` 中留有 `_open_mipi()` 挂点。
- 传感器（全部可选，缺谁降谁；接线、驱动细节与排障见 [[docs/mini-lindo-sensor-guide]]）：
  - SHT3x（I2C `0x44`）：温度 + 湿度；
  - SGP30（I2C `0x58`）：CO₂ 当量 + TVOC；
  - PMS5003（UART `/dev/ttyS1`）：PM2.5。

## 板端代理 `apps/rdk-sentry`

纯 Python 标准库实现（HTTP 服务零第三方依赖；硬件驱动懒加载 `smbus2` / `pyserial` / `opencv`），在板上直接运行：

```bash
python3 sentry.py                 # 硬件模式，默认 0.0.0.0:8302
python3 sentry.py --mock          # 合成数据模式，可在任何机器上跑（桌宠联调用）
```

- `drivers.py` — 三路传感器驱动 + `SensorHub`：逐路探测，缺席硬件对应字段为 `null`，不抛错、不拖垮其余读数。
- `camera.py` — `CameraWorker` 后台线程按 2fps 抓帧做灰度差分，`MotionAggregator` 聚合翻身 / 离床 / 最长安静片段 / 不安指数；帧只存在内存里。
- `server.py` — `ThreadingHTTPServer` 暴露三个只读 GET 端点（无鉴权，仅限局域网）：

| 端点 | 内容 |
| --- | --- |
| `/api/v1/health` | 设备名、协议号、各传感器与摄像头在线状态 |
| `/api/v1/snapshot` | 当前环境读数（缺席硬件字段为 `null`） |
| `/api/v1/motion` | 体动聚合统计（不含任何图像数据） |

## 桌宠侧桥接 `apps/desk-pet`

桌宠是哨站的唯一通讯端，协议解析集中在 `src/lib/rdk-bridge.ts`（纯逻辑、根 vitest 覆盖），网络轮询在 `src/main.ts`：

- 面板「床头哨站」卡片填入板子 IP（端口默认 8302）→ 主进程先打 `/api/v1/health` 握手，成功后把配置持久化进本地存档，重启自动重连。
- 传感器 tick 优先轮询 `/api/v1/snapshot`；解析成功则以 `source: "rdk-x5"` 广播，缺席硬件字段由占位生成器补齐并记入 `degradedFields`，UI 逐字段标注「实测 / 占位补齐」。
- 连续 2 个 tick 失败即判掉线：自动回退占位数据，UI 明示「掉线 · 已回退占位」，后续 tick 继续重试，不惩罚、不锁功能。
- 睡眠报告优先取 `/api/v1/motion` 的实测体动统计（映射为与导入录像同形状的 `VoidClipReport`）；哨站不在线则回退到虚空摄像头占位分析。

## 隐私与护栏

- 摄像头画面在板上就地差分分析，**不落盘、不出板**；局域网上只传输聚合统计数值。
- 无鉴权端口仅监听局域网，端点全部只读，不接受任何写入。
- 桌宠端随时可断开并清除持久化配置；断开后立即回到占位数据，行为与从未连接过一致。小林渡不在岗不是错误，只是回到想象值班。
- 遵循 [[docs/privacy-and-guardrails]]：设备信号只丰富叙事与报告，不诊断、不惩罚、不锁内容。

## 验证

- 根仓库 `npx vitest run tests/rdk-bridge.test.ts tests/desk-pet.test.ts` — 桥接解析、降级补齐、回退映射与评分叙述。
- `python3 -m compileall apps/rdk-sentry` — 板端语法检查（无板环境）。
- 联调：任一机器 `python3 apps/rdk-sentry/sentry.py --mock`，桌宠面板填 `127.0.0.1` 连接，传感器卡片切换为「RDK X5 · 实时」；停掉 mock 进程后 ≤2 个 tick 自动回退占位。

## 相关文档

- [[docs/mini-lindo-sensor-guide]] — 传感器手册：40PIN 接线、逐路驱动细节、字段流向与板上排障。
- [[docs/sleep-hardware-bridge]] — 网页端虚拟睡眠硬件（与本硬件链路互相独立）。
- [[docs/privacy-and-guardrails]] — 健康数据最小化与非医疗边界。
- [[docs/architecture]] — 仓库整体工程结构。
