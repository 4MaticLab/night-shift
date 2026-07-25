# 证物放大镜与隐藏细节

- 状态：`completed`
- 优先级：P2
- 创建：2026-07-25
- 更新：2026-07-25
- 负责人：Codex
- 分支：`feat/evidence-loupe-details`
- 依赖：无
- 推进模式：`auto`

## 动机

游戏的图片/证物呈现偏静态，缺少"凑近看、找细节"的解密与探索手感。加入一个可复用的取证放大镜（loupe）微插件，让玩家在证物图上移动/长按查看放大细节，增强交互性与探索性，同时保持 local-first、不改故事事实、不影响打印。

## 范围

- 新增纯函数 `src/lib/ui/loupe.ts::computeLoupe`：由指针位置与容器尺寸推导镜片位置与放大背景定位，带边界钳制。
- 新增客户端组件 `src/components/game/evidence-loupe.tsx`：包裹证物图，桌面 hover / 移动端点按显隐圆形放大镜。
- 晨报头图（`.lead-figure`）接入放大镜。
- `app/globals.css` 新增放大镜样式；打印与 `prefers-reduced-motion` 下安全回落（隐藏镜片、保留底图）。
- 新增单测 `tests/loupe.test.ts` 覆盖 `computeLoupe` 边界与放大定位。

## 非目标

- 不改线索、推论、结局条件或任何故事事实。
- 不新增后端、账号或资产。
- 不改海报打印内容与尺寸。

## 任务

- [x] `computeLoupe` 纯函数 + 单测。
- [x] `EvidenceLoupe` 客户端组件 + CSS。
- [x] 晚报头图接入。
- [x] 验证：`vitest run`、`eslint .`、`next build`。

## 验收标准

- 晨报头图上可用放大镜查看细节；移动端点按显隐；键盘/减动效/打印不报错且安全回落。
- 组件可复用（props 传 src/alt/caption/zoom）。
- 单测、lint、构建全部通过。

## 验证

- `node node_modules/.bin/vitest run`
- `node node_modules/.bin/eslint .`
- `node node_modules/.bin/next build`

## 决定记录

- 2026-07-25：创建计划，`auto` 模式自审进入 `in_progress`。
- 2026-07-25：完成实现。`computeLoupe` 纯函数 + `EvidenceLoupe` 组件，接入晚报头图；屏幕专用，打印/减动效安全。验证：`vitest run` 21 文件 143 用例全过（含 5 条 loupe 用例）、`eslint .` 通过、`next build` 成功。

## 相关文档

- [[docs/art-direction]]
- [[docs/index]]
