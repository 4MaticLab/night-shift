# Mini Lindo 传感器手册

本文是 [[docs/rdk-x5-sleep-sentry]] 的配套深度文档，解决一个问题：**Mini Lindo（小林渡）床头哨站的每一路传感器怎么接、怎么读、坏了会怎样、字段最终流向哪里**。整体链路、名分与隐私边界见哨站主文档，此处不重复。

## 通道总览

| 通道 | 总线 / 设备 | 依赖（懒加载） | 产出字段 | 缺席时 |
| --- | --- | --- | --- | --- |
| SHT3x 温湿度 | I2C 总线 5，地址 `0x44` | `smbus2` | `temperatureC`、`humidityPct` | 两字段为 `null` |
| SGP30 空气质量 | I2C 总线 5，地址 `0x58` | `smbus2` | `co2Ppm`、`tvocPpb` | 两字段为 `null` |
| PMS5003 颗粒物 | UART `/dev/ttyS1` @9600 | `pyserial` | `pm25` | 字段为 `null` |
| 摄像头体动 | USB UVC（默认 `--camera 0`）或 MIPI CSI | `opencv` + `numpy` | 体动聚合统计（见下） | `/api/v1/motion` 返回 `stats: null` |

四路互相独立，遵循「探测-降级」：任何一路缺席（没接线、地址不对、读失败）只让对应字段变 `null`，绝不让哨站崩溃或拖垮其余读数。实现见 `apps/rdk-sentry/rdk_sentry/drivers.py` 的 `SensorHub` 与 `camera.py`。

## 接线（RDK X5 40PIN）

40PIN 排针为树莓派兼容位、3.3V 电平。I2C 总线号默认 `5`（`drivers.py` 中 `I2C_BUS_DEFAULT`），以板上 `ls /dev/i2c-*` 与 `i2cdetect` 实测为准：

- **SHT3x / SGP30（共享 I2C）**：VIN → 3V3（pin 1），GND → GND（pin 6），SDA → pin 3，SCL → pin 5。两颗芯片地址不同（`0x44` / `0x58`），可并联在同一总线上。
- **PMS5003（UART）**：VCC → 5V（pin 2/4，风扇需要 5V），GND → GND，传感器 TX → 板 RXD、传感器 RX → 板 TXD（默认设备 `/dev/ttyS1`，与板端手册核对具体引脚）。
- **摄像头**：USB UVC 直插 USB 口即可；MIPI CSI 排线接 CSI 座，需在 `camera.py` 的 `_open_mipi()` 挂点按 `hobot_vio.libsrcampy` 启用。

接好后在板上确认：

```bash
i2cdetect -y -r 5        # 应看到 44 与 58
ls /dev/ttyS* /dev/video*
```

## 各通道详解

### SHT3x（温度 + 湿度）

- 单次高重复性测量：写命令 `0x2C06` → 等 20ms → 读 6 字节（温度 2B + CRC、湿度 2B + CRC）。
- 两段数据都做 Sensirion CRC-8 校验（多项式 `0x31`、初值 `0xFF`，`drivers.py` 的 `_crc8`），任一段校验失败整帧作废返回 `None`。
- 换算：`温度 = -45 + 175 × raw / 65535`（保留 1 位小数），`湿度 = 100 × raw / 65535`。
- 每次读取独立开关总线，无常驻状态，掉线后下一轮探测即自动恢复。

### SGP30（eCO₂ + TVOC）

- 首次读取先发 `iaq_init`（`0x2003`），之后每轮发 `iaq_measure`（`0x2008`）→ 等 25ms → 读 6 字节，CRC 校验同 SHT3x。
- **暖机约 15 秒**：期间芯片返回定值 `co2Ppm=400`、`tvocPpb=0`，哨站原样上报、不做遮掩，由桌宠端自行解读。
- 芯片要求周期性调用 `iaq_measure` 维持基线；哨站的传感器轮询天然满足。读失败会重置初始化标记，恢复后重新走 `iaq_init`。
- 上报的 CO₂ 是 **eCO₂（由 H₂ 信号推算的当量值）**，适合趋势叙事，不是计量级浓度——这也是「陈述不诊断」护栏的一部分。

### PMS5003（PM2.5，可选）

- 传感器上电即主动上报，哨站每轮从串口读最多 64 字节，定位帧头 `0x42 0x4D` 后取 32 字节一帧。
- 校验：帧前 30 字节求和与末 2 字节校验和比对，不匹配即弃帧。
- 只取大气环境标定的 PM2.5 值（帧内偏移 12–13）；其余粒径字段暂不消费。
- 风扇件有启动噪声，刚上电的前几帧偏高属正常。

### 摄像头（体动统计）

摄像头在这套方案里是一路「体动传感器」：画面只在内存中差分，**不落盘、不出板**（硬约束见 [[docs/privacy-and-guardrails]]）。

- 采集：2fps 抓帧 → 灰度 → 缩至 160×120 → 高斯模糊 → 与上一帧 `absdiff`，统计亮度差 >18 的像素占比作为「运动占比」。
- 事件判定（`camera.py` 常量）：占比 ≥ `0.04` 记翻身级动作，≥ `0.22` 视为离床级；同类事件 20 秒去抖只记一次。
- `MotionAggregator` 折算出对外统计：`windowMinutes`、`samples`、`tossTurns`、`outOfBedEvents`、`longestQuietMinutes`、`restlessnessIndex`（动作频次 + 平均运动量加权，压到 0–1）。
- 无 OpenCV 或打不开摄像头时该路静默降级，哨站其余功能不受影响。

