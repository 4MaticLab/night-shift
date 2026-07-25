# 本地纪念品二维码交换

- 状态：`completed`
- 优先级：P2
- 创建：2026-07-25
- 更新：2026-07-25
- 负责人：Codex
- 分支：`feat/keepsake-qr-exchange`
- 依赖：无
- 推进模式：`auto`

## 动机

用户希望增加玩家之间的互动：把纪念品（souvenir）生成二维码分享给别人，别人在网页端扫码即可把该纪念品收进自己的本地收藏；收到的纪念品同样可以再生成海报与二维码继续分享。沿用既有"好友线索分享"的 local-first 模式（把稳定 ID 编进链接/二维码，扫码端写入本地存档），不引入后端或账号。

## 范围

- 新增 `src/lib/game-engine/keepsake-sharing.ts`：纪念品分享链接的编码/解码与校验（纯函数，镜像 `clue-sharing`）。
- 新增独立本地存档 `src/stores/keepsake-store.ts`（`night-shift-keepsakes-v1`），保存"已收到的纪念品 ID"，与主游戏存档隔离，避免存档迁移风险。
- 新增页面 `/keepsake`：
  - 收取：`?keepsake=<id>` 校验后写入本地收藏并展示；
  - 陈列/分享：列出九件纪念品，为每件生成二维码与可打印的分享海报卡；已收到的标记"已收藏"。
- CSS 与 i18n（中英）。
- 单测覆盖分享链接编解码与非法输入。

## 非目标

- 不改主游戏存档结构或迁移（纪念品收藏走独立 localStorage 键）。
- 不改线索、推论、结局条件或任何故事事实；纪念品本就是非评分内容。
- 不引入后端、账号或真实服务器同步。

## 任务

- [x] `keepsake-sharing.ts` 纯函数 + 单测。
- [x] `keepsake-store.ts` 独立本地存档。
- [x] `/keepsake` 页面：收取 + 陈列/分享（二维码 + 海报卡）。
- [x] CSS 与文案。
- [x] 验证：`vitest run`、`eslint .`、`next build`。

## 验收标准

- 打开 `/keepsake?keepsake=<合法ID>` 会把该纪念品写入本地收藏并展示；非法/未知 ID 不写入、不报错。
- 每件纪念品可生成二维码与可打印分享海报；重复收取幂等。
- 收藏隔离在独立 localStorage 键，不触碰主存档。
- 单测、lint、构建通过。

## 验证

- `node node_modules/.bin/vitest run`
- `node node_modules/.bin/eslint .`
- `node node_modules/.bin/next build`

## 决定记录

- 2026-07-25：创建计划，`auto` 模式自审进入 `in_progress`。纪念品为非评分内容，独立本地键避免主存档迁移，符合 local-first 与隐私护栏。
- 2026-07-25：完成实现。`keepsake-sharing` + `keepsake-store`（`night-shift-keepsakes-v1`）+ `/keepsake` 页（扫码收取 + 二维码/海报分享）；页面为 zh-only（与 `/posters` 一致，不依赖游戏 i18n provider）。验证：`vitest run` 21 文件 144 用例全过（含 6 条 keepsake 用例）、`eslint .` 通过、`next build` 成功、浏览器实测 `?keepsake=rain-receipt` 收取、幂等与“已收藏”标记生效。

## 相关文档

- [[docs/architecture]]
- [[docs/index]]
