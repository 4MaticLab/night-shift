# 千早诺亚视觉档案

CASE 004 的 34 张运行时图像于 2026-07-24 使用 Codex 内置图像生成能力制作，并压缩为 WebP。生成时以首案和第三案现有成品作为 Night Shift 自身的媒介参考，只继承暖纸、深蓝墨线、铜绿与克制灯光，不复刻外部作品角色或构图。

## 共用提示词

> Original Night Shift literary storybook noir illustration, mature editorial gouache and dry-brush etching on aged paper, deep navy and charcoal shadows, oxidized copper patina, restrained amber lamplight, old wine-red accents, quiet rainy underground municipal city, humane asynchronous investigation, subtle print misregistration, tactile archival composition. No readable text, logo, watermark, photorealism, glossy 3D, neon cyberpunk, anime, horror gore, Orientalist costume, shrine-maiden styling, kimono cosplay, or existing franchise characters.

镜面用错位双线、局部银灰与铜绿裂纹表达；“十三”由车票、门、纸结和开放圆环反复暗示，精确数量与因果仍由 manifest 文本固定，不把生成图当作唯一数数谜题。

## 身份与文化边界

- 千早诺亚保持同一张年轻日本游学生面孔、深色 20 世纪初旅行外套、旅行箱、车票与纸结。她的文化知识来自剧情行动，不由猎奇服装代替。
- 第六条路线的诺亚沿用同一面孔基础，但以不同外套磨损、发型、工具与站姿表达独立生活。
- 终灯会的殖民式收藏错误只通过展签、库房和人物行为批判，不把伪造“东方仪式”当作主视觉奇观。
- 肖像保持成熟档案距离和完整主体性，不使用萌系、角色卡游戏或恐怖替身语言。

## 提示词组与映射

| 类别 | 数量 | 运行时目录 | 主题附加提示 |
|---|---:|---|---|
| 四幕横幅 | 4 | `public/art/cases/chihaya-noa/headers/` | 交接桌上的十三张日期冲突车票；林渡沿错位铁路夜行；清晨带回十三份证词；签名票围住熄灭镜面与零号钥匙 |
| 收藏品 | 8 | `public/art/cases/chihaya-noa/collectibles/` | 明日车票、雾港入境章、纸结线轴、无伤口裁纸刀、返照镜碎片、错译展签、零号钥匙、十三格票夹 |
| 夜印 | 5 | `public/art/cases/chihaya-noa/night-seals/` | 依次压印多次抵达、并行路线、错译镜片、十二地址与观察者、十三份决定 |
| 明信片 | 5 | `public/art/cases/chihaya-noa/postcards/` | 雾港停用站台、折返巷、拱灯镜片库、未成线公寓、十三扇清晨门 |
| 植物标本 | 5 | `public/art/cases/chihaya-noa/botany/` | 复抵草、纸结藤、返照镜兰、未成住址蕨、十三名晨花 |
| 人物肖像 | 4 | `public/art/cases/chihaya-noa/characters/` | 千早诺亚、艾瑞丝·贝尔、阿瑟·维尔、第六条路线的诺亚 |
| 城区版画 | 3 | `public/art/cases/chihaya-noa/districts/` | 雾港寄宿区、拱灯学会街、未成线；维持 3:2 城市档案版画与可读前中远景 |

资产 ID、替代文本和具体文件由 `src/content/chihaya-noa-assets.ts` 登记。全部 34 个 ID 都由 `CampaignManifest` 或通用档案页消费；生成原图留在本机 Codex 目录，仓库只提交经过检查与压缩的运行时 WebP。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/chihaya-noa-story-bible]]
- [[docs/art-prompts/global-style]]
- [[docs/art-prompts/four-act-headers]]

