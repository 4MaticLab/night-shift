# 城市明信片提示词

五张归来明信片使用内置图像生成能力逐张生成，再以 WebP 质量 88 保存为 1536×1024 的 3:2 资产。它们不是现实照片，也不复刻任何现成游戏或插画家的专有风格。

## 共同提示词

> Original literary storybook noir city postcard illustration, editorial etching and woodcut print on warm aged paper, deep navy and charcoal ink, restrained amber lamplight and oxidized copper accents, fine cross-hatching, rain and fog, tactile imperfect registration, cinematic wide 3:2 composition, a mysterious underground tram city with architecture behaving like a character. No readable text, letters, logos, watermark, UI, border, existing characters, or trademarked imagery.

## 五夜场景差异

1. 灯港封闭维修站：雨中的半开铁门、被否认的旧电车、仍在发亮的湿轨。
2. 花店后巷邮槽：合拢的夜香花、排队的空白信封、墙内吞信的铜管。
3. 无名旅馆 307：无人床铺、干净水池、窗外横过河桥的维修电车。
4. 档案馆地下温室：抽屉、被刮掉的地图、铜绿轨道与破败玻璃温室。
5. 00:43 隐藏站台：多座停止的钟、琥珀信号灯、正驶入隧道站台的末班车。

## 运行时规则

- 画面只承担地点、气氛与城市人格；固定案件事实来自 `src/content/postcards.ts`。
- 三种随身物差异通过明信片背面附言表达，不为同一地点生成十五张近似图。
- 未解锁的旅程册条目不加载对应图像，避免提前泄露地点。
- 资产版本变化时保留语义化文件名并同步更新 [[docs/asset-list]]。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/north-star]]
- [[plans/0005-city-postcards-and-return-ritual]]
