# 城市社团纹章提示词

本组资产使用内置图像生成模式从零生成，运行时统一压缩为 1024×1024 WebP。三枚纹章必须共享同一印刷媒介和椭圆构图，但依靠中心物件关系形成清楚区分；图片不承担文字信息，社团名称与称呼始终由 HTML 渲染。

## 通用提示词

```text
Use case: logo-brand
Asset type: square game UI society crest for an original literary underground-city mystery
Style/medium: hand-inked copperplate etching fused with restrained editorial screenprint blocks on visibly fibrous warm aged paper; tactile archival print, slightly imperfect registration
Composition/framing: one centered oval medallion, generous margin, clear bold silhouette readable at 140 pixels, front-facing, no surrounding scene
Color palette: soot black ink, oxidized copper teal, old burgundy, and only a very thin touch of amber gold
Mood: secret civic ritual, dry bureaucratic wit, intimate rather than grand
Constraints: original fictional design; no text, letters, numbers, monograms, labels, signatures, watermark, mockup, frame, crown, skull, heraldic shield, photorealism, 3D, glossy effects, or recognizable existing franchise iconography.
```

## 三枚变体

### 错页登记处

```text
Primary request: emblem of the Registry of Beneficial Errors.
Subject: a moth whose two wings are folded index cards, circling a dark keyhole; one loose catalog tab and a restrained burgundy correction mark form the lower balance. The symbol should suggest an archive preserving truth by misfiling it.
```

### 失物领事馆

```text
Primary request: emblem of the Consulate of Mislaid Things.
Subject: an elegant empty glove gently cradling a clipped old tram ticket and one small pressed night flower, with the ticket angled as if being returned rather than claimed. The symbol should suggest lost objects as citizens searching for their owners.
```

### 熄灯测绘社

```text
Primary request: emblem of the Cartographers After Lamplight.
Subject: an extinguished hooded streetlamp above two precise contour lines that bend into a single old tram rail; a tiny unlit wick is the focal point. The symbol should suggest routes that appear only after the official lamps go dark.
```

## 运行时文件

- `/public/art/societies/misfiled-registry-crest-v1.webp`
- `/public/art/societies/mislaid-consulate-crest-v1.webp`
- `/public/art/societies/afterlight-cartographers-crest-v1.webp`

三图通过 `src/content/assets.ts` manifest 引用。图内不加入名称、层级或数值，避免纹章缩小时出现伪文字，也让关系文案保持可访问和可本地化。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/north-star]]
- [[plans/0008-city-societies-and-remembered-favors]]
