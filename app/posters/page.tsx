import Link from "next/link";
import { PosterSheet } from "@/src/components/posters/poster-sheet";
import { PosterToolbar } from "@/src/components/posters/poster-toolbar";
import { posterSeries } from "@/src/content/posters";

export default function PostersPage() {
  return (
    <main className="poster-site">
      <header className="poster-site-intro">
        <div>
          <small>HACKATHON PRINT KIT · FIVE-DAY REVEAL</small>
          <h1>五夜案件碎片海报</h1>
          <p>每天公开一个悬念层：案件启封、夜班侦探、城市人物、被删除的路线与最后决定。点击日期可单独预览；打印本页将生成恰好五张 A3 竖版页面。</p>
        </div>
        <aside><b>200 份现场分发</b><span>建议每款 40 份 · A3 母版 / A4 等比缩印</span></aside>
      </header>
      <PosterToolbar />
      <div className="poster-print-stack">
        {posterSeries.map((poster) => (
          <section key={poster.day}>
            <div className="poster-preview-caption"><span>DAY {String(poster.day).padStart(2, "0")} / PRINT PREVIEW</span><Link href={`/posters/${poster.day}`}>打开独立预览 →</Link></div>
            <PosterSheet poster={poster} previewPath={`/posters/${poster.day}`} />
          </section>
        ))}
      </div>
      <p className="poster-print-hint">打印建议：Chrome / Edge → A3 → 边距“无”→ 缩放 100% → 开启“背景图形”。缩印 A4 时选择“适合可打印区域”，不要单独裁切二维码。</p>
      <div className="poster-next-kit">
        <div>
          <small>BOOTH PRINT KIT · ROLL-UP 800 × 2000 MM</small>
          <b>展台易拉宝预览</b>
          <span>五款黑客松易拉宝：命题、异步循环、五案广度、重新创造休息与评委差异点，可放大预览、截图或导出 PDF 送印。</span>
        </div>
        <Link href="/banners">打开易拉宝预览 →</Link>
      </div>
    </main>
  );
}
