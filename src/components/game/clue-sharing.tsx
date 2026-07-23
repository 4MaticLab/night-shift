"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Check, Copy, QrCode, Send, X } from "lucide-react";
import type { Clue } from "@/src/lib/game-engine/schema";
import { createClueShareUrl } from "@/src/lib/game-engine/clue-sharing";

export interface ClueGiftNoticeData {
  kind: "success" | "info" | "error";
  title: string;
  message: string;
}

export function ClueShareDialog({ clue, onClose }: { clue: Clue; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const shareUrl = typeof window === "undefined" ? "" : createClueShareUrl(`${window.location.origin}${window.location.pathname}`, clue.id);

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then(({ toDataURL }) => toDataURL(shareUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#172235", light: "#eadfc7" },
    })).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    }).catch(() => {
      if (!cancelled) setQrDataUrl("");
    });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, shareUrl]);

  const copyLink = async () => {
    const fallbackCopy = () => {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      if (!copied) throw new Error("Copy failed");
    };
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          fallbackCopy();
        }
      } else {
        fallbackCopy();
      }
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return <motion.div className="clue-share-scrim" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section className="clue-share-dialog" role="dialog" aria-modal="true" aria-labelledby="clue-share-title" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}>
      <button className="clue-share-close" type="button" aria-label="关闭线索分享" onClick={onClose}><X /></button>
      <div className="clue-share-copy">
        <small>SEND A CLUE · 好友线索</small>
        <h2 id="clue-share-title">把「{clue.title}」<br />送进好友的案件板。</h2>
        <p>好友扫码或打开链接后，这张证物会进入对方的本地存档。不会附带你的夜班进度、选择或其他线索。</p>
        <div className="clue-share-evidence"><span>{clue.type.toUpperCase()} · NIGHT 0{clue.chapter}</span><b>{clue.title}</b><p>{clue.summary}</p></div>
      </div>
      <div className="clue-share-qr">
        {qrDataUrl ? <Image src={qrDataUrl} alt={`分享线索「${clue.title}」的二维码`} width={360} height={360} unoptimized /> : <div className="clue-share-qr-loading"><QrCode /><span>正在折叠线索路径…</span></div>}
        <small>扫码接收 · 不需要登录</small>
      </div>
      <div className="clue-share-link">
        <label htmlFor="clue-share-url">好友线索链接</label>
        <input id="clue-share-url" readOnly value={shareUrl} />
        <button type="button" disabled={!shareUrl} onClick={copyLink}>{copyState === "copied" ? <Check /> : <Copy />}{copyState === "copied" ? "链接已复制" : "复制链接"}</button>
        {copyState === "error" && <p role="status">浏览器没有允许自动复制，请长按上方链接复制。</p>}
      </div>
      <footer><Send /> 这是一封只装一张证物的信。好友仍要自己完成联合推理。</footer>
    </motion.section>
  </motion.div>;
}

export function ClueGiftNotice({ notice, onClose }: { notice: ClueGiftNoticeData; onClose: () => void }) {
  return <motion.aside className={`clue-gift-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"} initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
    <span>{notice.kind === "success" ? <Send /> : <QrCode />}</span>
    <div><small>FRIEND CLUE · 好友线索</small><b>{notice.title}</b><p>{notice.message}</p></div>
    <button type="button" aria-label="关闭好友线索提示" onClick={onClose}><X /></button>
  </motion.aside>;
}
