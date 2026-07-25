"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Copy, Gift, Printer, Sparkles } from "lucide-react";
import { readSharedKeepsakeQuery, removeSharedKeepsakeQuery } from "@/src/lib/game-engine/keepsake-sharing";
import { useKeepsakeStore, type ReceiveKeepsakeResult } from "@/src/stores/keepsake-store";

export interface KeepsakeCard {
  id: string;
  name: string;
  archiveName: string;
  provenance: string;
  fieldNote: string;
  cityRumor: string;
  art: string;
  alt: string;
  shareUrl: string;
  qr: string;
}

interface Banner {
  result: ReceiveKeepsakeResult;
  name?: string;
}

/**
 * Runs the mount-time receive from a scanned `?keepsake=` link. Kept as a child
 * that reports back through a callback prop so the intake side effect stays out
 * of the presentational component (mirrors SharedClueIntake).
 */
function KeepsakeIntake({ hydrated, onResult }: { hydrated: boolean; onResult: (banner: Banner) => void }) {
  const receive = useKeepsakeStore((state) => state.receive);
  useEffect(() => {
    if (!hydrated) return;
    const parsed = readSharedKeepsakeQuery(window.location.search);
    if (!parsed.present) return;
    if (parsed.keepsake) {
      onResult({ result: receive(parsed.keepsake.id), name: parsed.keepsake.name });
    } else {
      onResult({ result: "invalid" });
    }
    window.history.replaceState(null, "", removeSharedKeepsakeQuery(window.location.href));
  }, [hydrated, receive, onResult]);
  return null;
}

export function KeepsakeExchange({ cards }: { cards: KeepsakeCard[] }) {
  const receivedIds = useKeepsakeStore((state) => state.receivedIds);
  const hydrated = useKeepsakeStore((state) => state.hydrated);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyShare = async (card: KeepsakeCard) => {
    try {
      await navigator.clipboard.writeText(card.shareUrl);
      setCopied(card.id);
      window.setTimeout(() => setCopied((current) => (current === card.id ? null : current)), 1600);
    } catch {
      /* clipboard denied — the QR and visible link still work */
    }
  };

  const bannerText = (banner: Banner): string => {
    if (banner.result === "invalid") return "这枚纪念品链接无法识别。";
    if (banner.result === "already-received") return `你已经收藏过「${banner.name}」。`;
    return `已把「${banner.name}」收进你的本地收藏。`;
  };

  const receivedCount = hydrated ? receivedIds.length : 0;

  return (
    <main className="keepsake-site">
      <KeepsakeIntake hydrated={hydrated} onResult={setBanner} />
      <header className="keepsake-intro">
        <div>
          <small>KEEPSAKE EXCHANGE · 扫码收藏</small>
          <h1>雾灯城纪念品交换</h1>
          <p>
            每件纪念品都带一枚二维码。把它分享给朋友，对方在这里扫码后，纪念品就会落进他自己的本地收藏。链接里只有这枚纪念品，不带账号、进度或任何评分。
          </p>
        </div>
        <aside>
          <b><Gift size={15} /> {receivedCount} / {cards.length}</b>
          <span>本机已收藏的纪念品</span>
          <button type="button" className="keepsake-print" onClick={() => window.print()}>
            <Printer size={13} /> 打印分享海报
          </button>
        </aside>
      </header>

      {banner && (
        <div className={`keepsake-banner keepsake-banner-${banner.result}`} role="status">
          <Sparkles size={15} />
          <p>{bannerText(banner)}</p>
        </div>
      )}

      <div className="keepsake-grid">
        {cards.map((card) => {
          const owned = hydrated && receivedIds.includes(card.id);
          return (
            <article key={card.id} className={owned ? "keepsake-card owned" : "keepsake-card"}>
              <div className="keepsake-art">
                <Image src={card.art} alt={card.alt} fill sizes="(max-width: 720px) 100vw, 360px" />
                {owned && <span className="keepsake-owned-badge"><Check size={11} /> 已收藏</span>}
              </div>
              <div className="keepsake-body">
                <small>{card.archiveName}</small>
                <h2>{card.name}</h2>
                <p className="keepsake-provenance">{card.provenance}</p>
                <p className="keepsake-note">“{card.fieldNote}”</p>
                <p className="keepsake-rumor">{card.cityRumor}</p>
              </div>
              <div className="keepsake-share">
                <Image className="keepsake-qr" src={card.qr} alt={`${card.name} 的二维码`} width={112} height={112} unoptimized />
                <div className="keepsake-share-actions">
                  <small>分享这枚纪念品</small>
                  <code>{card.shareUrl}</code>
                  <button type="button" onClick={() => copyShare(card)}>
                    {copied === card.id ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制链接</>}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="keepsake-hint">
        小提示：打印本页即可分发实体纪念品海报，每张都自带一枚可扫码收藏的二维码。
      </p>
    </main>
  );
}
