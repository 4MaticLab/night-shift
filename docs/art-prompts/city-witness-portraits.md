# 城市见证人肖像提示词

四张资产使用内置图像生成模式从零生成，均为 4:5 人物档案肖像。运行时统一压缩为 1024×1280 WebP；肖像只负责给固定人物一个可辨认的目光、轮廓与职业道具，不生成新证词，也不模仿任何现成游戏角色。

## 通用提示词

```text
Use case: stylized-concept
Asset type: 4:5 game character dossier portrait for an original literary underground-city mystery
Scene/backdrop: plain warm aged archival paper with only a faint soot-and-copper ink halo, no room or scenery
Style/medium: hand-inked copperplate editorial portrait with restrained screenprint color blocks, visible paper fibers, fine etched hatching, slight registration offset
Composition/framing: centered three-quarter bust from mid-torso upward, front or subtle three-quarter view, generous margin around head and shoulders, strong silhouette readable at 160px, dignified dossier plate
Lighting/mood: soft amber side light against soot shadow; intimate, guarded, humane, quietly strange
Color palette: soot black, deep navy, warm paper, oxidized copper teal, old burgundy, very thin amber-gold accents
Materials/textures: worn wool, aged brass, ink, paper, practical lived-in clothing
Constraints: one person only; original fictional character; natural anatomy and hands; no readable text, letters, numbers, labels, logos, trademarks, watermark, border, frame, heraldry, fantasy species, skulls, photorealism, glossy 3D, anime, cartoon, recognizable franchise iconography, or imitation of any existing game character.
```

## 人物变体

- 米娜·索莱尔：四十岁出头，头发别起，目光疲惫而戒备；工作衬衣与围裙，衣襟别一小枝花，指尖带花粉，手持空白明信片。
- 吉迪恩·韦尔：六十岁出头，银灰短须，旧司机外套；帽子压在胸前，另一只手握黄铜票钳，姿态谦逊但不退让。
- 奥林·贝尔：五十岁中段，灰发后移，圆眼镜；墨渍马甲、松开的铜绿色领带，谨慎托着一卷旧地图。
- 伊芙琳·奎尔：三十岁后段，雨水打湿的短发，直视观者；深蓝旅行外套、旧酒红围巾，手持折叠相机，冷静且有自主性。

## 源图与运行时文件

| 人物 | 源图 | 运行时文件 |
|---|---|---|
| 米娜·索莱尔 | `/Users/ame/.codex/generated_images/019f8b10-3fc1-70f0-9658-5babec640a95/exec-fa87b191-1011-4328-9602-eada17424624.png` | `/public/art/characters/mina-solair-portrait-v1.webp` |
| 吉迪恩·韦尔 | `/Users/ame/.codex/generated_images/019f8b10-3fc1-70f0-9658-5babec640a95/exec-1a299e08-6801-4ee9-a08d-67522e192dcc.png` | `/public/art/characters/gideon-vale-portrait-v1.webp` |
| 奥林·贝尔 | `/Users/ame/.codex/generated_images/019f8b10-3fc1-70f0-9658-5babec640a95/exec-6a44d0cb-c13c-48d4-b1a6-97fdec9f08ec.png` | `/public/art/characters/orin-bell-portrait-v1.webp` |
| 伊芙琳·奎尔 | `/Users/ame/.codex/generated_images/019f8b10-3fc1-70f0-9658-5babec640a95/exec-35e1e5f7-be5f-4ed7-b0fe-e2d3401b4c1d.png` | `/public/art/characters/evelyn-quell-portrait-v1.webp` |

全部运行时引用通过 `src/content/assets.ts` manifest 解析。人物文本由 `src/content/characters.ts` 绑定到 [[docs/story-bible]] 的固定事实。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/story-bible]]
- [[plans/0012-city-witness-portraits-and-person-dossiers]]
