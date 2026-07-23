# 《潮汐不肯归档》首批资产提示词

本批次由内置图像生成能力创建，源风格锚点为 Night Shift 自有的交接横幅、灯港区版画、伊芙琳档案肖像与零点四十三分花标本。全部提示词要求原创人物、建筑、符号与构图，不出现可读文字、Logo、水印、现成作品角色、怪物、触手或照片质感。

## 全局媒介

统一描述为：文学性地下都市的编辑版画／绘本黑色电影；深墨蓝、雨蓝、旧黄铜、克制琥珀灯光和少量盐晶海绿；层叠雾气与纸张颗粒；氛围是耐心调查与温暖异步等待，而非动作奇观。

## 主视觉

- 资产：`sandbox.tide.hero`
- 路径：`/public/art/sandbox/tide-refused/hero-v1.webp`
- 画幅：2:1
- 最终场景提示：午夜低潮中显露的原创河下区，夜渡船驶向半淹排屋，七条红色屋顶路线通向远处黑铜泄洪闸；前景为返程票与盐边档案夹；左上保留深色标题区，主体置于中央 80%。

## 地点版画

- `sandbox.tide.location.floodgate` → `/public/art/sandbox/tide-refused/location-floodgate-v1.webp`：3:2，第七泄洪闸的黑铜闸齿、维修步道、逆向潮位尺、低潮灯与卡在静止齿轮间的日志；重点是“市政机械藏着人为决定”。
- `sandbox.tide.location.salt-archive` → `/public/art/sandbox/tide-refused/location-salt-archive-v1.webp`：3:2，黄铜框悬挂结晶盐页，工作桌放盐档手套、深蓝灯与自行拼合的门牌碎片；呼气化作盐雪，不出现可读街名。
- `sandbox.tide.location.low-tide-records` → `/public/art/sandbox/tide-refused/location-low-tide-records-v1.webp`：3:2，浅水中的错位书架、空白城市母图、红色粉线卷与中央工程总账；市政房间像被精确折进河床下方。

## 人物肖像

- `sandbox.tide.character.ferryman` → `/public/art/sandbox/tide-refused/character-ferryman-v1.webp`：4:5，五十余岁的东亚夜渡船工乔河，湿深蓝外套、黄铜剪票钳、船篙、暖色渡灯；表情是愧疚与固执照料。
- `sandbox.tide.character.engineer` → `/public/art/sandbox/tide-refused/character-engineer-v1.webp`：4:5，七十余岁的东亚退休工程师顾山，银发、工程外套、旧总账和闸门钥匙；背景为静止齿轮与水表，强调迟来的作证。
- `sandbox.tide.character.archivist` → `/public/art/sandbox/tide-refused/character-archivist-v1.webp`：4:5，四十余岁的东亚盐档守页人阎珞，深蓝档案员外套、盐档手套与黄铜框结晶档案页；抽象街网不可读，神情从戒备转向信任。

## 输出处理

生成结果逐张检查主体、手部、道具、文字污染和风格连续性；原始 PNG 以 `cwebp -q 88` 转为 WebP 后接入 `src/content/assets.ts`。入口、地图和人物档案在无图片时仍有完整 HTML/CSS 信息层，插画不承担唯一线索。

## 相关文档

- [[docs/art-direction]]
- [[docs/asset-list]]
- [[docs/tide-refused-story-bible]]
- [[docs/art-prompts/global-style]]
