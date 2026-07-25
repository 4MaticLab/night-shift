import { BannerSheet } from "@/src/components/banners/banner-sheet";
import { BannerToolbar } from "@/src/components/banners/banner-toolbar";
import { bannerSeries } from "@/src/content/banners";

export default function BannersPage() {
  return (
    <main className="banner-site">
      <header className="banner-site-intro">
        <div>
          <small>BOOTH PRINT KIT · ROLL-UP 800 × 2000 MM</small>
          <h1>展台易拉宝预览</h1>
          <p>五款卷帘易拉宝，为黑客松会场设计：命题、异步循环、五案广度、重新创造休息的主张，以及给评委的三个差异点。文字全部由排版承担，图片只用已过审美术资产。点击单款可放大预览，截图或导出 PDF 即可送印。</p>
        </div>
        <aside><b>800 × 2000 mm</b><span>比例 2:5 · 底部 200 mm 卷入低可读区</span></aside>
      </header>

      <BannerToolbar />

      <div className="banner-print-stack">
        {bannerSeries.map((banner) => (
          <section key={banner.id}>
            <div className="banner-preview-caption">
              <span>{banner.zone.toUpperCase()}</span>
            </div>
            <BannerSheet banner={banner} />
          </section>
        ))}
      </div>

      <p className="banner-print-hint">导出建议：截图请把浏览器缩放保持 100%、单款独立预览页可让易拉宝铺满视口，再对画面区域截图；导出 PDF 时选择自定义纸张 800 × 2000 mm、边距“无”、缩放 100% 并开启“背景图形”。</p>
    </main>
  );
}
