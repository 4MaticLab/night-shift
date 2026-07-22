"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Check, FileText, Flower2, KeyRound, RotateCcw, Search, TramFront } from "lucide-react";
import { Background, BackgroundVariant, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nightShiftCase } from "@/src/content/case";
import { getAsset, getNightSealAsset } from "@/src/content/assets";
import { useGameStore } from "@/src/stores/game-store";
import { PaperCard, Seal } from "./shared";

export function CaseBoard() {
  const { unlockedClueIds, confirmedRelations, confirmRelation } = useGameStore();
  const available = nightShiftCase.clues.filter((clue) => unlockedClueIds.includes(clue.id));
  const nodes = useMemo<Node[]>(() => available.map((clue, index) => ({
    id: clue.id,
    position: { x: 70 + (index % 4) * 240 + (index % 2) * 20, y: 70 + Math.floor(index / 4) * 180 },
    data: { label: <div className={`board-node ${clue.type}`}><span className="pin" /><small>{clue.type.toUpperCase()} · 0{clue.chapter}</small><b>{clue.title}</b><p>{clue.summary}</p></div> },
    style: { background: "transparent", border: 0, padding: 0, width: 190 },
  })), [available]);
  const edges = useMemo<Edge[]>(() => available.slice(1).map((clue, i) => ({ id: `e-${i}`, source: available[i].id, target: clue.id, animated: i === available.length - 2, style: { stroke: i % 3 === 0 ? "#a86158" : "#698d89", strokeWidth: 2 } })), [available]);
  const relations = [
    ["line-institution", "43号线", "私人收藏机构"], ["mina-evelyn", "米娜", "伊芙琳仍然活着"], ["gideon-escape", "吉迪恩", "主动协助逃离"],
  ];
  return <div className="board-page"><div className="page-title"><div><p className="eyebrow">CASE BOARD · 证物关系图</p><h2>把城市说过的谎，<br />一根根连起来。</h2></div><p>拖动证物整理桌面。确认三条核心关系，才能把最后的选择交还给伊芙琳。</p></div><div className="board-shell">{nodes.length ? <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.5} maxZoom={1.6} proOptions={{ hideAttribution: true }}><Background color="#988d73" gap={28} size={1} variant={BackgroundVariant.Dots} /><Controls showInteractive={false} /></ReactFlow> : <div className="board-empty"><Search /><h3>案件板还很安静</h3><p>完成第一夜调查，林渡带回的证物会出现在这里。</p></div>}<aside className="relation-panel"><small>关键推论 · {confirmedRelations.length}/3</small>{relations.map(([id, from, to]) => <button key={id} className={confirmedRelations.includes(id) ? "done" : ""} onClick={() => unlockedClueIds.length >= 5 && confirmRelation(id)}><span>{confirmedRelations.includes(id) ? <Check /> : <i />}</span><b>{from}</b><ArrowRight /><b>{to}</b></button>)}</aside></div></div>;
}

export function Collection() {
  const { unlockedCollectibleIds, nightSealIds, chapter } = useGameStore();
  return <div className="collection-page"><div className="page-title"><div><p className="eyebrow">NIGHT CABINET · 夜间陈列柜</p><h2>时间没有消失。<br />它留下了证物。</h2></div><p>每次等待都会形成一枚夜印；每件旧物也会在故事推进后显露第二层含义。</p></div><section className="night-seal-shelf"><div className="shelf-heading"><small>FIVE NIGHTS · {nightSealIds.length}/5</small><h3>五夜印记</h3></div><div className="night-seal-row">{nightShiftCase.chapters.map((entry) => { const art = getNightSealAsset(entry.number); const unlocked = nightSealIds.includes(entry.number); return <div className={unlocked ? "night-seal unlocked" : "night-seal locked"} key={entry.number}><Image src={art.src} alt={unlocked ? art.alt : "尚未形成的夜印"} width={160} height={160} /><span>夜 0{entry.number}</span><b>{unlocked ? entry.title : "尚未成形"}</b></div>; })}</div></section><div className="collection-grid">{nightShiftCase.collectibles.map((item, index) => { const unlocked = unlockedCollectibleIds.includes(item.id); const revealed = unlocked && chapter >= Math.min(5, item.chapter + 2); const art = getAsset(item.assetId); return <motion.article whileHover={unlocked ? { y: -5, rotate: index % 2 ? .3 : -.3 } : {}} key={item.id} className={`collectible-card ${unlocked ? "unlocked" : "locked"}`}><div className="item-number">0{index + 1}</div><div className="item-art"><Image src={art.src} alt={unlocked ? art.alt : "尚未发现的物品"} width={438} height={438} /></div><div className="item-meta"><small>{unlocked ? `${item.district} · ${item.rarity}` : "尚未发现"}</small><h3>{unlocked ? item.title : "未归档物品"}</h3><p>{unlocked ? (revealed ? item.revealedDescription : item.surfaceDescription) : "下一次夜间调查，也许会让它出现在林渡的口袋里。"}</p>{revealed && <Seal>隐藏含义已揭示</Seal>}</div></motion.article>; })}</div></div>;
}

