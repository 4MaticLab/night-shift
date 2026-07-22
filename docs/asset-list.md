# 素材清单

| ID | 名称 | 类别 | 文件 | 状态 | 页面 |
|---|---|---|---|---|---|
| `header.night-shift.hero` | 林渡与雾灯城 | Header / Character / City | `/public/art/headers/night-shift-hero.png` | 完成 | 首页、睡前、晨报 |
| `social.night-shift.og` | 夜班侦探分享封面 | Social | `/public/og.png` | 完成 | 链接预览 |
| `map.foglight.css` | 雾灯城路线图 | CSS scene | `app/globals.css` | 完成 | 夜间、晨报 |
| `board.case-001.css` | 纸质案件板 | CSS scene | `app/globals.css` | 完成 | 案件板 |
| `collectible.torn-ticket` | 43号线残票 | Engraved object | `/public/art/collectibles/torn-ticket-v1.png` | 完成 | 晨报、收藏 |
| `collectible.matchbox` | 旧火柴盒 | Engraved object | `/public/art/collectibles/matchbox-v1.png` | 完成 | 晨报、收藏 |
| `collectible.pressed-flower` | 夜香花标本 | Engraved object | `/public/art/collectibles/pressed-flower-v1.png` | 完成 | 晨报、收藏 |
| `collectible.postcard` | 无邮票明信片 | Engraved object | `/public/art/collectibles/postcard-v1.png` | 完成 | 晨报、收藏 |
| `collectible.hotel-key` | 307黄铜钥匙 | Engraved object | `/public/art/collectibles/hotel-key-v1.png` | 完成 | 晨报、收藏 |
| `collectible.driver-badge` | 维修车员工徽章 | Engraved object | `/public/art/collectibles/driver-badge-v1.png` | 完成 | 晨报、收藏 |
| `collectible.museum-token` | 博物馆寄存牌 | Engraved object | `/public/art/collectibles/museum-token-v1.png` | 完成 | 晨报、收藏 |
| `collectible.ledger-clasp` | 账册铜制封扣 | Engraved object | `/public/art/collectibles/ledger-clasp-v1.png` | 完成 | 晨报、收藏 |
| `night-seal.01`–`05` | 五夜印记 | Engraved seal | `/public/art/night-seals/night-0*-v1.png` | 完成 | 夜间、晨报、收藏 |
| `postcard.night-01` | 灯港拒收件 | City postcard | `/public/art/postcards/night-01-lantern-wharf-v1.webp` | 完成 | 第一夜晨报、旅程册 |
| `postcard.night-02` | 寄往无人之处 | City postcard | `/public/art/postcards/night-02-flower-alley-v1.webp` | 完成 | 第二夜晨报、旅程册 |
| `postcard.night-03` | 替客人留着灯 | City postcard | `/public/art/postcards/night-03-room-307-v1.webp` | 完成 | 第三夜晨报、旅程册 |
| `postcard.night-04` | 错误分类的春天 | City postcard | `/public/art/postcards/night-04-archive-glasshouse-v1.webp` | 完成 | 第四夜晨报、旅程册 |
| `postcard.night-05` | 钟表沉默以后 | City postcard | `/public/art/postcards/night-05-hidden-platform-v1.webp` | 完成 | 第五夜晨报、旅程册 |

核心插画、八件物证、五枚夜印与五张城市明信片由内置图像生成能力生成；地图、纸张、图钉、路线和档案材质保持代码原生，以便响应式缩放与动效控制。明信片的生成约束与场景差异见 [[docs/art-prompts/city-postcards]]。全部运行时引用通过 `src/content/assets.ts` manifest 解析。

## 相关文档

- [[docs/art-direction]]
- [[docs/art-prompts/global-style]]
- [[docs/art-prompts/archive-assets]]
- [[docs/art-prompts/city-postcards]]
