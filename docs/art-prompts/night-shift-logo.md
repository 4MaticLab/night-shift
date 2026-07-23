# Night Shift 品牌 Logo

## 设计结构

品牌图形把弯月、旧电车前窗与中央值夜灯合为一个无文字正面轮廓：弯月表示玩家休息的时间，三格车窗指向雾灯城的旧电车，琥珀灯表示玩家睡着以后仍在继续的调查。中文“夜班侦探”和英文“NIGHT SHIFT”继续由 HTML 排版，不固化进图像。

运行时主文件为 `/public/art/brand/night-shift-logo-v1.png`，1024×1024 RGBA PNG。图形使用透明背景、Ink Black、Deep Navy、Amber 与少量 Oxidized Copper；导航以 34–42px 展示。浏览器使用 `/public/favicon.png` 的 64×64 PNG，Next.js 文件约定使用 `/app/icon.png` 的 512×512 PNG；原始 1254×1254 色键源图保存在 `/output/imagegen/night-shift-logo-source-v1.png`，不参与运行时加载。

## 最终提示词

```text
Use case: logo-brand
Asset type: primary game brand mark for navigation, favicon, and social identity
Primary request: Create one original emblem for the indie mystery game Night Shift. Fuse three ideas into one compact symbol: a crescent moon forming the upper curve of an old tram front window, two restrained vertical window divisions, and one small warm night-duty lamp glowing at the lower center. The result should suggest "the detective works while you sleep" without showing a person.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal.
Style/medium: vector-friendly editorial engraving logo mark, mostly flat shapes, crisp silhouette, subtle hand-printed ink texture only inside the emblem.
Composition/framing: single centered near-square emblem with generous padding, strong silhouette and balanced negative space, readable at 32 to 42 pixels.
Color palette: soot black and deep navy #090D18 / #0E1628, warm amber #C59A5A, a very small oxidized copper #698D89 accent. Do not use #00ff00 anywhere in the emblem.
Text: none.
Constraints: one isolated emblem only; original design; no letters, words, numbers, separate decorative border, coat of arms, shield, crown, detective hat, magnifying glass, keyhole, human figure, city skyline, stars, ticket, existing franchise iconography, watermark, mockup, or extra objects.
```

本资产通过当前 provider 的 Responses `image_generation` 工具生成；纯色背景使用本地图像工具转换为透明 alpha，并裁切为带安全边距的正方形运行时文件。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/art-prompts/global-style]]
- [[plans/0028-night-shift-logo]]
