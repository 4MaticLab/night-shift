"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Check, FileText, Flower2, KeyRound, Link2, RotateCcw, Search } from "lucide-react";
import { Background, BackgroundVariant, Controls, Handle, Position, ReactFlow, useNodesState, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nightShiftCase } from "@/src/content/case";
import { getAsset, getNightSealAsset, getPostcardAsset } from "@/src/content/assets";
import { getPostcardPreparationNote, journeyPostcards } from "@/src/content/postcards";
import { getPreparation } from "@/src/content/preparations";
import { getRouteDirection } from "@/src/content/routes";
import { nightBotanicals } from "@/src/content/botany";
import { citySocieties, getSocietyTitle } from "@/src/content/societies";
import { correspondencePostures, getCorrespondencePrompt, getCorrespondenceReply, getDominantCorrespondenceStance } from "@/src/content/correspondence";
import { souvenirs } from "@/src/content/souvenirs";
import { getOpportunityNotice, getOpportunityResponse } from "@/src/content/opportunities";
import { caseCharacters, isCharacterRevealed } from "@/src/content/characters";
import { cityDistricts } from "@/src/content/districts";
import { endingEpilogues } from "@/src/content/endings";
import { DEMO_CITY_WATCH_ID, getCityWatch, getCityWatchEcho } from "@/src/content/watches";
import { evidenceRelations } from "@/src/content/relations";
import { useGameStore } from "@/src/stores/game-store";
import { canUnlockTrueEnding, type EndingId } from "@/src/lib/game-engine/ending";
import { formatSleepDuration } from "@/src/lib/game-engine/sleep-session";
import type { Clue, CorrespondenceRecord, SocietyMemoryRecord } from "@/src/lib/game-engine/schema";
import { BotanicalSpecimen, PaperCard, qualityCopy, Seal, SocietyCrest } from "./shared";

type EvidenceNode = Node<{ clue: Clue; selected: boolean; focused: boolean; onSelect: (clueId: string) => void }, "evidence">;

function EvidenceNodeCard({ data }: NodeProps<EvidenceNode>) {
  const { clue, selected, focused, onSelect } = data;
  return <div className="board-node-wrap"><Handle className="board-connection-handle" type="target" position={Position.Left} isConnectable={false} /><span className="board-node-drag-handle" title="拖动整理证物"><span className="pin" /></span><div role="button" tabIndex={0} aria-pressed={selected} onClick={() => onSelect(clue.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(clue.id); } }} className={`board-node ${clue.type} ${selected ? "selected" : ""} ${focused ? "focused" : ""}`}><small>{clue.type.toUpperCase()} · 0{clue.chapter}</small><b>{clue.title}</b><p>{clue.summary}</p></div><Handle className="board-connection-handle" type="source" position={Position.Right} isConnectable={false} /></div>;
}

const evidenceNodeTypes = { evidence: EvidenceNodeCard };

function defaultBoardPosition(index: number) {
  return { x: 70 + (index % 4) * 240 + (index % 2) * 20, y: 70 + Math.floor(index / 4) * 180 };
}

