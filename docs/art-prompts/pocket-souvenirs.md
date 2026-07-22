# 口袋纪念物提示词

九张资产使用内置图像生成模式从零生成。源图为 1536×1536 PNG，保留在 Codex 生成目录；运行时压缩为 1024×1024 WebP。每张图只负责表现一个小物，不承载名称、稀有度或数值。

## 通用提示词

```text
Use case: stylized-concept
Asset type: square game collectible object illustration for an original literary underground-city mystery
Scene/backdrop: warm aged archival paper, no surrounding scene
Style/medium: hand-inked copperplate etching with restrained editorial screenprint color blocks; tactile paper fibers and slight ink registration offset
Composition: one centered object, generous margin, strong silhouette readable at 120px; subtle collector-plate shadow or ink halo only
Palette: soot black, deep navy, oxidized copper teal, old burgundy, thin amber-gold accents
Mood: intimate, strange, dry municipal wit, as if found unexpectedly in a detective's coat pocket
Constraints: original fictional object; no people, hands, text, letters, numbers, labels, logos, trademarks, watermark, border, frame, extra loose objects, photorealism, 3D, glossy rendering, recognizable franchise iconography.
```

## 九件变体

- 未盖章的雨水收据：窄长折叠票据，空白圆形印章区托住一滴不会洒出的雨水，边角潮湿卷曲。
- 无主抽屉的黄铜拉手：带两枚短螺柱、拇指磨痕与铜绿凹槽的单独拉手，一端系酒红档案线。
- 错页蛾的索引翅片：由深蓝纸与薄黄铜叠成的蛾翅形索引签，带不规则空白索引齿，不画昆虫身体。
- 只有返程孔的旧车票：厚深蓝票纸，单个新月形剪孔与缺角，只有酒红线路条，不含文字。
- 认错主人的袖扣：单枚椭圆铜绿袖扣，面上是酒红指纹状珐琅旋纹，背扣微弯。
- 没有收件人的花籽邮管：微型黄铜邮管，铜绿接缝，盖子半开，一粒深色种子冒出酒红嫩芽。
- 夜线粉笔头：短粗酒红与深蓝粉笔，套薄铜绿护套，断面显出等高线，下方只有一道弯曲粉笔痕。
- 熄灯路牌的铜螺丝：厚重开槽铜螺丝，方形颈部隐约像小路牌托架，螺纹满是铜绿。
- 会朝旧轨滚动的玻璃珠：单颗烟青玻璃球，内部封存一条弯曲酒红金线旧轨，重心明显偏向一侧。

## 运行时文件

- `/public/art/souvenirs/rain-receipt-v1.webp`
- `/public/art/souvenirs/orphaned-drawer-pull-v1.webp`
- `/public/art/souvenirs/index-moth-wing-v1.webp`
- `/public/art/souvenirs/return-punch-ticket-v1.webp`
- `/public/art/souvenirs/mistaken-cufflink-v1.webp`
- `/public/art/souvenirs/seed-post-tube-v1.webp`
- `/public/art/souvenirs/night-line-chalk-v1.webp`
- `/public/art/souvenirs/afterlight-sign-screw-v1.webp`
- `/public/art/souvenirs/route-seeking-marble-v1.webp`

原始生成图保存在 `/Users/ame/.codex/generated_images/019f8b10-3fc1-70f0-9658-5babec640a95/`，文件名和运行时映射由本轮实现记录保留。运行时资产统一通过 `src/content/assets.ts` manifest 解析。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/north-star]]
- [[plans/0010-unasked-for-souvenirs-and-pocket-drawer]]
