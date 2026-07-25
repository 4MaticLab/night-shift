# Electron 桌宠：林渡值更台

- 状态：`completed`
- 优先级：P2
- 创建：2026-07-25
- 更新：2026-07-25
- 负责人：Codex
- 分支：`feat/desk-pet`
- 依赖：无
- 推进模式：`auto`

## 动机

用户希望把 Night Shift 的陪伴感延伸到桌面：主角林渡以 Electron 桌宠形式常驻，
提供挂机积分与闲时去蓝盒子床垫睡觉的基本盘；同时为已有的空气质量传感器、
温度传感器和「虚空摄像头」（手动导入一段视频）预留睡眠质量分析入口。
硬件接口尚未接线，本期以明确标注的占位假数据驱动，字段形状对齐未来真接口。

## 范围

- 新增 `apps/desk-pet/` 独立 Electron 子应用（TypeScript，`tsc` 编译，无打包器）。
- 桌宠窗口：透明置顶的林渡形象，系统闲置后躺进蓝盒子床垫，单击台词、双击哄睡/叫醒。
- 挂机积分：值更 +1/min、补眠 +1.5/min、离线补记 +0.5/min（封顶 8 小时），JSON 持久化。
- 夜班面板窗口：积分账本、传感器占位卡（温度/PM2.5/CO₂/湿度）、虚空摄像头导入、睡眠质量占位报告。
- 占位传感器数据生成、视频文件指纹占位分析、睡眠评分纯函数，全部标注 `source: "placeholder"`。
- 根仓库接入：`pet:install` / `pet:start` / `pet:test` 脚本、`tests/desk-pet.test.ts`、eslint/tsconfig/.gitignore 隔离。

## 非目标

- 不接真实传感器硬件或真实视频分析管线（接口未定、无接线）。
- 不做打包分发（electron-builder 等），仅本地 `npm run pet:start`。
- 不改动 Web 端游戏本体、案件内容或存档结构。
- 不把 Electron 依赖装入根 `package.json`。

## 任务

- [x] Electron 子应用骨架：主进程、preload（contextBridge 显式能力面）、双窗口。
- [x] 纯逻辑库：积分规则、占位传感器快照、虚空摄像头占位分析、睡眠评分。
- [x] 桌宠前端：待机/睡觉动画、台词气泡、积分 HUD。
- [x] 面板前端：积分账本、传感器占位卡、录像导入、占位报告。
- [x] 根仓库集成：npm 脚本、vitest 测试、eslint/tsconfig/.gitignore 隔离。

## 验收标准

- `npm run pet:start` 可启动桌宠；闲置 90 秒后林渡躺上床垫，积分速率切换。
- 面板能看到实时占位传感器读数（明确标注未接线），可导入/移除视频并生成占位报告。
- 占位数据可复现（同一视频文件分析结果稳定），报告叙述明示占位属性。
- `npm test` 与 `npm run lint` 通过；子应用类型不泄漏进 Next 构建。

## 验证

- `npm run pet:test`（12 个单测：积分/离线补记/传感器区间/分析可复现/评分档位）。
- `npm test`、`npm run lint` 全量。
- 本机 `npm run pet:start` 真机启动检查主进程与渲染进程存活。

## 最终验证证据（2026-07-25，基于 origin/main 83d36d3）

- `npm ci` 后 `npm test`：24 个测试文件、165 个测试全部通过（含新增 `tests/desk-pet.test.ts` 12 个）。
- `npm run lint`：0 error（仅存在与本计划无关的 `night-cycle.tsx` 历史 warning）。
- `npm run docs:check`：100 个 Markdown 文件双链全部解析。
- 子应用 `tsc -p apps/desk-pet/tsconfig.json` 零错误；渲染产物经 grep 确认无 require/exports 模块语法。
- macOS 真机 `npm run pet:start`：Electron 主进程 + GPU/网络/渲染进程均存活运行 20 秒以上无崩溃。

## 决定记录

- 渲染进程不引打包器：编译为无模块 IIFE 纯脚本，类型经 `import()` 内联共享契约。
- 子应用依赖独立安装（`npm --prefix apps/desk-pet`），避免 Electron 进入根依赖树。
- 空闲检测采用 `powerMonitor.getSystemIdleTime()`，不采集任何输入内容，符合隐私护栏。

## 相关文档

- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[docs/north-star]]
