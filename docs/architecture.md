# 架构概览

## 运行形态

项目使用 Next App Router、React、TypeScript 与 Sites/Vinext 运行时。当前黑客松版本把游戏页面组织成一个客户端状态机，以减少现场演示中的切页等待；部署仍由服务端渲染首屏元数据和外壳。

## 关键模块

| 模块 | 位置 | 职责 |
|---|---|---|
| 案件内容 | `src/content/case.ts` | 五夜章节、12 条线索、8 件藏品与固定报告文本 |
| 随身物内容 | `src/content/preparations.ts` | 三件准备物、五夜各自的确定性环境回响 |
| 内容契约 | `src/lib/game-engine/schema.ts` | Zod schema、引用与数量约束 |
| 夜间结算 | `src/lib/game-engine/resolve-night.ts` | 根据章节与睡眠质量选择确定性结果 |
| 游戏存档 | `src/stores/game-store.ts` | Zustand 状态、阶段转换与浏览器持久化 |
| 产品界面 | `app/page.tsx` | 首页、交接、夜间、晨报、案件板、收藏和结局 |
| 视觉系统 | `app/globals.css` | 色板、纸张、地图、雨雾、响应式与动效 |
| 资产清单 | `src/content/assets.ts` | 主视觉、八件物证与五枚夜印的 manifest 和解析函数 |

## 状态模型

主要阶段为 `day → ready → night → morning → ending`。章节结算只通过 `resolveNight` 产生，不由生成模型决定。Zustand 使用 `night-shift-save-v1` 保存到浏览器 `localStorage`。

睡眠质量为 `interrupted`、`regular`、`restful`：三者都至少解锁一条主线线索；差异只体现在路线长度、收藏数量、回声事件和环境观察。`selectedPreparationId` 记录当夜随身物，`resolveNight` 只用它选择环境回响，不改变固定线索。完成一夜后，章节编号会加入持久化的 `nightSealIds`。

## 内容边界

生成式能力只用于视觉资产或未来对固定报告事实的文字润色。伊芙琳是否活着、人物动机、线索存在性、核心因果与结局条件必须来自确定性内容，详见 [[docs/story-bible]]。

## 当前边界

当前 UI 集中在 `app/page.tsx`，适合快速演示但不利于长期局部迭代；真实跨夜模式也尚未完成产品化。这些问题统一收敛在 [[plans/0003-mvp-quality-hardening]]，文档不会提前把它们描述为已实现能力。

## 相关文档

- [[docs/product-overview]]
- [[docs/decision-log]]
- [[docs/quality-baseline]]
- [[plans/0001-hackathon-mvp]]
