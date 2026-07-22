# 雾灯温室植物提示词

五株夜生植物使用内置图像生成能力逐张生成，再以 WebP 质量 88 保存为 1024×1536 的 2:3 植物学标本。运行时用同一张成熟株图由底部逐步揭示四个成长阶段，避免为阶段生成二十张不一致资产。

## 共同提示词

> Original fictional underground-city botanical specimen for a game collectible, centered complete mature plant with roots fully visible on unmarked warm aged archival paper. Literary storybook noir botanical engraving, editorial etching and woodcut print, fine cross-hatching, tactile imperfect ink registration. Deep navy and charcoal ink, oxidized copper green, old wine red traces, sparse amber-gold. Vertical portrait plate with generous margin and no frame. No readable text, labels, numbers, logos, watermark, UI, people, existing characters, or trademarked imagery. Avoid photorealism, glossy fantasy rendering, neon and saturated bright green.

## 五夜形态差异

1. 票根灯蕨：打孔旧票般的蕨叶、琥珀灯笼孢荚、根下雨湿铁轨。
2. 四十三日夜香：酒红星形夜花、信封状苞片、根穿黄铜邮槽。
3. 退房藤：深色心叶、钥匙状黄铜种荚、空白房牌与旧墙纸。
4. 误分类温室苔：地图状铜绿叶脉、抽屉状透明孢囊、破温室玻璃。
5. 零点四十三分钟花：无数字的暗色钟形花盘、烟蓝花瓣、琥珀信号芯、铃形果荚与旧信号线。

## 运行时规则

- 图片只定义成熟植物视觉；名称、传闻、成长阶段和无惩罚规则来自 `src/content/botany.ts`。
- `0–<25%` 显示种核、`25–<50%` 抽芽、`50–<85%` 展叶、`85–100%` 开花，实际揭示范围由持久化会话进度计算。
- 断续睡眠使用较紧凑的成熟株缩放，普通睡眠使用标准株形，安稳睡眠增加克制金色光晕；三者都没有枯死版本。
- 未解锁的温室条目不加载对应图像，避免提前泄露章节植物。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/north-star]]
- [[plans/0007-night-greenhouse-and-time-growth]]
