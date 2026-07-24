# 第十三个面包视觉档案

CASE 003 的 34 张运行时图像使用 Codex 内置图像生成能力制作，再按既有资产尺寸压缩为 WebP。生成时以首案四幕横幅、人物肖像、城区版画、植物标本、收藏品和夜印成品作为媒介参考；参考只用于保持 Night Shift 自身的纸张、铜绿、深蓝与暖灯语言，不复刻外部作品角色或构图。

## 共用提示词

> Original Night Shift literary storybook noir illustration, handmade gouache and dry-brush texture on aged paper, deep navy and charcoal shadows, muted teal patina, restrained amber lamplight and worn brass, humane asynchronous investigation atmosphere, quiet underground municipal city, tactile archival printmaking, mature editorial composition. No readable text, letters, numbers, logo, watermark, UI, photorealism, glossy 3D, neon cyberpunk, horror gore, or existing franchise characters.

所有画面把“十二个有主份额 + 一个无主访客份额”“公共热力责任”“分散酵母与共同劳动”作为重复视觉语法。精确事实由 manifest 文本固定；图像中的小型重复物只承担象征，不作为玩家数数解谜的唯一依据。

## 提示词组

| 类别 | 数量 | 画幅 | 主题附加提示 |
|---|---:|---|---|
| 四幕横幅 | 4 | 1600 × 800 | 林渡在交接桌前接过无主面包；沿蒸汽管与街柜夜行；黎明回到十二张空工作台；十二枚持份环围住一只访客面包的结案静物 |
| 夜间明信片 | 5 | 1536 × 1024 | 依次表现暖柜与面粉脚印、十二件围裙、从主管向砖炉展开的焦痕、窗台酵母路线、重新开放的访客柜 |
| 植物标本 | 5 | 1024 × 1536 | 暖柜麦、十二指黑麦、热力管莎草、共酵藤、客份晨花；米色标本纸、深蓝叶、铜色根脉、暖色花芯 |
| 收藏品 | 8 | 512 × 512 | 持份环、柜钩、无字访客牌、路线线轴、主管熔断器、焦边检察章、共酵罐盖、公共房契扣；单件档案静物、透明感暗底、无铭文 |
| 夜印 | 5 | 506 × 506 | 每夜核心事实的圆形压印：暖柜、空白访客牌、热力方向、分布式酵母、开放公共份额 |
| 人物肖像 | 4 | 1024 × 1280 | 宋岑持份环与访客牌；费澄持压力表与熔断器；柯遥持纸包面包与自行车灯；何砾持烧焦房契与修复刀 |
| 城区版画 | 3 | 1200 × 800 | 煤钟街的空白钟塔与暖柜；炉桥廊的石拱、主管和阀门房；黎明粮仓的河岸拱廊、运粮坡道与公共庭院 |

人物要求延续 [[docs/art-prompts/lin-du-handoff-portrait]] 的克制肖像距离和手工媒介，但四位证人必须具有独立年龄、体态、服装与工具。城区要求延续 [[docs/art-prompts/foglight-districts]] 的横向档案版画，不出现现代霓虹招牌。植物、收藏品和夜印分别延续首案已有类别的纸张比例、中央留白与轮廓可读性。

## 运行时映射

- 横幅：`public/art/cases/thirteenth-loaf/headers/`
- 明信片：`public/art/cases/thirteenth-loaf/postcards/`
- 植物：`public/art/cases/thirteenth-loaf/botany/`
- 收藏品：`public/art/cases/thirteenth-loaf/collectibles/`
- 夜印：`public/art/cases/thirteenth-loaf/night-seals/`
- 人物：`public/art/cases/thirteenth-loaf/characters/`
- 地区：`public/art/cases/thirteenth-loaf/districts/`
- 资产 ID、替代文本与具体文件：`src/content/thirteenth-loaf-assets.ts`

所有 34 个 ID 都由 `CampaignManifest` 或通用档案页实际消费。生成原图保存在本机 Codex 生成目录，仓库只提交经过视觉检查与压缩的运行时 WebP。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/thirteenth-loaf-story-bible]]
- [[docs/art-prompts/global-style]]
- [[docs/art-prompts/four-act-headers]]

