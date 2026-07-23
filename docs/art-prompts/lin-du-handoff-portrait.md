# 林渡交接肖像提示词

这张资产用于睡前交接桌，不是人物换装或状态奖励。它以 [[docs/art-prompts/four-act-headers]] 的交接横幅为身份、服装、道具与媒介参考，补齐可在较近距离辨认的林渡主肖像。

## 最终提示词

```text
Use case: illustration-story
Asset type: 4:5 character portrait for the sleep-handoff screen of the indie mystery web game Night Shift
Input image: identity, wardrobe, props, palette, and editorial etching style reference for the recurring detective Lin Du
Primary request: create a new close, intimate archive portrait of the same detective Lin Du seated at the night-shift office desk, ready to receive tonight's instructions
Subject: preserve his recognizable face, wavy black hair, quiet observant expression, dark timeless double-breasted coat, muted blue-gray scarf, brown leather shoulder-satchel strap, dark gloves, small notebook, and brass flashlight; he looks slightly tired, intelligent, gentle, and trustworthy
Pose/composition: vertical 4:5, half body, seated three-quarter view facing slightly left toward the unseen player, one gloved hand resting beside the open notebook and the other holding the brass flashlight low; face, scarf, notebook, and flashlight must remain legible when displayed around 360 px wide; generous warm-paper margin around the silhouette
Scene/backdrop: restrained warm archive paper with only faint etched shadows of a desk edge and rain-streaked window; no full city scene, no decorative border
Style/medium: original literary storybook noir, fine editorial etching and dry-brush ink on textured paper, human and mature rather than anime or cartoon; maintain visual continuity with the supplied Night Shift reference without copying any external game
Lighting/mood: low amber desk-lamp light across one side of the face, deep navy shadows, calm before departure, intimate handoff rather than action
Color palette: ink black, deep navy, warm paper beige, oxidized copper, old wine red, minimal old gold
Constraints: no text, letters, numbers, logo, watermark, frame, UI, badge, hat, weapon, cigarette, supernatural anatomy, additional person, readable writing, or external franchise symbols; do not change his age, ethnicity, hairstyle, face, clothing language, or gentle restrained character
```

## 源图与运行时文件

- 连续性参考：`/public/art/headers/shift-handoff-v2.webp`
- 内置生成源图：`/Users/ame/.codex/generated_images/019f8b10-3fc1-70f0-9658-5babec640a95/exec-364785c7-fa2d-4ff5-bd0b-61733820cd07.png`
- 运行时资产：`/public/art/characters/lin-du-handoff-portrait-v1.webp`
- 尺寸：1122 × 1402，约 4:5；WebP 质量 92。

图像本身不包含名字、标签或边框；“林渡”“今晚交接单”和选择反馈全部由 HTML/CSS 生成，以保持清晰度、可访问性与响应式能力。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/art-prompts/four-act-headers]]
- [[plans/0018-lin-du-handoff-portrait]]
