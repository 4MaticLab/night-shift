# 小米手表睡眠硬件接入与甲方演示测试

本文面向开发、测试和售前人员，以 Xiaomi Watch S4 为例，区分“现在可演示的网页能力”“小米数据链路验证”和“后续真实接入工程”。目标是让甲方清楚看到硬件价值，同时不把接口预演误报为真实连接。

## 结论先行

### 推荐测试硬件

| 项目 | 推荐 | 理由 |
|---|---|---|
| 手表 | Xiaomi Watch S4 国际版 | 小米官方资料明确支持全天睡眠、睡眠分期、心率和 Mi Fitness 同步，外观适合现场展示 |
| 手机 | Android 14 或更高版本手机 | Health Connect 已集成到 Android 框架，现场少一个安装环节 |
| 应用 | 最新版 Mi Fitness | 负责手表配对、固件升级、睡眠记录同步及可选的 Health Connect 数据共享 |
| 网页 | Night Shift 当前预览部署 | 展示产品完整虚拟硬件闭环和隐私边界 |
| 后续 PoC | 原生 Android Companion | 读取 Health Connect；浏览器本身不能直接调用该原生 API |

如预算有限，Xiaomi Smart Band 系列也能做数据源验证，但甲方演示优先用 Watch S4：表盘更适合镜头展示，官方 FAQ 对睡眠分期和同步路径说明更完整。

### 当前能力边界

| 链路 | 当前状态 | 现场可以怎么说 |
|---|---|---|
| Night Shift 虚拟手表 | 已实现 | “这是完整可玩的本机数据闭环。” |
| Watch S4 → Mi Fitness | 可用，依设备和地区配置 | “手表原始睡眠先由小米应用同步。” |
| Mi Fitness → Health Connect | 需在测试手机上逐项验证 | “该手机上只有 Health Connect 确实出现睡眠记录才算通过。” |
| Health Connect → Night Shift 网页 | 未实现 | “网页入口目前是接口预演，不宣称已经读取真实数据。” |
| Health Connect → 原生 Companion → 网页 | 推荐 PoC | “下一阶段以本机最小摘要桥接，不上传原始健康曲线。” |

## 为什么不能让网页直接连接手表

- Health Connect 是 Android 原生数据存储和权限层，网页 JavaScript 没有直接访问接口。
- Xiaomi Watch S4 必须通过 Mi Fitness 配对；小米官方说明手表不支持第三方应用，睡眠数据应先同步到 Mi Fitness。
- Web Bluetooth 不适合读取小米睡眠历史：浏览器只能访问设备公开的 GATT 服务，厂商睡眠协议和历史数据库并不是稳定的网页 API。
- 逆向私有蓝牙协议会带来兼容、账号、隐私和维护风险，不适合面向甲方承诺。

因此推荐链路是：

```text
Xiaomi Watch S4
      ↓ Bluetooth
Mi Fitness（手机本地同步）
      ↓ 仅当该版本实际写入 Sleep 数据
Android Health Connect
      ↓ READ_SLEEP，按需 READ_HEART_RATE
Night Shift Android Companion
      ↓ 只输出标准化摘要，本机传输
Night Shift 网页
```

## 测试 A：当前网页硬件闭环

目的：在不依赖真实厂商接口的情况下，证明 Night Shift 已经具备设备选择、最小授权、夜间采集状态、刷新恢复和晨报摘要。

### 前置条件

- Night Shift 测试地址可访问；
- 浏览器允许本地存储；
- 预留 3 分钟；
- 从干净存档开始，或选择未在采集中的案件。

### 步骤

1. 进入“今晚”，打开“睡眠硬件”。
2. 选择“十七号夜表”。
3. 只保留睡眠窗口、分期、心率和动作，点击授权。
4. 确认顶栏显示“设备已接”。
5. 选择“今夜真实交接”并启动。
6. 确认夜班页显示设备记录状态。
7. 刷新页面，确认活动夜班与设备状态恢复。
8. 点击一次“我只是醒了一下”，确认不会结束夜班。
9. 点击“我醒了，拆开报告”。
10. 检查晨报硬件摘要和“非医疗结论”提示。
11. 返回硬件中心撤销授权，确认案件仍可继续。

### 通过标准

- 授权前不创建采集；
- 夜班中不能静默更换来源；
- 刷新不丢失活动会话；
- 晨报只显示摘要，不出现原始逐点曲线；
- 撤销设备不减少线索、植物或结局资格。

## 测试 B：Xiaomi Watch S4 数据源验证