export function CaseBoard() {
  const { unlockedClueIds, confirmedRelations, boardPositions, connectClues, setBoardPosition, resetBoardPositions } = useGameStore();
  const [selectedClueIds, setSelectedClueIds] = useState<string[]>([]);
  const [focusedClueId, setFocusedClueId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const available = nightShiftCase.clues.filter((clue) => unlockedClueIds.includes(clue.id));

  const selectEvidence = useCallback((clueId: string) => {
    setFocusedClueId(clueId);
    setFeedback(null);
    setSelectedClueIds((current) => {
      if (current.includes(clueId)) return current.filter((id) => id !== clueId);
      if (current.length === 2) return [clueId];
      return [...current, clueId];
    });
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<EvidenceNode>(available.map((clue, index) => ({
    id: clue.id,
    type: "evidence",
    position: boardPositions[clue.id] ?? defaultBoardPosition(index),
    data: { clue, selected: false, focused: false, onSelect: selectEvidence },
    dragHandle: ".board-node-drag-handle",
    style: { background: "transparent", border: 0, padding: 0, width: 190 },
  })));

  useEffect(() => {
    setNodes((current) => current.map((node) => ({ ...node, data: { ...node.data, selected: selectedClueIds.includes(node.id), focused: focusedClueId === node.id, onSelect: selectEvidence } })));
  }, [focusedClueId, selectEvidence, selectedClueIds, setNodes]);
  const edges = useMemo<Edge[]>(() => evidenceRelations.flatMap((relation, index) => {
    if (!confirmedRelations.includes(relation.id) || !relation.clueIds.every((clueId) => unlockedClueIds.includes(clueId))) return [];
    return [{ id: relation.id, source: relation.clueIds[0], target: relation.clueIds[1], animated: true, label: `推论 0${index + 1}`, style: { stroke: index === 1 ? "#a86158" : "#698d89", strokeWidth: 3 }, labelStyle: { fill: "#e7dcc5", fontSize: 9 } }];
  }), [confirmedRelations, unlockedClueIds]);

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

  const restoreBoardLayout = () => {
    resetBoardPositions();
    setNodes((current) => current.map((node, index) => ({ ...node, position: defaultBoardPosition(index) })));
  };

  const selectedClues = selectedClueIds.map((id) => nightShiftCase.clues.find((clue) => clue.id === id)).filter(Boolean);
  const focusedClue = available.find((clue) => clue.id === focusedClueId);
  const focusedRelations = focusedClue ? evidenceRelations.filter((relation) => confirmedRelations.includes(relation.id) && relation.clueIds.includes(focusedClue.id)) : [];

  return <div className="board-page">
    <div className="page-title"><div><p className="eyebrow">CASE BOARD · 证物关系图</p><h2>把城市说过的谎，<br />一根根连起来。</h2></div><p>点击阅档并选择证物，拖动留下你的桌面。只有彼此作证的事实，才能成为核心推论。</p></div>
    <div className="board-workspace">
      <div className="board-shell">{nodes.length ? <ReactFlow nodes={nodes} edges={edges} nodeTypes={evidenceNodeTypes} onNodesChange={onNodesChange} onNodeDragStop={(_, node) => setBoardPosition(node.id, node.position)} fitView minZoom={0.5} maxZoom={1.6} proOptions={{ hideAttribution: true }}><Background color="#988d73" gap={28} size={1} variant={BackgroundVariant.Dots} /><Controls showInteractive={false} /></ReactFlow> : <div className="board-empty"><Search /><h3>案件板还很安静</h3><p>完成第一夜调查，林渡带回的证物会出现在这里。</p></div>}</div>
      <aside className="relation-panel" aria-label="证物档案与关系">
        <div className="board-panel-heading"><small>OPEN DOSSIER · {focusedClue ? `NIGHT 0${focusedClue.chapter}` : "NO FILE"}</small><button type="button" onClick={restoreBoardLayout}><RotateCcw /> 恢复摆放</button></div>
        {focusedClue ? <article className="clue-dossier" aria-live="polite"><span>{focusedClue.type}</span><h3>{focusedClue.title}</h3><p>{focusedClue.detail}</p><blockquote><small>城市异议</small>“{focusedClue.cityObjection}”</blockquote><div><small>林渡 · 页边批注</small>{focusedClue.marginNote}</div>{focusedRelations.length > 0 && <footer><small>这份证物已经参与作证</small>{focusedRelations.map((relation) => <b key={relation.id}><Link2 /> {relation.statement}</b>)}</footer>}</article> : <div className="clue-dossier empty"><FileText /><p>点击一张证物，展开完整记录。它也会进入下方的连接槽。</p></div>}
        <div className="evidence-link-heading"><small>EVIDENCE LINK · {selectedClueIds.length}/2</small><span>再次点击可取消</span></div>
        <div className="evidence-selection">{selectedClues.length ? selectedClues.map((clue) => <span key={clue?.id}>{clue?.title}</span>) : <p>选择两张证物，让它们互相作证。</p>}</div>
        <button className="connect-evidence" disabled={selectedClueIds.length !== 2} onClick={submitConnection}><Link2 /> 建立证物连接</button>
        {feedback && <p className={`relation-feedback ${feedback.kind}`} role="status">{feedback.text}</p>}
        <div className="relation-ledger"><small>核心推论 · {confirmedRelations.length}/3</small>{evidenceRelations.map((relation, index) => { const confirmed = confirmedRelations.includes(relation.id); return <div className={confirmed ? "relation-entry done" : "relation-entry"} key={relation.id}><span>{confirmed ? <Check /> : `0${index + 1}`}</span><div><small>{confirmed ? "CONFIRMED" : "UNRESOLVED"}</small><b>{confirmed ? relation.statement : "未确认推论"}</b></div></div>; })}</div>
      </aside>
    </div>
  </div>;
}

export function Collection() {
  const { unlockedCollectibleIds, nightSealIds, chapter, completedReports, preparationHistory, choiceHistory, growthHistory, societyHistory, correspondenceHistory, souvenirHistory, opportunityHistory } = useGameStore();
  const societyRecords = Object.values(societyHistory).filter((record): record is SocietyMemoryRecord => Boolean(record)).sort((a, b) => a.chapter - b.chapter);
  const correspondenceRecords = Object.values(correspondenceHistory).filter((record): record is CorrespondenceRecord => Boolean(record));
  return <div className="collection-page">
    <div className="page-title"><div><p className="eyebrow">NIGHT CABINET · 夜间陈列柜</p><h2>时间没有消失。<br />城市也没有忘记。</h2></div><p>每次等待都会形成一枚夜印、长成一株植物、寄回一张明信片，也让某个地下社团记住你的做事方式。这里保存的不是分数，是五段可以重新讲述的时间。</p></div>
    <section className="city-favor-ledger">
      <div className="shelf-heading"><small>CITY REMEMBERS · {societyRecords.length}/5 NIGHTS</small><h3>城市人情簿</h3></div>
      <p className="society-ledger-intro">没有声望点数，也没有最优路线。城市只会依照你反复选择的调查姿态，更换称呼、礼数和愿意交给你的旁话。</p>
      <div className="society-ledger-grid">{citySocieties.map((society) => { const records = societyRecords.filter((record) => record.societyId === society.id); const latest = records.at(-1); return <article className={latest ? `society-ledger-card touched standing-${latest.standing}` : "society-ledger-card"} key={society.id}><SocietyCrest societyId={society.id} compact /><div className="society-ledger-copy"><small>{society.archiveName}</small><h3>{society.name}</h3><p className="society-concern">关心 · {society.concern}</p><blockquote>“{society.publicRumor}”</blockquote><div className="society-current-address"><small>城里目前怎样称呼你</small><b>{latest ? getSocietyTitle(latest) : "尚未被正式称呼"}</b></div><p className="society-rule">内部规矩 · {society.privateRule}</p></div><div className="society-trace">{records.length ? records.map((record) => { const direction = getRouteDirection(record.chapter, record.choiceId); const replyRecord = correspondenceHistory[record.chapter]; return <div key={record.chapter}><span>夜 0{record.chapter}</span><b>{direction.dispatchTitle}</b><small>{replyRecord ? "已回信" : "未回信"}</small></div>; }) : <p>尚无一条已归来的路线惊动他们。</p>}</div></article>; })}</div>
      {societyRecords.length > 0 && <div className="correspondence-ledger"><div className="correspondence-ledger-heading"><small>RETURNED ANSWERS · {correspondenceRecords.length}/{societyRecords.length}</small><h4>问函与答复履历</h4><p>没有寄出的答复也会保留为空白，不影响任何案件成果。</p></div><div className="correspondence-ledger-grid">{societyRecords.map((memory) => { const society = citySocieties.find((item) => item.id === memory.societyId)!; const prompt = getCorrespondencePrompt(memory); const record = correspondenceHistory[memory.chapter]; const reply = record ? getCorrespondenceReply(record) : null; return <article className={reply ? "correspondence-ledger-entry answered" : "correspondence-ledger-entry"} key={memory.chapter}><small>夜 0{memory.chapter} · {society.name}</small><h5>{prompt.question}</h5>{reply ? <><div><small>你的答复</small><b>{reply.label}</b><p>{reply.summary}</p></div><blockquote><small>留下的余波</small>{reply.echo}</blockquote></> : <div className="unanswered"><small>未寄出的信封</small><b>这一夜没有答复</b><p>故事照常继续，城市没有替你的沉默扣除任何东西。</p></div>}</article>; })}</div></div>}
    </section>
    <section className="pocket-drawer">
      <div className="shelf-heading"><small>UNASKED-FOR SOUVENIRS · {Object.keys(souvenirHistory).length}/5 NIGHTS</small><h3>口袋抽屉</h3></div>
      <p className="pocket-drawer-intro">方向与随身物会让林渡经过不同的城市角落，但没有兑换表，也不能靠刷新重抽。五夜里出现的每件小物都只是一段旁证，不会替案件增加优势。</p>
      <div className="pocket-drawer-grid">{souvenirs.map((souvenir) => { const record = Object.values(souvenirHistory).find((entry) => entry?.souvenirId === souvenir.id); const art = getAsset(souvenir.assetId); const direction = record ? getRouteDirection(record.chapter, record.choiceId) : null; const preparation = record ? getPreparation(record.preparationId) : null; return <article className={record ? "pocket-object unlocked" : "pocket-object locked"} key={souvenir.id}><div className="pocket-object-art">{record ? <Image src={art.src} alt={art.alt} width={1024} height={1024} /> : <div><KeyRound /><span>DRAWER CLOSED</span></div>}</div><div className="pocket-object-copy"><small>{record ? `夜 0${record.chapter} · ${souvenir.archiveName}` : "尚未出现在口袋里"}</small><h4>{record ? souvenir.name : "未归档小物"}</h4><p>{record ? souvenir.provenance : "城市还没有决定把什么留给这一格抽屉。"}</p>{record && <blockquote>“{souvenir.fieldNote}”</blockquote>}{record && <footer><b>{direction?.dispatchTitle}</b><span>{preparation?.shortTitle} · {direction?.destination}</span></footer>}</div></article>; })}</div>
    </section>
    <section className="city-clipping-book">
      <div className="shelf-heading"><small>DAYLIGHT NOTICES · {Object.keys(opportunityHistory).length}/4 DAYS</small><h3>城市剪报册</h3></div>
      <p>收起的纸也会留在那一天，但不会替你补写选择。这里没有行动点、分数或最优答复。</p>
      <div>{[2, 3, 4, 5].map((day) => { const record = opportunityHistory[day]; const notice = record?.noticeId ? getOpportunityNotice(record.noticeId) : null; const response = record ? getOpportunityResponse(record) : null; return <article className={record ? "filed" : ""} key={day}><small>DAY 0{day} · {record ? "FILED" : "NOT YET"}</small><h4>{record ? (notice?.title ?? "三张纸没有拆开") : "门缝仍然空着"}</h4><p>{record ? (response?.result ?? "你把三张纸全部收进抽屉。没有人因此失去什么，城市也没有替沉默补写答案。") : "完成前一夜后，城市会递来三张可以回应、也可以收起的纸。"}</p>{response && <blockquote><small>后来传回</small>“{response.echo}”</blockquote>}</article>; })}</div>
    </section>
    <section className="city-watch-ledger"><div className="shelf-heading"><small>WHEN THE CITY RECEIVED THE SHIFT · {Object.keys(growthHistory).length}/5</small><h3>城市值更簿</h3></div><p>这里保存你在什么时辰把任务交给林渡。它只改变当时仍在街上的人和城市愿意露出的侧面，不改变任何案件成果。</p><div>{nightShiftCase.chapters.map((entry) => { const record = growthHistory[entry.number]; if (!record) return <article className="watch-ledger-entry locked" key={entry.number}><small>NIGHT 0{entry.number} · UNFILED</small><h4>时辰尚未归档</h4><p>完成这一夜后，交接时刻会留下一段城市侧影。</p></article>; const watch = getCityWatch(record.watchId ?? DEMO_CITY_WATCH_ID); const echo = getCityWatchEcho(entry.number, watch.id); const direction = getRouteDirection(entry.number, record.choiceId); return <article className={`watch-ledger-entry watch-${watch.id}`} key={entry.number}><small>NIGHT 0{entry.number} · {watch.archiveLabel}</small><h4>{watch.label}</h4><span>{watch.window} · {direction.destination}</span><blockquote>“{echo.fieldNote}”</blockquote></article>; })}</div></section>
    <section className="night-greenhouse">
      <div className="shelf-heading"><small>FOGLIGHT GREENHOUSE · {Object.keys(growthHistory).length}/5</small><h3>雾灯温室</h3></div>
      <p className="greenhouse-intro">提前醒来不会让任何植物枯死。它只会以更小、更奇异的形态，完整保存那一夜。</p>
      <div className="greenhouse-grid">{nightBotanicals.map((botanical) => { const record = growthHistory[botanical.chapter]; const direction = record ? getRouteDirection(botanical.chapter, record.choiceId) : null; const preparation = record ? getPreparation(record.preparationId) : null; const watch = record ? getCityWatch(record.watchId ?? DEMO_CITY_WATCH_ID) : null; return <article className={record ? `greenhouse-specimen unlocked quality-${record.quality}` : "greenhouse-specimen locked"} key={botanical.id}>{record ? <BotanicalSpecimen chapter={botanical.chapter} compact /> : <div className="greenhouse-locked"><KeyRound /><span>NIGHT 0{botanical.chapter}</span></div>}<div className="greenhouse-copy"><small>{record ? `${watch?.label} · ${qualityCopy[record.quality].label} · ${formatSleepDuration(record.durationMinutes)}` : "SEED DORMANT"}</small><h3>{record ? botanical.name : "种核尚未苏醒"}</h3><p>{record ? botanical.specimenNote : "完成这一夜，无论睡了多久，温室都会保存一株完整植物。"}</p>{record && <span><b>{direction?.dispatchTitle}</b>{preparation?.shortTitle} · {botanical.district}</span>}</div></article>; })}</div>
    </section>
    <section className="journey-album"><div className="shelf-heading"><small>RETURNED POSTCARDS · {completedReports.length}/5</small><h3>雾灯城寄回的五个夜晚</h3></div><div className="journey-postcard-grid">{journeyPostcards.map((postcard) => { const unlocked = completedReports.includes(postcard.chapter); const preparationId = preparationHistory[postcard.chapter] ?? "side-lamp"; const preparation = getPreparation(preparationId); const direction = getRouteDirection(postcard.chapter, choiceHistory[postcard.chapter] ?? ""); const art = getPostcardAsset(postcard.chapter); return <article className={unlocked ? "journey-postcard unlocked" : "journey-postcard locked"} key={postcard.id}><div className="journey-postcard-image">{unlocked ? <Image src={art.src} alt={art.alt} width={768} height={512} /> : <div className="postcard-locked"><KeyRound /><span>NIGHT 0{postcard.chapter}</span></div>}</div><div className="journey-postcard-copy"><small>{unlocked ? postcard.location : "ROUTE NOT RETURNED"}</small><h3>{unlocked ? postcard.title : "尚未寄回"}</h3><p>{unlocked ? postcard.message : "完成这一夜的交接，林渡会从城市里寄回一张明信片。"}</p>{unlocked && <div className="journey-route-history"><small>CHOSEN ROUTE</small><b>{direction.dispatchTitle} · {direction.destination}</b><p>{direction.returnLetter}</p></div>}{unlocked && <span><b>{preparation?.shortTitle ?? "随身物"}</b>{getPostcardPreparationNote(postcard.chapter, preparationId)}</span>}</div></article>; })}</div></section>
    <section className="night-seal-shelf"><div className="shelf-heading"><small>FIVE NIGHTS · {nightSealIds.length}/5</small><h3>五夜印记</h3></div><div className="night-seal-row">{nightShiftCase.chapters.map((entry) => { const art = getNightSealAsset(entry.number); const unlocked = nightSealIds.includes(entry.number); return <div className={unlocked ? "night-seal unlocked" : "night-seal locked"} key={entry.number}><Image src={art.src} alt={unlocked ? art.alt : "尚未形成的夜印"} width={160} height={160} /><span>夜 0{entry.number}</span><b>{unlocked ? entry.title : "尚未成形"}</b></div>; })}</div></section>
    <div className="collection-grid">{nightShiftCase.collectibles.map((item, index) => { const unlocked = unlockedCollectibleIds.includes(item.id); const revealed = unlocked && chapter >= Math.min(5, item.chapter + 2); const art = getAsset(item.assetId); return <motion.article whileHover={unlocked ? { y: -5, rotate: index % 2 ? .3 : -.3 } : {}} key={item.id} className={`collectible-card ${unlocked ? "unlocked" : "locked"}`}><div className="item-number">0{index + 1}</div><div className="item-art"><Image src={art.src} alt={unlocked ? art.alt : "尚未发现的物品"} width={438} height={438} /></div><div className="item-meta"><small>{unlocked ? `${item.district} · ${item.rarity}` : "尚未发现"}</small><h3>{unlocked ? item.title : "未归档物品"}</h3><p>{unlocked ? (revealed ? item.revealedDescription : item.surfaceDescription) : "下一次夜间调查，也许会让它出现在林渡的口袋里。"}</p>{revealed && <Seal>隐藏含义已揭示</Seal>}</div></motion.article>; })}</div>
  </div>;
}

export function ArchivePage() {
  const { completedReports, unlockedClueIds } = useGameStore();
  return <div className="archive-page"><div className="page-title"><div><p className="eyebrow">CASE ARCHIVE · 001</p><h2>零点四十三分<br />的末班车</h2></div><Seal>{Math.round((unlockedClueIds.length / 12) * 100)}% 已查明</Seal></div><div className="archive-folders">{nightShiftCase.chapters.map((chapter) => <PaperCard key={chapter.number} className={completedReports.includes(chapter.number) ? "folder complete" : "folder"}><span className="folder-tab">NIGHT 0{chapter.number}</span><small>{completedReports.includes(chapter.number) ? "REPORT FILED" : "SEALED"}</small><h3>{chapter.title}</h3><p>{chapter.subtitle}</p><div>{completedReports.includes(chapter.number) ? <><Check /> 调查完成</> : <><KeyRound /> 尚未开启</>}</div></PaperCard>)}</div><section className="district-atlas"><div className="shelf-heading"><small>FOGLIGHT ATLAS · {cityDistricts.filter((district) => completedReports.includes(district.introducedChapter)).length}/3 DISTRICTS</small><h3>雾灯城分区志</h3></div><p>地图记录道路，城区却靠规矩辨认。林渡真正走过一块地方以后，档案才允许它获得名字。</p><div>{cityDistricts.map((district) => { const unlocked = completedReports.includes(district.introducedChapter); const art = getAsset(district.assetId); return <article className={unlocked ? "district-entry unlocked" : "district-entry locked"} key={district.id}><div className="district-art">{unlocked ? <Image src={art.src} alt={art.alt} width={1200} height={800} /> : <div><KeyRound /><span>DISTRICT UNVISITED</span></div>}</div><div className="district-copy"><small>{unlocked ? district.archiveName : "DISTRICT FILE · SEALED"}</small><h4>{unlocked ? district.name : "城区尚未归档"}</h4><b>{unlocked ? district.subtitle : `完成第 ${district.introducedChapter} 夜后展开`}</b>{unlocked && <><p><span>公共说法</span>{district.publicVersion}</p><blockquote><span>城里实际遵守</span>{district.cityRule}</blockquote><footer>{district.landmarks.map((landmark) => <i key={landmark}>{landmark}</i>)}</footer></>}</div></article>; })}</div></section><section className="person-dossiers"><div className="shelf-heading"><small>PERSONS OF INTEREST · {caseCharacters.filter((character) => completedReports.includes(character.encounterChapter)).length}/4</small><h3>相关人物</h3></div><p>城市传闻不等于证词。只有已经带回的线索，才能让档案展开第二层。</p><div>{caseCharacters.map((character) => { const encountered = completedReports.includes(character.encounterChapter); const revealed = encountered && isCharacterRevealed(character, unlockedClueIds); const art = getAsset(character.assetId); return <article className={encountered ? "person-dossier encountered" : "person-dossier locked"} key={character.id}><div className="person-portrait">{encountered ? <Image src={art.src} alt={art.alt} width={1024} height={1280} /> : <div><KeyRound /><span>PERSON SEALED</span></div>}</div><div className="person-dossier-copy"><small>{encountered ? character.archiveName : `PERSON 0${character.encounterChapter} · SEALED`}</small><h4>{encountered ? character.name : "尚未见面"}</h4><b>{encountered ? `${character.role} · ${character.district}` : "完成对应夜班后归档"}</b><p>{encountered ? `“${character.publicRumor}”` : "这份档案还没有获得姓名。"}</p>{encountered && <div><small>已知事实</small>{character.knownFact}</div>}{revealed && <blockquote><small>保留意见已展开</small>{character.withheld}</blockquote>}{encountered && !revealed && <span><KeyRound /> 仍有部分说法需要现有证物互相作证</span>}</div></article>; })}</div></section></div>;
}

export function Ending() {
  const { unlockedClueIds, unlockedCollectibleIds, confirmedRelations, correspondenceHistory, completedReports, preparationHistory, choiceHistory, growthHistory, souvenirHistory, endingId, chooseEnding, reset } = useGameStore();
  const [reviewingArchive, setReviewingArchive] = useState(false);
  const trueReady = canUnlockTrueEnding({ unlockedClueIds, unlockedCollectibleIds, confirmedRelations });
  const dominantStance = getDominantCorrespondenceStance(correspondenceHistory);
  const cityAfterword = dominantStance ? correspondencePostures[dominantStance] : { title: "未寄出的答复", note: "你没有让任何社团替你固定立场。雾灯城把那些空信封也归了档：沉默不是失败，只是一种尚未交出的决定。" };
  const icons: Record<EndingId, React.ReactNode> = { public: <FileText />, protect: <KeyRound />, return: <Flower2 /> };
  const selected = endingEpilogues.find((item) => item.id === endingId);
  const endingArt = getAsset("ending.hidden-platform");
  const journeyNights = [...completedReports].sort((a, b) => a - b).flatMap((chapterNumber) => {
    const chapter = nightShiftCase.chapters.find((item) => item.number === chapterNumber);
    const postcard = journeyPostcards.find((item) => item.chapter === chapterNumber);
    const botanical = nightBotanicals.find((item) => item.chapter === chapterNumber);
    if (!chapter || !postcard || !botanical) return [];
    const direction = getRouteDirection(chapterNumber, choiceHistory[chapterNumber] ?? "");
    const preparation = getPreparation(preparationHistory[chapterNumber] ?? "side-lamp");
    const growth = growthHistory[chapterNumber];
    const souvenirRecord = souvenirHistory[chapterNumber];
    const souvenir = souvenirRecord ? souvenirs.find((item) => item.id === souvenirRecord.souvenirId) : undefined;
    return [{ chapter, postcard, botanical, direction, preparation, growth, souvenir }];
  });
  const recoveredEvidence = nightShiftCase.collectibles.filter((item) => unlockedCollectibleIds.includes(item.id));

  if (selected && reviewingArchive) return <main className="ending-archive-review"><header><button type="button" onClick={() => setReviewingArchive(false)}><ArrowLeft /> 回到结案页</button><span>CASE REMAINS CLOSED · 档案只读</span></header><ArchivePage /></main>;

  if (selected) return <main className="ending-reveal">
    <Image className="ending-background" src={endingArt.src} alt={endingArt.alt} fill priority sizes="100vw" /><div className="ending-light" />
    <Seal>{selected.archiveLabel}</Seal><h1>{selected.title}</h1><p className="ending-theme">{selected.theme}</p>
    <PaperCard className="ending-letter"><small>FINAL LETTER · 林渡终函</small><p>{selected.result}</p><hr /><blockquote>“{selected.detectiveLetter}”</blockquote><div className="city-afterword"><small>CITY POSTSCRIPT · 与结局资格无关</small><b>{cityAfterword.title}</b><p>{cityAfterword.note}</p></div></PaperCard>
    <section className="case-closing-ledger"><div className="ending-section-heading"><small>FIVE NIGHTS RETURNED · {journeyNights.length}/5</small><h2>五夜归来总账</h2><p>这里不计算分数。它只保存你交给林渡的方向、时间长成的植物，以及城市擅自塞进他口袋的小东西。</p></div><div className="ending-night-grid">{journeyNights.map(({ chapter, postcard, botanical, direction, preparation, growth, souvenir }) => { const postcardArt = getPostcardAsset(chapter.number); const sealArt = getNightSealAsset(chapter.number); const watch = growth ? getCityWatch(growth.watchId ?? DEMO_CITY_WATCH_ID) : null; return <article className="ending-night-entry" key={chapter.number}><div className="ending-night-art"><Image src={postcardArt.src} alt={postcardArt.alt} fill sizes="(max-width: 600px) 100vw, 220px" /><Image className="ending-night-seal" src={sealArt.src} alt={sealArt.alt} width={74} height={74} /></div><div><small>NIGHT 0{chapter.number} · {postcard.location}</small><h3>{chapter.title}</h3><p>{direction.dispatchTitle} · {direction.destination}</p><dl><div><dt>随身</dt><dd>{preparation?.shortTitle ?? "未记录"}</dd></div><div><dt>时间长成</dt><dd>{botanical.name}</dd></div><div><dt>口袋带回</dt><dd>{souvenir?.name ?? "这一夜只带回了雨"}</dd></div><div><dt>夜班留痕</dt><dd>{growth ? `${watch?.label ?? "夜半时分"} · ${qualityCopy[growth.quality].label} · ${formatSleepDuration(growth.durationMinutes)}` : "已归档"}</dd></div></dl></div></article>; })}</div></section>
    <section className="ending-evidence-ledger"><div className="ending-section-heading"><small>RECOVERED EVIDENCE · {recoveredEvidence.length}/8</small><h2>带回事务所的核心物证</h2><p>只陈列这个存档真正找到的东西。没有补齐的格子不会在结案时替你伪造。</p></div><div>{recoveredEvidence.map((item) => { const art = getAsset(item.assetId); return <article className="ending-evidence-item" key={item.id}><Image src={art.src} alt={art.alt} width={160} height={160} /><span><small>{item.district}</small><b>{item.title}</b><p>{item.revealedDescription}</p></span></article>; })}</div></section>
    <h2 className="ending-closing-line">{selected.closingLine}</h2><p className="ending-refrain">城市里仍有许多灯，只在你睡着以后亮起。</p>
    <div className="ending-actions"><button type="button" onClick={() => setReviewingArchive(true)}><BookOpen /> 重看档案</button><button type="button" disabled><KeyRound /> 下一宗案件 · 即将开放</button><button type="button" onClick={reset}><RotateCcw /> 重新调查</button></div>
  </main>;

  return <main className="ending-choice"><Image className="ending-background" src={endingArt.src} alt={endingArt.alt} fill priority sizes="100vw" /><div className="page-title"><div><p className="eyebrow">FINAL DECISION · 05:43</p><h2>最后的决定，<br />由你写进档案。</h2></div><p>伊芙琳把账册留在站台，却没有把决定也留下。三种真相，都有各自的代价。</p></div><div className="ending-cards">{endingEpilogues.map((ending) => { const locked = ending.id === "return" && !trueReady; return <button key={ending.id} disabled={locked} onClick={() => chooseEnding(ending.id)} className={ending.id === "return" ? "true-ending" : ""}><span>{icons[ending.id]}</span><small>{locked ? `尚需 ${12 - unlockedClueIds.length} 条线索 / ${3 - confirmedRelations.length} 条关系` : "可选择"}</small><h3>{ending.title}</h3><p>{ending.theme}</p><ArrowRight /></button>; })}</div></main>;
}
