"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, Download, NotebookPen, Trash2 } from "lucide-react";
import { CIPHER_NOTEBOOK_MAX_LENGTH, useCipherNotebookStore } from "@/src/stores/cipher-notebook-store";
import { useI18n } from "@/src/i18n/provider";

export function CipherNotebook() {
  const { campaign, locale } = useI18n();
  const { notes, hydrated, setNote, clearNote } = useCipherNotebookStore();
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const note = notes[campaign.id] ?? "";

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const update = (value: string) => {
    setNote(campaign.id, value);
    setSaved(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSaved(false), 1400);
  };

  const copy = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      download();
    }
  };

  const download = () => {
    if (!note) return;
    const blob = new Blob([note], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `night-shift-${campaign.id}-cipher-notes.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const confirmDelete = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    clearNote(campaign.id);
    setConfirmClear(false);
  };

  return <section className="cipher-notebook" aria-labelledby="cipher-notebook-title">
    <header><NotebookPen /><div><small>LOCAL SCRATCHPAD · {campaign.presentation.archiveNumber}</small><h4 id="cipher-notebook-title">{locale === "en" ? "Case cipher notebook" : "案件密文笔记本"}</h4></div><span>{saved ? <><Check /> {locale === "en" ? "Saved locally" : "已保存到本机"}</> : hydrated ? (locale === "en" ? "Local only" : "仅保存在本机") : (locale === "en" ? "Loading…" : "读取中…")}</span></header>
    <p>{locale === "en" ? "Write substitutions, candidate words, or eliminated routes. These notes are never treated as answers or evidence." : "记录换算、候选词和排除路线。这里的文字不会被当作答案、证物或评分。"}</p>
    <label><span className="sr-only">{locale === "en" ? "Cipher notes" : "密文草稿"}</span><textarea disabled={!hydrated} value={note} maxLength={CIPHER_NOTEBOOK_MAX_LENGTH} onChange={(event) => update(event.target.value)} placeholder={locale === "en" ? "Example: 13=M; sort stamps from earliest to latest…" : "例如：13=M；时钟印章按最早到最晚排列……"} /></label>
    <footer><span>{note.length}/{CIPHER_NOTEBOOK_MAX_LENGTH}</span><div><button type="button" disabled={!note} onClick={copy}><Clipboard /> {copied ? (locale === "en" ? "Copied" : "已复制") : (locale === "en" ? "Copy" : "复制")}</button><button type="button" disabled={!note} onClick={download}><Download /> {locale === "en" ? "Export" : "导出"}</button><button type="button" className={confirmClear ? "danger" : ""} disabled={!note} onClick={confirmDelete}><Trash2 /> {confirmClear ? (locale === "en" ? "Confirm clear" : "确认清空") : (locale === "en" ? "Clear" : "清空")}</button></div></footer>
    <small>{locale === "en" ? "Stored separately in this browser. Never sent to AI, friends, wallets, or the case engine." : "草稿使用独立浏览器存档，不会发送给 AI、好友、钱包或案件引擎。"}</small>
  </section>;
}