目的：证明实物手表能稳定记录睡眠并同步至 Mi Fitness；进一步确认测试手机上的 Mi Fitness 是否将睡眠写入 Health Connect。此测试不等于 Night Shift 已完成真实接入。

### B1. 配对和固件

1. 手表电量保持在 50% 以上，手机开启蓝牙和网络。
2. 安装最新版 Mi Fitness，并登录专用测试账号；不要使用甲方个人健康账号。
3. 长按手表电源键开机，通过二维码或 Mi Fitness 的“添加设备”选择 Xiaomi Watch S4。
4. 核对手机和手表显示的安全码并完成配对。
5. 在 Mi Fitness 设备页更新手表固件。
6. 将 Mi Fitness 加入后台运行白名单，避免系统杀死同步进程。

### B2. 生成睡眠记录

1. 在 Mi Fitness 中开启睡眠监测；需要分期时再开启高级睡眠监测。
2. 表带保持贴合但不过紧，传感器背面干净、干燥。
3. 正式验收建议佩戴完整一夜；彩排可用一段被设备识别的午睡，但不能保证所有机型都立即生成完整分期。
4. 醒来后打开 Mi Fitness，等待同步完成。
5. 在“健康 → 睡眠”确认：开始／结束时间、总时长，以及设备实际提供的深睡、浅睡、REM、清醒片段。
6. 截图保留测试日期、设备名、应用版本和固件版本；不要在共享群发送包含用户身份的健康详情。

小米官方 FAQ 提醒睡眠报告生成可能有延迟，并建议定期同步以免设备端记录丢失。因此现场演示不要依赖“刚醒来立即生成”。

### B3. 验证 Health Connect

1. Android 14 及以上：打开“设置 → 安全和隐私 → 隐私控制 → Health Connect”；也可直接在设置中搜索 Health Connect。
2. Android 13 及以下：安装并打开 Health Connect 应用。
3. 在 Health Connect 的应用权限中找到 Mi Fitness，检查它是否获准写入睡眠；菜单名称会随版本和地区变化。
4. 在 Health Connect 的数据浏览页检查测试时间范围内是否存在睡眠记录，并查看数据来源是否为 Mi Fitness。
5. 记录以下结果：

| 检查项 | 结果 |
|---|---|
| Mi Fitness 出现在 Health Connect 应用列表 | 通过／失败 |
| Health Connect 中存在睡眠记录 | 通过／失败 |
| 数据来源标识为 Mi Fitness | 通过／失败 |
| 开始／结束时间与 Mi Fitness 基本一致 | 通过／失败 |
| 分期数据存在 | 通过／不支持 |
| 心率数据存在且来源可辨认 | 通过／不支持 |

若 Health Connect 中没有睡眠记录，应判定为“当前地区／版本的数据源链路不兼容”，而不是 Night Shift 失败。不要手工伪造一条数据后宣称来自小米手表。

## 测试 C：真实接入 PoC 设计

### Companion 最小权限

第一阶段只申请：

- `android.permission.health.READ_SLEEP`：读取 `SleepSessionRecord` 和阶段；
- 可选 `android.permission.health.READ_HEART_RATE`：仅在甲方明确要求且数据源确实写入时启用；
- 不申请写入权限；
- 不申请后台读取和 30 天以上历史权限，除非形成新的明确需求和隐私评审。

Health Connect 要求在 Manifest 和 Play 管理中心声明相同的数据用途，并提供权限理由／隐私政策页面。用户可以随时撤销权限，Companion 每次读取前都应重新检查。

### 标准化摘要

Companion 只向网页暴露一夜摘要：

| Night Shift 字段 | Health Connect 来源 | 缺失策略 |
|---|---|---|
| `startedAt` / `endedAt` | `SleepSessionRecord` | 无睡眠窗口则不创建硬件回执 |
| `durationMinutes` | 结束时间减开始时间 | 校验为非负且不超过合理范围 |
| `sleepStages` | session stages | 缺失时显示“设备未提供”，不推断 |
| `heartRate` 摘要 | `HeartRateRecord` | 不存在则省略 |
| `confidence` | Night Shift 自有数据完整度 | 不能冒充厂商医学置信度 |
| `source` | 数据来源包名和设备元数据 | 明确标注 Mi Fitness／未知来源 |

原始心率、呼吸和阶段时间序列只在 Companion 内存中完成汇总，不写进网页存档。网页继续最多保留最近 8 条摘要。

### 本机传输建议

优先复用 Home Assistant Connector 的安全模型，但为健康域建立独立进程和存储：