## 字段流向

一帧读数从板端到桌宠 UI 的完整路径：

1. `SensorHub.read_environment()` 汇总五个环境字段 + `online` 探测结果；
2. `/api/v1/snapshot` 把这一帧放进响应的 `environment` 键（缺席字段 `null`），外层带 `capturedAt` / `source` / `mock`；
3. 桌宠 `src/lib/rdk-bridge.ts` 的 `parseSentrySnapshot` 把它折进契约 `SensorSnapshot`（`src/shared/contracts.ts`）：

| 板端字段 | 契约位置 | 缺席时 |
| --- | --- | --- |
| `temperatureC` | `temperature.valueC` | 演示值补齐 + 记入 `degradedFields` |
| `humidityPct` | `airQuality.humidityPct` | 同上 |
| `co2Ppm` | `airQuality.co2Ppm` | 同上 |
| `pm25` | `airQuality.pm25` | 同上 |
| `tvocPpb` | （暂不消费，仅板端上报） | — |

温度 / CO₂ / 湿度 / PM2.5 四个字段**全部**降级时视为哨站没有任何实测价值，`parseSentrySnapshot` 返回 `null`，本轮切回有明确标记的演示数据。UI 逐字段标注「实测 · 床头哨站 / 演示值补齐」。

体动一侧：`/api/v1/motion` → `parseSentryMotion` → `motionToClipReport` 映射为 `VoidClipReport`，进入夜间环境回执。导入录像生成的同形状对象只用于演示界面，不解析画面，也不代表真实体动分析。

## Mock 数据形状

`--mock` 模式（`mock.py`）合成的数据与真实路径形状完全一致，且所有响应带 `"mock": true`；数值范围可作联调时的「正常读数」参照：

| 字段 | 范围 | 演化 |
| --- | --- | --- |
| `temperatureC` | 15–32 ℃，围绕 22.4 | 慢正弦 + 噪声 |
| `humidityPct` | 25–80 %，围绕 51 | 慢正弦 + 噪声 |
| `co2Ppm` | 420–2000，围绕 680 | 慢正弦 + 噪声 |
| `tvocPpb` | 0–600，围绕 120 | 慢正弦 + 噪声 |
| `pm25` | 2–150，围绕 12 | 慢正弦 + 噪声 |
| 体动统计 | 约每 25 分钟 +1 次翻身、每 150 分钟 +1 次离床 | 随运行时长累积 |

## 板上排障

| 症状 | 排查 |
| --- | --- |
| snapshot 里温湿度 / 空气字段是 `null` | `i2cdetect -y -r 5` 看 `0x44` / `0x58` 在不在；总线号不是 5 则改 `drivers.py` 的 `I2C_BUS_DEFAULT`；报权限错把用户加进 `i2c` 组或 `sudo`；确认 `pip install smbus2` |
| SGP30 一直是 400 / 0 | 前 15 秒是暖机定值，属正常；持续不变则重新上电让它重走 `iaq_init` |
| `pm25` 是 `null` | 确认 `pip install pyserial`、设备路径（默认 `/dev/ttyS1`，不同则改 `drivers.py` 的 `Pms5003Driver` 默认参数）、串口权限（`dialout` 组），以及 TX/RX 没接反 |
| health 里 `camera: false` | `ls /dev/video*` 确认设备；`pip install opencv-python numpy`；换 `--camera` 序号；MIPI CSI 需启用 `_open_mipi()` |
| 读数偶发整帧丢失 | CRC / 校验和失败会弃帧，是设计行为；持续丢帧检查线长与供电（I2C 线尽量短） |

CLI 参数速查：`python3 sentry.py --help`（`--host`、`--port`、`--camera`、`--mock`）。I2C 总线号与 PMS 串口路径暂未做成 CLI 参数，按上表改 `drivers.py` 默认值。

## 新增一路传感器

驱动模式固定，扩展按同一套路：

1. 在 `drivers.py` 写驱动类：`read() -> Optional[dict]`，内部吞掉一切异常返回 `None`，依赖懒加载；
2. 挂进 `SensorHub.read_environment()`，新字段缺席时置 `null`，并加入 `online` 探测表；
3. `mock.py` 补一个同形状的合成字段；
4. 桌宠侧若要消费：`contracts.ts` 扩展 `SensorSnapshot` → `rdk-bridge.ts` 解析（降级补齐逻辑一致）→ 面板加字段标注 → `tests/rdk-bridge.test.ts` 补用例。

协议字段只增不改：`/api/v1/*` 是加法演进，老桌宠遇到新字段直接忽略。

## 相关文档

- [[docs/rdk-x5-sleep-sentry]] — Mini Lindo 整体链路：名分、板端代理、桥接协议与回退逻辑。
- [[docs/privacy-and-guardrails]] — 画面不出板、聚合统计、非诊断边界的上位规范。
- [[docs/sleep-hardware-bridge]] — 网页端虚拟睡眠硬件（与本硬件链路互相独立）。
