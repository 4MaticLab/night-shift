"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Check, FileText, Flower2, KeyRound, Link2, RotateCcw, Search, TramFront } from "lucide-react";
import { Background, BackgroundVariant, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nightShiftCase } from "@/src/content/case";
import { getAsset, getNightSealAsset, getPostcardAsset } from "@/src/content/assets";
import { getPostcardPreparationNote, journeyPostcards } from "@/src/content/postcards";
import { getPreparation } from "@/src/content/preparations";
import { evidenceRelations } from "@/src/content/relations";
import { useGameStore } from "@/src/stores/game-store";
import { canUnlockTrueEnding, type EndingId } from "@/src/lib/game-engine/ending";
import { PaperCard, Seal } from "./shared";

export function CaseBoard() {
  const { unlockedClueIds, confirmedRelations, connectClues } = useGameStore();
  const [selectedClueIds, setSelectedClueIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const available = nightShiftCase.clues.filter((clue) => unlockedClueIds.includes(clue.id));
  const nodes = useMemo<Node[]>(() => available.map((clue, index) => ({
    id: clue.id,
    position: { x: 70 + (index % 4) * 240 + (index % 2) * 20, y: 70 + Math.floor(index / 4) * 180 },
    data: { label: <button type="button" aria-pressed={selectedClueIds.includes(clue.id)} className={`board-node ${clue.type} ${selectedClueIds.includes(clue.id) ? "selected" : ""}`}><span className="pin" /><small>{clue.type.toUpperCase()} · 0{clue.chapter}</small><b>{clue.title}</b><p>{clue.summary}</p></button> },
    style: { background: "transparent", border: 0, padding: 0, width: 190 },
  })), [available, selectedClueIds]);
  const edges = useMemo<Edge[]>(() => evidenceRelations.flatMap((relation, index) => {
    if (!confirmedRelations.includes(relation.id) || !relation.clueIds.every((clueId) => unlockedClueIds.includes(clueId))) return [];
    return [{ id: relation.id, source: relation.clueIds[0], target: relation.clueIds[1], animated: true, label: `推论 0${index + 1}`, style: { stroke: index === 1 ? "#a86158" : "#698d89", strokeWidth: 3 }, labelStyle: { fill: "#e7dcc5", fontSize: 9 } }];
  }), [confirmedRelations, unlockedClueIds]);

  const selectEvidence = (clueId: string) => {
    setFeedback(null);
    setSelectedClueIds((current) => {
      if (current.includes(clueId)) return current.filter((id) => id !== clueId);
      if (current.length === 2) return [clueId];
      return [...current, clueId];
    });
  };

  const submitConnection = () => {
    if (selectedClueIds.length !== 2) {
      setFeedback({ kind: "error", text: "先从案板上选中两件证物。" });
      return;
    }
    const relationId = connectClues(selectedClueIds[0], selectedClueIds[1]);
    const relation = evidenceRelations.find((item) => item.id === relationId);
    if (!relation) {
      setFeedback({ kind: "error", text: "这两件证物还不能互相作证。换一种连接。" });
      return;
    }
    setFeedback({ kind: "success", text: relation.explanation });
    setSelectedClueIds([]);
  };

  const selectedClues = selectedClueIds.map((id) => nightShiftCase.clues.find((clue) => clue.id === id)).filter(Boolean);

  return <div className="board-page"><div className="page-title"><div><p className="eyebrow">CASE BOARD · 证物关系图</p><h2>把城市说过的谎，<br />一根根连起来。</h2></div><p>从案板上选择两件证物，再尝试建立连接。只有彼此作证的事实，才能成为核心推论。</p></div><div className="board-shell">{nodes.length ? <ReactFlow nodes={nodes} edges={edges} onNodeClick={(_, node) => selectEvidence(node.id)} fitView minZoom={0.5} maxZoom={1.6} proOptions={{ hideAttribution: true }}><Background color="#988d73" gap={28} size={1} variant={BackgroundVariant.Dots} /><Controls showInteractive={false} /></ReactFlow> : <div className="board-empty"><Search /><h3>案件板还很安静</h3><p>完成第一夜调查，林渡带回的证物会出现在这里。</p></div>}<aside className="relation-panel"><small>EVIDENCE LINK · {selectedClueIds.length}/2</small><div className="evidence-selection">{selectedClues.length ? selectedClues.map((clue) => <span key={clue?.id}>{clue?.title}</span>) : <p>点击两张证物卡。再次点击可以取消。</p>}</div><button className="connect-evidence" disabled={selectedClueIds.length !== 2} onClick={submitConnection}><Link2 /> 建立证物连接</button>{feedback && <p className={`relation-feedback ${feedback.kind}`} role="status">{feedback.text}</p>}<div className="relation-ledger"><small>核心推论 · {confirmedRelations.length}/3</small>{evidenceRelations.map((relation, index) => { const confirmed = confirmedRelations.includes(relation.id); return <div className={confirmed ? "relation-entry done" : "relation-entry"} key={relation.id}><span>{confirmed ? <Check /> : `0${index + 1}`}</span><div><small>{confirmed ? "CONFIRMED" : "UNRESOLVED"}</small><b>{confirmed ? relation.statement : "未确认推论"}</b></div></div>; })}</div></aside></div></div>;
}

export function Collection() {
  const { unlockedCollectibleIds, nightSealIds, chapter, completedReports, preparationHistory } = useGameStore();
  return <div className="collection-page"><div className="page-title"><div><p className="eyebrow">NIGHT CABINET · 夜间陈列柜</p><h2>时间没有消失。<br />它留下了证物。</h2></div><p>每次等待都会形成一枚夜印；每次归来也会寄回一张城市明信片，让昨夜去过的地方成为可以翻看的旅程。</p></div><section className="journey-album"><div className="shelf-heading"><small>RETURNED POSTCARDS · {completedReports.length}/5</small><h3>雾灯城寄回的五个夜晚</h3></div><div className="journey-postcard-grid">{journeyPostcards.map((postcard) => { const unlocked = completedReports.includes(postcard.chapter); const preparationId = preparationHistory[postcard.chapter] ?? "side-lamp"; const preparation = getPreparation(preparationId); const art = getPostcardAsset(postcard.chapter); return <article className={unlocked ? "journey-postcard unlocked" : "journey-postcard locked"} key={postcard.id}><div className="journey-postcard-image">{unlocked ? <Image src={art.src} alt={art.alt} width={768} height={512} /> : <div className="postcard-locked"><KeyRound /><span>NIGHT 0{postcard.chapter}</span></div>}</div><div className="journey-postcard-copy"><small>{unlocked ? postcard.location : "ROUTE NOT RETURNED"}</small><h3>{unlocked ? postcard.title : "尚未寄回"}</h3><p>{unlocked ? postcard.message : "完成这一夜的交接，林渡会从城市里寄回一张明信片。"}</p>{unlocked && <span><b>{preparation?.shortTitle ?? "随身物"}</b>{getPostcardPreparationNote(postcard.chapter, preparationId)}</span>}</div></article>; })}</div></section><section className="night-seal-shelf"><div className="shelf-heading"><small>FIVE NIGHTS · {nightSealIds.length}/5</small><h3>五夜印记</h3></div><div className="night-seal-row">{nightShiftCase.chapters.map((entry) => { const art = getNightSealAsset(entry.number); const unlocked = nightSealIds.includes(entry.number); return <div className={unlocked ? "night-seal unlocked" : "night-seal locked"} key={entry.number}><Image src={art.src} alt={unlocked ? art.alt : "尚未形成的夜印"} width={160} height={160} /><span>夜 0{entry.number}</span><b>{unlocked ? entry.title : "尚未成形"}</b></div>; })}</div></section><div className="collection-grid">{nightShiftCase.collectibles.map((item, index) => { const unlocked = unlockedCollectibleIds.includes(item.id); const revealed = unlocked && chapter >= Math.min(5, item.chapter + 2); const art = getAsset(item.assetId); return <motion.article whileHover={unlocked ? { y: -5, rotate: index % 2 ? .3 : -.3 } : {}} key={item.id} className={`collectible-card ${unlocked ? "unlocked" : "locked"}`}><div className="item-number">0{index + 1}</div><div className="item-art"><Image src={art.src} alt={unlocked ? art.alt : "尚未发现的物品"} width={438} height={438} /></div><div className="item-meta"><small>{unlocked ? `${item.district} · ${item.rarity}` : "尚未发现"}</small><h3>{unlocked ? item.title : "未归档物品"}</h3><p>{unlocked ? (revealed ? item.revealedDescription : item.surfaceDescription) : "下一次夜间调查，也许会让它出现在林渡的口袋里。"}</p>{revealed && <Seal>隐藏含义已揭示</Seal>}</div></motion.article>; })}</div></div>;
}

export function ArchivePage() {
  const { completedReports, unlockedClueIds } = useGameStore();
  return <div className="archive-page"><div className="page-title"><div><p className="eyebrow">CASE ARCHIVE · 001</p><h2>零点四十三分<br />的末班车</h2></div><Seal>{Math.round((unlockedClueIds.length / 12) * 100)}% 已查明</Seal></div><div className="archive-folders">{nightShiftCase.chapters.map((chapter) => <PaperCard key={chapter.number} className={completedReports.includes(chapter.number) ? "folder complete" : "folder"}><span className="folder-tab">NIGHT 0{chapter.number}</span><small>{completedReports.includes(chapter.number) ? "REPORT FILED" : "SEALED"}</small><h3>{chapter.title}</h3><p>{chapter.subtitle}</p><div>{completedReports.includes(chapter.number) ? <><Check /> 调查完成</> : <><KeyRound /> 尚未开启</>}</div></PaperCard>)}</div></div>;
}

export function Ending() {
  const { unlockedClueIds, unlockedCollectibleIds, confirmedRelations, endingId, chooseEnding, reset } = useGameStore();
  const trueReady = canUnlockTrueEnding({ unlockedClueIds, unlockedCollectibleIds, confirmedRelations });
  const endings: Array<{ id: EndingId; icon: React.ReactNode; title: string; theme: string; result: string; locked?: boolean }> = [
    { id: "public", icon: <FileText />, title: "公开档案", theme: "真相属于所有人。", result: "全部证据被公开，私人收藏机构受到调查，部分资产陆续归还。伊芙琳再次消失。" },
    { id: "protect", icon: <KeyRound />, title: "保护证人", theme: "真相不应以牺牲证人为代价。", result: "证据被交给可信档案机构，伊芙琳的身份暂不公布。一张没有目的地的车票寄到了事务所。" },
    { id: "return", icon: <Flower2 />, title: "让失踪者自己决定", theme: "把证据，也把选择权交还给她。", result: "数周后，伊芙琳亲自署名的调查报告公开。林渡收到第九件藏品：一卷尚未冲洗的胶卷。", locked: !trueReady },
  ];
  const selected = endings.find((item) => item.id === endingId);
  if (selected) return <main className="ending-reveal"><div className="ending-light" /><div className="ending-tram"><TramFront /></div><Seal>{selected.id === "return" ? "TRUE ENDING" : "CASE CLOSED"}</Seal><h1>{selected.title}</h1><p className="ending-theme">{selected.theme}</p><PaperCard><p>{selected.result}</p><hr /><p>林渡最后一封信：</p><blockquote>“我们总以为破案是替一件事写下句号。后来才明白，有些真相只是把笔还给真正应该写下它的人。”</blockquote></PaperCard><h2>城市里仍有许多灯，<br />只在你睡着以后亮起。</h2><button className="ghost-button" onClick={reset}><RotateCcw /> 重新调查</button></main>;
  return <main className="ending-choice"><div className="page-title"><div><p className="eyebrow">FINAL DECISION · 05:43</p><h2>最后的决定，<br />由你写进档案。</h2></div><p>伊芙琳把账册留在站台，却没有把决定也留下。三种真相，都有各自的代价。</p></div><div className="ending-cards">{endings.map((ending) => <button key={ending.id} disabled={ending.locked} onClick={() => chooseEnding(ending.id)} className={ending.id === "return" ? "true-ending" : ""}><span>{ending.icon}</span><small>{ending.locked ? `尚需 ${12 - unlockedClueIds.length} 条线索 / ${3 - confirmedRelations.length} 条关系` : "可选择"}</small><h3>{ending.title}</h3><p>{ending.theme}</p><ArrowRight /></button>)}</div></main>;
}