- 只监听 `127.0.0.1`；
- 以一次性配对码授权当前浏览器会话；
- 浏览器只读最近一条标准化摘要；
- 响应不包含 Health Connect 权限令牌或原始记录；
- CORS 使用精确部署 origin 白名单；
- 断线或权限撤销时回退到“无设备”，不影响剧情。

正式产品也可采用 Android WebView + JS bridge，但这会把“网页”变成原生壳应用，需要单独评估发布、签名和更新流程。

## 甲方现场演示脚本（5 分钟）

### 0:00–0:45 实物可信度

展示 Watch S4 和 Mi Fitness 睡眠记录：

> “手表负责采集，Mi Fitness 负责厂商同步。我们只需要用户主动授权的一夜摘要，不拿原始长期曲线。”

### 0:45–1:30 数据边界

若 Health Connect 已有数据，展示来源和睡眠时间；若没有，直接说明当前手机链路未开放：

> “这一步是设备兼容性门槛。没有真实来源就不会伪造已连接状态，产品自动回退且故事照常运行。”

### 1:30–3:30 Night Shift 完整闭环

1. 打开 Night Shift 硬件中心；
2. 先展示“真实桥接 → Health Connect”标为接口预演；
3. 切回虚拟硬件，授权“十七号夜表”；
4. 启动真实夜班，展示记录状态和刷新恢复；
5. 结束夜班，展示晨报摘要。

### 3:30–4:30 解释接入架构

展示链路：Watch S4 → Mi Fitness → Health Connect → Companion → 网页。强调 Companion 只读 `READ_SLEEP`，网页不保存原始数据。

### 4:30–5:00 失败演示

主动撤销虚拟设备授权或关闭 Companion：

> “设备失败不会让用户失去线索，也不会形成睡眠评分惩罚。这是叙事增强层，不是医疗或胜负系统。”

## 甲方验收表

| ID | 场景 | 预期 |
|---|---|---|
| HW-01 | Watch S4 与 Mi Fitness 配对 | 双端安全码一致，设备页显示已连接 |
| HW-02 | 完整一夜后同步 | Mi Fitness 显示睡眠窗口和可用分期 |
| HW-03 | Health Connect 来源检查 | 有记录则来源可追溯；无记录则明确阻塞原因 |
| HW-04 | 网页虚拟手表授权 | 明确确认后才显示设备已接 |
| HW-05 | 夜班中刷新 | 会话与采集状态恢复 |
| HW-06 | 晨报回执 | 仅摘要、非医疗、无原始曲线 |
| HW-07 | 撤销授权 | 停止后续采集，案件继续 |
| HW-08 | Companion 无权限 | 显示未授权，不伪装同步成功 |
| HW-09 | Mi Fitness 没有写入 Sleep | 标记设备链路不兼容，允许改用虚拟设备 |
| HW-10 | 错误来源或重复记录 | 拒绝或去重，不合并为虚假长睡眠 |

## 现场准备清单

- Watch S4、充电底座、备用表带；
- Android 14+ 手机、充电器、稳定网络；
- 专用小米测试账号；
- 已同步完成的前一晚记录，避免等待即时报告；
- Night Shift 线上预览和本地备用版本；
- 一份录屏，用于蓝牙、账号或 Health Connect 临时异常；
- 演示前关闭私人通知和联系人同步；
- 甲方书面同意后才展示任何真实健康摘要。

## 风险和停止条件

出现以下任一情况时，不宣称真实接入成功：

- Mi Fitness 没有显示本夜睡眠；
- Health Connect 中没有 Mi Fitness 睡眠来源；
- 页面仅停留在“接口预演”；
- 只能通过手工录入或第三方未知工具搬运数据；
- 无法说明权限、删除、撤销和数据保留路径；
- 测试需要甲方提供个人健康账号或长期令牌。

## 官方参考

- [Xiaomi Watch S4 FAQ](https://www.mi.com/global/support/faq/details/KA-517264/)：配对、睡眠监测、Mi Fitness 同步和设备端数据保留。
- [Mi Fitness（Google Play）](https://play.google.com/store/apps/details?id=com.xiaomi.wearable)：应用权限、Health Connect 数据同步说明和数据安全声明。
- [Health Connect 快速入门](https://developer.android.com/health-and-fitness/health-connect/get-started)：平台版本、权限、客户端和读取流程。
- [Health Connect 数据类型](https://developer.android.com/health-and-fitness/health-connect/data-types)：`SleepSessionRecord`、`READ_SLEEP`、心率和呼吸等类型。

## 相关文档

- [[docs/sleep-hardware-user-guide]]
- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[docs/demo-script]]
- [[docs/home-assistant-ambient-bridge]]