export function ArchivePage() {
  const { completedReports, unlockedClueIds } = useGameStore();
  return <div className="archive-page"><div className="page-title"><div><p className="eyebrow">CASE ARCHIVE · 001</p><h2>零点四十三分<br />的末班车</h2></div><Seal>{Math.round((unlockedClueIds.length / 12) * 100)}% 已查明</Seal></div><div className="archive-folders">{nightShiftCase.chapters.map((chapter) => <PaperCard key={chapter.number} className={completedReports.includes(chapter.number) ? "folder complete" : "folder"}><span className="folder-tab">NIGHT 0{chapter.number}</span><small>{completedReports.includes(chapter.number) ? "REPORT FILED" : "SEALED"}</small><h3>{chapter.title}</h3><p>{chapter.subtitle}</p><div>{completedReports.includes(chapter.number) ? <><Check /> 调查完成</> : <><KeyRound /> 尚未开启</>}</div></PaperCard>)}</div></div>;
}

export function Ending() {
  const { unlockedClueIds, unlockedCollectibleIds, confirmedRelations, endingId, chooseEnding, reset } = useGameStore();
  const trueReady = unlockedClueIds.length === 12 && unlockedCollectibleIds.length >= 7 && confirmedRelations.length >= 3;
  const endings = [
    { id: "public", icon: <FileText />, title: "公开档案", theme: "真相属于所有人。", result: "全部证据被公开，私人收藏机构受到调查，部分资产陆续归还。伊芙琳再次消失。" },
    { id: "protect", icon: <KeyRound />, title: "保护证人", theme: "真相不应以牺牲证人为代价。", result: "证据被交给可信档案机构，伊芙琳的身份暂不公布。一张没有目的地的车票寄到了事务所。" },
    { id: "return", icon: <Flower2 />, title: "让失踪者自己决定", theme: "把证据，也把选择权交还给她。", result: "数周后，伊芙琳亲自署名的调查报告公开。林渡收到第九件藏品：一卷尚未冲洗的胶卷。", locked: !trueReady },
  ];
  const selected = endings.find((item) => item.id === endingId);
  if (selected) return <main className="ending-reveal"><div className="ending-light" /><div className="ending-tram"><TramFront /></div><Seal>{selected.id === "return" ? "TRUE ENDING" : "CASE CLOSED"}</Seal><h1>{selected.title}</h1><p className="ending-theme">{selected.theme}</p><PaperCard><p>{selected.result}</p><hr /><p>林渡最后一封信：</p><blockquote>“我们总以为破案是替一件事写下句号。后来才明白，有些真相只是把笔还给真正应该写下它的人。”</blockquote></PaperCard><h2>城市里仍有许多灯，<br />只在你睡着以后亮起。</h2><button className="ghost-button" onClick={reset}><RotateCcw /> 重新调查</button></main>;
  return <main className="ending-choice"><div className="page-title"><div><p className="eyebrow">FINAL DECISION · 05:43</p><h2>最后的决定，<br />由你写进档案。</h2></div><p>伊芙琳把账册留在站台，却没有把决定也留下。三种真相，都有各自的代价。</p></div><div className="ending-cards">{endings.map((ending) => <button key={ending.id} disabled={ending.locked} onClick={() => chooseEnding(ending.id)} className={ending.id === "return" ? "true-ending" : ""}><span>{ending.icon}</span><small>{ending.locked ? `尚需 ${12 - unlockedClueIds.length} 条线索 / ${3 - confirmedRelations.length} 条关系` : "可选择"}</small><h3>{ending.title}</h3><p>{ending.theme}</p><ArrowRight /></button>)}</div></main>;
}
