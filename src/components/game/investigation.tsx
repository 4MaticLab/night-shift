"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, FileCheck2, FileText, Flower2, KeyRound, Link2, QrCode, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { Background, BackgroundVariant, Controls, Handle, Position, ReactFlow, useNodesState, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getAsset } from "@/src/content/assets";
import { getPreparation } from "@/src/content/preparations";
import { citySocieties, getSocietyTitle } from "@/src/content/societies";
import { correspondencePostures, getCorrespondencePrompt, getCorrespondenceReply, getDominantCorrespondenceStance } from "@/src/content/correspondence";
import { souvenirs } from "@/src/content/souvenirs";
import { getOpportunityNotice, getOpportunityResponse } from "@/src/content/opportunities";
import { isCharacterRevealed } from "@/src/content/characters";
import { DEMO_CITY_WATCH_ID, getCityWatch } from "@/src/content/watches";
import { getCampaignNightSealAssetId, getCampaignRouteDirection, getCampaignWakeEchoById, getCampaignWatchEcho } from "@/src/content/campaigns/types";
import { useGameStore } from "@/src/stores/game-store";
import { canUnlockTrueEnding, type EndingId } from "@/src/lib/game-engine/ending";
import { formatSleepDuration } from "@/src/lib/game-engine/sleep-session";
import type { Clue, Collectible, CorrespondenceRecord, SocietyMemoryRecord } from "@/src/lib/game-engine/schema";
import { BotanicalSpecimen, PaperCard, qualityCopy, Seal, SocietyCrest } from "./shared";
import { ClueShareDialog } from "./clue-sharing";
import { useI18n } from "@/src/i18n/provider";
import { CipherDesk } from "./cipher-desk";
import { InjectiveMintDialog } from "./injective-mint";
import { readMintReceipts } from "@/src/lib/injective/client";
import { deriveEvidenceBoardHints } from "@/src/lib/game-engine/evidence-board";
import { ClueDossierDialog, RelationRevealDialog } from "./evidence-letters";

type EvidenceNode = Node<{
  clue: Clue;
  selected: boolean;
  selectionIndex: number | null;
  focused: boolean;
  received: boolean;
  checkable: boolean;
  compatible: boolean;
  onSelect: (clueId: string) => void;
  onOpenDossier: (clueId: string) => void;
}, "evidence">;

function EvidenceNodeCard({ data }: NodeProps<EvidenceNode>) {
  const { t } = useI18n();
  const { clue, selected, selectionIndex, focused, received, checkable, compatible, onSelect, onOpenDossier } = data;
  return <div className="board-node-wrap">
    <Handle className="board-connection-handle" type="target" position={Position.Left} isConnectable={false} />
    <span className="board-node-drag-handle" title={t("拖动图钉整理证物")}><span className="pin" /></span>
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${clue.type.toUpperCase()} · 0${clue.chapter} ${clue.title}`}
      onClick={() => onSelect(clue.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(clue.id);
        }
      }}
      className={`board-node ${clue.type} ${checkable ? "checkable" : ""} ${compatible ? "compatible" : ""} ${selected ? "selected" : ""} ${focused ? "focused" : ""} ${received ? "received" : ""}`}
    >
      {selectionIndex !== null && <><span className="evidence-slot-mark" aria-hidden="true">{selectionIndex === 0 ? "A" : "B"}</span><span className="sr-only">{t("已选证物")} {selectionIndex === 0 ? "A" : "B"}</span></>}
      {received && <span className="friend-clue-mark">{t("好友送达")}</span>}
      <small>{clue.type.toUpperCase()} · 0{clue.chapter}</small>
      <b>{clue.title}</b>
      <p>{clue.summary}</p>
      {!selected && checkable && <><span className="sr-only">{compatible ? t("当前关系候选") : t("存在未结关系")}</span><span className={`evidence-relation-cue ${compatible ? "compatible" : ""}`} aria-hidden="true"><i /><i /><i /></span></>}
    </div>
    <button
      type="button"
      className="board-node-dossier"
      aria-label={`${t("打开证物档案")}：${clue.title}`}
      title={t("打开证物档案")}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onOpenDossier(clue.id);
      }}
    >
      <BookOpen aria-hidden="true" />
    </button>
    <Handle className="board-connection-handle" type="source" position={Position.Right} isConnectable={false} />
  </div>;
}

const evidenceNodeTypes = { evidence: EvidenceNodeCard };

function defaultBoardPosition(index: number) {
  return { x: 70 + (index % 4) * 240 + (index % 2) * 20, y: 70 + Math.floor(index / 4) * 180 };
}

export function CaseBoard() {
  const { unlockedClueIds, receivedClueIds, confirmedRelations, boardPositions, connectClues, setBoardPosition, resetBoardPositions } = useGameStore();
  const { campaign, locale, t } = useI18n();
  const [selectedClueIds, setSelectedClueIds] = useState<string[]>([]);
  const [focusedClueId, setFocusedClueId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isCompactBoard, setIsCompactBoard] = useState(false);
  const [sharedClue, setSharedClue] = useState<Clue | null>(null);
  const [dossierClueId, setDossierClueId] = useState<string | null>(null);
  const [revealedRelationId, setRevealedRelationId] = useState<string | null>(null);
  const available = useMemo(() => campaign.case.clues.filter((clue) => unlockedClueIds.includes(clue.id)), [campaign.case.clues, unlockedClueIds]);
  const boardHints = useMemo(() => deriveEvidenceBoardHints({
    relations: campaign.relations,
    unlockedClueIds,
    confirmedRelationIds: confirmedRelations,
    selectedClueIds,
  }), [campaign.relations, confirmedRelations, selectedClueIds, unlockedClueIds]);
  const checkableClueIds = useMemo(() => new Set(boardHints.checkableClueIds), [boardHints.checkableClueIds]);
  const compatibleClueIds = useMemo(() => new Set(boardHints.compatibleClueIds), [boardHints.compatibleClueIds]);

  const selectEvidence = useCallback((clueId: string) => {
    setFocusedClueId(clueId);
    if (selectedClueIds.includes(clueId)) {
      setFeedback(null);
      setSelectedClueIds(selectedClueIds.filter((id) => id !== clueId));
      return;
    }
    if (selectedClueIds.length === 2) {
      setFeedback({ kind: "error", text: t("证物槽已经放满。先移除 A 或 B，再换入另一件证物。") });
      return;
    }
    setFeedback(null);
    setSelectedClueIds([...selectedClueIds, clueId]);
  }, [selectedClueIds, t]);

  const openDossier = useCallback((clueId: string) => {
    setFocusedClueId(clueId);
    setDossierClueId(clueId);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 600px), (max-width: 1024px) and (orientation: portrait)",
    );
    const syncBoardMode = () => setIsCompactBoard(mediaQuery.matches);
    syncBoardMode();
    mediaQuery.addEventListener("change", syncBoardMode);
    return () => mediaQuery.removeEventListener("change", syncBoardMode);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<EvidenceNode>(available.map((clue, index) => ({
    id: clue.id,
    type: "evidence",
    position: boardPositions[clue.id] ?? defaultBoardPosition(index),
    data: {
      clue,
      selected: false,
      selectionIndex: null,
      focused: false,
      received: receivedClueIds.includes(clue.id),
      checkable: checkableClueIds.has(clue.id),
      compatible: false,
      onSelect: selectEvidence,
      onOpenDossier: openDossier,
    },
    dragHandle: ".board-node-drag-handle",
    style: { background: "transparent", border: 0, padding: 0, width: 190 },
  })));

  useEffect(() => {
    setNodes((current) => current.map((node) => {
      const selectionIndex = selectedClueIds.indexOf(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          selected: selectionIndex !== -1,
          selectionIndex: selectionIndex === -1 ? null : selectionIndex,
          focused: focusedClueId === node.id,
          received: receivedClueIds.includes(node.id),
          checkable: checkableClueIds.has(node.id),
          compatible: compatibleClueIds.has(node.id),
          onSelect: selectEvidence,
          onOpenDossier: openDossier,
        },
      };
    }));
  }, [checkableClueIds, compatibleClueIds, focusedClueId, openDossier, receivedClueIds, selectEvidence, selectedClueIds, setNodes]);
  const edges: Edge[] = campaign.relations.flatMap((relation, index) => {
    if (!confirmedRelations.includes(relation.id) || !relation.clueIds.every((clueId) => unlockedClueIds.includes(clueId))) return [];
    return [{ id: relation.id, source: relation.clueIds[0], target: relation.clueIds[1], animated: true, label: `${t("推论")} 0${index + 1}`, style: { stroke: index === 1 ? "#a86158" : "#698d89", strokeWidth: 3 }, labelStyle: { fill: "#e7dcc5", fontSize: 9 } }];
  });

  const submitConnection = () => {
    if (selectedClueIds.length !== 2) {
      setFeedback({ kind: "error", text: t("先从案板上选中两件证物。") });
      return;
    }
    const relationId = connectClues(selectedClueIds[0], selectedClueIds[1]);
    const relation = campaign.relations.find((item) => item.id === relationId);
    if (!relation) {
      setFeedback({ kind: "error", text: t("这两件证物还不能互相作证。换一种连接。") });
      return;
    }
    setFeedback({ kind: "success", text: relation.explanation });
    setSelectedClueIds([]);
    setRevealedRelationId(relation.id);
  };

  const restoreBoardLayout = () => {
    resetBoardPositions();
    setNodes((current) => current.map((node, index) => ({ ...node, position: defaultBoardPosition(index) })));
  };

  const selectedClues = selectedClueIds.map((id) => campaign.case.clues.find((clue) => clue.id === id)).filter((clue): clue is Clue => clue !== undefined);
  const focusedClue = available.find((clue) => clue.id === focusedClueId);
  const focusedRelations = focusedClue ? campaign.relations.filter((relation) => confirmedRelations.includes(relation.id) && relation.clueIds.includes(focusedClue.id)) : [];
  const dossierClue = available.find((clue) => clue.id === dossierClueId) ?? null;
  const dossierRelations = dossierClue ? campaign.relations.filter((relation) => confirmedRelations.includes(relation.id) && relation.clueIds.includes(dossierClue.id)) : [];
  const revealedRelation = revealedRelationId ? campaign.relations.find((relation) => relation.id === revealedRelationId) ?? null : null;
  const inferenceStep = selectedClueIds.length;
  const inferencePrompt = inferenceStep === 0
    ? t("先点一张你认为重要的证物。")
    : inferenceStep === 1
      ? t("再点一张，寻找能互相补全的事实。")
      : t("两件证物已就绪。现在核对它们能否共同证明一个结论。");

  return <div className="board-page">
    <div className="page-title"><div><p className="eyebrow">CASE BOARD · {t("证物关系图")}</p><h2>{locale === "en" ? <>Connect the lies<br />the city has told.</> : <>把城市说过的谎，<br />一根根连起来。</>}</h2></div><p>{t("点两张证物，再核对它们是否能共同作证。无需拖线；桌面端拖动图钉只用于整理案板。")}</p></div>
    <div className="board-workspace">
      <div className="board-shell">
        <header className="clue-index" role="region" aria-label={t("线索索引")}>
          <div className="clue-index-copy">
            <small>CLUE INDEX · {t("线索索引")}</small>
            <b>{available.length} {t("份档案")} · {boardHints.openRelationIds.length} {t("条未结线")}</b>
            <span>{selectedClueIds.length === 1 ? t("铜绿亮起的证物能与 A 互相作证；仍需放入 B 后手动核对。") : t("细线标记尚有未结关系的证物；先选择一件放入 A。")}</span>
          </div>
          <div className="clue-index-status" aria-hidden="true">
            {available.map((clue) => {
              const selectionIndex = selectedClueIds.indexOf(clue.id);
              const state = selectionIndex !== -1 ? "selected" : compatibleClueIds.has(clue.id) ? "compatible" : checkableClueIds.has(clue.id) ? "checkable" : "";
              return <i className={state} key={clue.id} />;
            })}
          </div>
        </header>
        <div className="board-flow">{nodes.length ? <ReactFlow nodes={nodes} edges={edges} nodeTypes={evidenceNodeTypes} onNodesChange={onNodesChange} onNodeDragStop={(_, node) => setBoardPosition(node.id, node.position)} fitView minZoom={0.5} maxZoom={1.6} nodesDraggable={!isCompactBoard} panOnDrag={!isCompactBoard} zoomOnPinch={!isCompactBoard} zoomOnScroll={!isCompactBoard} zoomOnDoubleClick={!isCompactBoard} preventScrolling={!isCompactBoard} proOptions={{ hideAttribution: true }}><Background color="#988d73" gap={28} size={1} variant={BackgroundVariant.Dots} />{!isCompactBoard && <Controls showInteractive={false} />}</ReactFlow> : <div className="board-empty"><Search /><h3>{t("案件板还很安静")}</h3><p>{t("完成第一夜调查，林渡带回的证物会出现在这里。")}</p></div>}</div>
      </div>
      <aside className="relation-panel" aria-label={t("证物档案与关系")}>
        <section className="inference-toolbar" aria-label={t("联合推理操作台")}>
          <div className="inference-toolbar-copy">
            <small>JOINT INFERENCE · {t("联合推理")}</small>
            <b>{inferencePrompt}</b>
            <span><i className="desktop-board-hint">{t("从左侧案板点选；只有图钉可以拖动整理。")}</i><i className="mobile-board-hint">{t("从上方案板点选；上下滑动可以继续阅档。")}</i></span>
          </div>
          <ol className="inference-steps" aria-label={t("联合推理步骤")}>
            {["选第一件", "选第二件", "核对证词"].map((label, index) => <li className={inferenceStep > index || (index === 2 && inferenceStep === 2) ? "active" : ""} aria-current={inferenceStep === index ? "step" : undefined} key={label}><span>{index + 1}</span>{t(label)}</li>)}
          </ol>
          <div className="inference-workbench" aria-label={t("待核对证物")} aria-live="polite">
            {[0, 1].map((index) => {
              const clue = selectedClues[index];
              return clue ? <button type="button" className={`evidence-slot slot-${index === 0 ? "a" : "b"} filled`} aria-label={`${t("移除证物")} ${index === 0 ? "A" : "B"}：${clue.title}`} onClick={() => selectEvidence(clue.id)} key={clue.id}><span>{index === 0 ? "A" : "B"}</span><div><small>{clue.type} · NIGHT 0{clue.chapter}</small><b>{clue.title}</b><p>{clue.summary}</p></div><X /></button> : <div className={`evidence-slot slot-${index === 0 ? "a" : "b"}`} key={index}><span>{index === 0 ? "A" : "B"}</span><div><small>{t("等待线索")}</small><b>{t("尚未选择")}</b><p>{t("从案板点选一件证物。")}</p></div></div>;
            })}
            <button className="connect-evidence" aria-label={selectedClueIds.length === 2 ? t("核对这两件证物") : locale === "en" ? `Choose ${2 - selectedClueIds.length} more pieces of evidence` : `还需选择 ${2 - selectedClueIds.length} 件证物`} disabled={selectedClueIds.length !== 2} onClick={submitConnection}><Link2 /><span>{selectedClueIds.length === 2 ? t("核对证物") : t("等待配对")}</span><small>{selectedClueIds.length === 2 ? t("A 与 B") : locale === "en" ? `${selectedClueIds.length}/2 selected` : `${selectedClueIds.length}/2 已选择`}</small></button>
          </div>
          {feedback && <p className={`relation-feedback ${feedback.kind}`} role="status">{feedback.text}</p>}
        </section>
        <div className="board-panel-heading"><small>OPEN DOSSIER · {focusedClue ? `NIGHT 0${focusedClue.chapter}` : "NO FILE"}</small><button type="button" onClick={restoreBoardLayout}><RotateCcw /> {t("恢复摆放")}</button></div>
        {focusedClue ? <article className="clue-dossier" aria-live="polite"><span>{focusedClue.type}{receivedClueIds.includes(focusedClue.id) ? ` · ${t("好友送达")}` : ""}</span><h3>{focusedClue.title}</h3><div className="clue-dossier-actions"><button className="clue-dossier-open" type="button" onClick={() => openDossier(focusedClue.id)}><BookOpen /> {t("以信笺阅档")}</button><button className="clue-share-trigger" type="button" onClick={() => setSharedClue(focusedClue)}><QrCode /> {t("送给好友")}</button></div><p>{focusedClue.detail}</p><blockquote><small>{t("城市异议")}</small>“{focusedClue.cityObjection}”</blockquote><div><small>{campaign.presentation.detectiveName} · {t("页边批注")}</small>{focusedClue.marginNote}</div>{focusedRelations.length > 0 && <footer><small>{t("这份证物已经参与作证")}</small>{focusedRelations.map((relation) => <b key={relation.id}><Link2 /> {relation.statement}</b>)}</footer>}</article> : <div className="clue-dossier empty"><FileText /><p>{t("点击案板上的证物即可阅档；选中的两件会留在右侧推理栏中。")}</p></div>}
        <div className="relation-ledger"><small>{t("核心推论")} · {confirmedRelations.length}/{campaign.relations.length}</small>{campaign.relations.map((relation, index) => { const confirmed = confirmedRelations.includes(relation.id); return <button type="button" disabled={!confirmed} aria-label={confirmed ? `${t("查看核心推论")}：${relation.statement}` : t("未确认推论")} onClick={() => setRevealedRelationId(relation.id)} className={confirmed ? "relation-entry done" : "relation-entry"} key={relation.id}><span>{confirmed ? <Check /> : `0${index + 1}`}</span><div><small>{confirmed ? "CONFIRMED" : "UNRESOLVED"}</small><b>{confirmed ? relation.statement : t("未确认推论")}</b></div></button>; })}</div>
      </aside>
    </div>
    <details className="board-cipher-disclosure">
      <summary>
        <span><small>OPTIONAL ARCHIVE · {locale === "en" ? "OPTIONAL CIPHERS" : "可选解密"}</small><b>{locale === "en" ? "Open the night cipher desk" : "打开夜班密文台"}</b><p>{locale === "en" ? "Ciphers reveal extra archive notes. They add no reward, replace no inference, and change no ending condition." : "密文只展开补充旁注，不增加奖励、不替代联合推理，也不改变任何结局资格。"}</p></span>
        <ChevronRight />
      </summary>
      <CipherDesk />
    </details>
    <AnimatePresence>{dossierClue && <ClueDossierDialog
      clue={dossierClue}
      received={receivedClueIds.includes(dossierClue.id)}
      relations={dossierRelations}
      detectiveName={campaign.presentation.detectiveName}
      onClose={() => setDossierClueId(null)}
      onShare={() => {
        setDossierClueId(null);
        setSharedClue(dossierClue);
      }}
    />}</AnimatePresence>
    <AnimatePresence>{revealedRelation && <RelationRevealDialog relation={revealedRelation} onClose={() => setRevealedRelationId(null)} />}</AnimatePresence>
    <AnimatePresence>{sharedClue && <ClueShareDialog clue={sharedClue} onClose={() => setSharedClue(null)} />}</AnimatePresence>
  </div>;
}

export function Collection() {
  const { unlockedCollectibleIds, nightSealIds, chapter, completedReports, preparationHistory, choiceHistory, growthHistory, societyHistory, correspondenceHistory, souvenirHistory, opportunityHistory } = useGameStore();
  const { campaign, localize, locale, t } = useI18n();
  const [mintingCollectible, setMintingCollectible] = useState<Collectible | null>(null);
  const [mintedCollectibleIds, setMintedCollectibleIds] = useState<string[]>([]);
  const [activeCollectionCategory, setActiveCollectionCategory] = useState<"evidence" | "journey" | "city" | "pocket">("evidence");
  const nightCount = campaign.case.chapters.length;
  const finalChapter = campaign.case.chapters.at(-1)!.number;
  const opportunityDays = campaign.case.chapters.filter((entry) => entry.number >= 2).map((entry) => entry.number);
  const societyRecords = Object.values(societyHistory).filter((record): record is SocietyMemoryRecord => Boolean(record)).sort((a, b) => a.chapter - b.chapter);
  const correspondenceRecords = Object.values(correspondenceHistory).filter((record): record is CorrespondenceRecord => Boolean(record));
  const wakeEchoCount = Object.values(growthHistory).filter((record) => record?.wakeEchoId).length;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ids = Object.values(readMintReceipts())
        .filter((receipt) => receipt.campaignId === campaign.id)
        .map((receipt) => receipt.collectibleId);
      setMintedCollectibleIds([...new Set(ids)]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [campaign.id]);
  const collectionCategories = [
    {
      id: "evidence" as const,
      targetId: "collection-core-evidence",
      icon: <FileCheck2 />,
      label: locale === "en" ? "Core evidence" : "核心物证",
      count: `${unlockedCollectibleIds.length}/${campaign.case.collectibles.length}`,
    },
    {
      id: "journey" as const,
      targetId: "collection-returned-nights",
      icon: <BookOpen />,
      label: locale === "en" ? "Returned nights" : "夜班归来",
      count: `${completedReports.length}/${nightCount}`,
    },
    {
      id: "city" as const,
      targetId: "collection-city-echoes",
      icon: <FileText />,
      label: locale === "en" ? "City echoes" : "城市回声",
      count: locale === "en" ? "4 shelves" : "4 组档案",
    },
    {
      id: "pocket" as const,
      targetId: "collection-pocket-drawer",
      icon: <KeyRound />,
      label: locale === "en" ? "Pocket finds" : "口袋小物",
      count: `${Object.keys(souvenirHistory).length}/${nightCount}`,
    },
  ];
  const selectCollectionCategory = (id: typeof collectionCategories[number]["id"], targetId: string) => {
    setActiveCollectionCategory(id);
    window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const collectionSectionClass = (id: typeof collectionCategories[number]["id"]) => `collection-section collection-section-${id}${activeCollectionCategory === id ? " is-active" : ""}`;
  return <div className="collection-page">
    <div className="page-title"><div><p className="eyebrow">NIGHT CABINET · {t("夜间陈列柜")}</p><h2>{locale === "en" ? <>Time did not vanish.<br />Nor did the city forget.</> : <>时间没有消失。<br />城市也没有忘记。</>}</h2></div><p>{locale === "en" ? `Every wait leaves a night seal, grows a plant, returns a postcard, and lets one of the underground societies remember how you worked. These are not scores, but ${nightCount} stretches of time that can be told again.` : `每次等待都会形成一枚夜印、长成一株植物、寄回一张明信片，也让某个地下社团记住你的做事方式。这里保存的不是分数，是 ${nightCount} 段可以重新讲述的时间。`}</p></div>
    <nav className="collection-index" aria-label={locale === "en" ? "Collection archive groups" : "收藏档案分类"}>
      <div className="collection-index-heading"><small>ARCHIVE INDEX · 04 DRAWERS</small><b>{locale === "en" ? "Choose what you came back to find." : "先看你这次回来想找什么。"}</b></div>
      <div className="collection-index-tabs">
        {collectionCategories.map((category) => <button type="button" aria-pressed={activeCollectionCategory === category.id} className={activeCollectionCategory === category.id ? "active" : ""} onClick={() => selectCollectionCategory(category.id, category.targetId)} key={category.id}>{category.icon}<span><b>{category.label}</b><small>{category.count}</small></span></button>)}
      </div>
    </nav>
    <section id="collection-city-echoes" className={`city-favor-ledger ${collectionSectionClass("city")}`}>
      <div className="shelf-heading"><small>CITY REMEMBERS · {societyRecords.length}/{nightCount} NIGHTS</small><h3>{t("城市人情簿")}</h3></div>
      <p className="society-ledger-intro">{t("没有声望点数，也没有最优路线。城市只会依照你反复选择的调查姿态，更换称呼、礼数和愿意交给你的旁话。")}</p>
      <div className="society-ledger-grid">{citySocieties.map((source) => { const society = localize(source); const records = societyRecords.filter((record) => record.societyId === society.id); const latest = records.at(-1); return <article className={latest ? `society-ledger-card touched standing-${latest.standing}` : "society-ledger-card"} key={society.id}><SocietyCrest societyId={society.id} compact /><div className="society-ledger-copy"><small>{society.archiveName}</small><h3>{society.name}</h3><p className="society-concern">{t("关心")} · {society.concern}</p><blockquote>“{society.publicRumor}”</blockquote><div className="society-current-address"><small>{t("城里目前怎样称呼你")}</small><b>{latest ? t(getSocietyTitle(latest)) : t("尚未被正式称呼")}</b></div><p className="society-rule">{t("内部规矩")} · {society.privateRule}</p></div><div className="society-trace">{records.length ? records.map((record) => { const direction = getCampaignRouteDirection(campaign, record.chapter, record.choiceId); const replyRecord = correspondenceHistory[record.chapter]; return <div key={record.chapter}><span>{locale === "en" ? `Night 0${record.chapter}` : `夜 0${record.chapter}`}</span><b>{direction.dispatchTitle}</b><small>{replyRecord ? t("已回信") : t("未回信")}</small></div>; }) : <p>{t("尚无一条已归来的路线惊动他们。")}</p>}</div></article>; })}</div>
      {societyRecords.length > 0 && <div className="correspondence-ledger"><div className="correspondence-ledger-heading"><small>RETURNED ANSWERS · {correspondenceRecords.length}/{societyRecords.length}</small><h4>{t("问函与答复履历")}</h4><p>{t("没有寄出的答复也会保留为空白，不影响任何案件成果。")}</p></div><div className="correspondence-ledger-grid">{societyRecords.map((memory) => { const society = localize(citySocieties.find((item) => item.id === memory.societyId)!); const prompt = localize(getCorrespondencePrompt(memory)); const record = correspondenceHistory[memory.chapter]; const reply = record ? localize(getCorrespondenceReply(record)) : null; return <article className={reply ? "correspondence-ledger-entry answered" : "correspondence-ledger-entry"} key={memory.chapter}><small>{locale === "en" ? `Night 0${memory.chapter}` : `夜 0${memory.chapter}`} · {society.name}</small><h5>{prompt.question}</h5>{reply ? <><div><small>{t("你的答复")}</small><b>{reply.label}</b><p>{reply.summary}</p></div><blockquote><small>{t("留下的余波")}</small>{reply.echo}</blockquote></> : <div className="unanswered"><small>{t("未寄出的信封")}</small><b>{t("这一夜没有答复")}</b><p>{t("故事照常继续，城市没有替你的沉默扣除任何东西。")}</p></div>}</article>; })}</div></div>}
    </section>
    <section id="collection-pocket-drawer" className={`pocket-drawer ${collectionSectionClass("pocket")}`}>
      <div className="shelf-heading"><small>UNASKED-FOR SOUVENIRS · {Object.keys(souvenirHistory).length}/{nightCount} NIGHTS</small><h3>{t("口袋抽屉")}</h3></div>
      <p className="pocket-drawer-intro">{locale === "en" ? `Directions and packed items lead ${campaign.presentation.detectiveName} through different corners of the city, but there is no exchange table and refreshing cannot reroll a find. Each object from these ${nightCount} nights is merely a piece of incidental testimony, never an advantage.` : `方向与随身物会让${campaign.presentation.detectiveName}经过不同的城市角落，但没有兑换表，也不能靠刷新重抽。${nightCount} 夜里出现的每件小物都只是一段旁证，不会替案件增加优势。`}</p>
      <div className="pocket-drawer-grid">{souvenirs.map((source) => { const souvenir = localize(source); const record = Object.values(souvenirHistory).find((entry) => entry?.souvenirId === souvenir.id); const art = getAsset(souvenir.assetId); const direction = record ? getCampaignRouteDirection(campaign, record.chapter, record.choiceId) : null; const preparation = record ? localize(getPreparation(record.preparationId)) : null; return <article className={record ? "pocket-object unlocked" : "pocket-object locked"} key={souvenir.id}><div className="pocket-object-art">{record ? <Image src={art.src} alt={art.alt} width={1024} height={1024} /> : <div><KeyRound /><span>DRAWER CLOSED</span></div>}</div><div className="pocket-object-copy"><small>{record ? `${locale === "en" ? "Night" : "夜"} 0${record.chapter} · ${souvenir.archiveName}` : t("尚未出现在口袋里")}</small><h4>{record ? souvenir.name : t("未归档小物")}</h4><p>{record ? souvenir.provenance : t("城市还没有决定把什么留给这一格抽屉。")}</p>{record && <blockquote>“{souvenir.fieldNote}”</blockquote>}{record && <footer><b>{direction?.dispatchTitle}</b><span>{preparation?.shortTitle} · {direction?.destination}</span></footer>}</div></article>; })}</div>
    </section>
    <section className={`city-clipping-book ${collectionSectionClass("city")}`}>
      <div className="shelf-heading"><small>DAYLIGHT NOTICES · {Object.keys(opportunityHistory).length}/{opportunityDays.length} DAYS</small><h3>{t("城市剪报册")}</h3></div>
      <p>{t("收起的纸也会留在那一天，但不会替你补写选择。这里没有行动点、分数或最优答复。")}</p>
      <div>{opportunityDays.map((day) => { const record = opportunityHistory[day]; const notice = record?.noticeId ? localize(getOpportunityNotice(record.noticeId)) : null; const response = record ? localize(getOpportunityResponse(record)) : null; return <article className={record ? "filed" : ""} key={day}><small>DAY 0{day} · {record ? "FILED" : "NOT YET"}</small><h4>{record ? (notice?.title ?? t("三张纸没有拆开")) : t("门缝仍然空着")}</h4><p>{record ? (response?.result ?? t("你把三张纸全部收进抽屉。没有人因此失去什么，城市也没有替沉默补写答案。")) : t("完成前一夜后，城市会递来三张可以回应、也可以收起的纸。")}</p>{response && <blockquote><small>{t("后来传回")}</small>“{response.echo}”</blockquote>}</article>; })}</div>
    </section>
    <section className={`city-watch-ledger ${collectionSectionClass("city")}`}><div className="shelf-heading"><small>WHEN THE CITY RECEIVED THE SHIFT · {Object.keys(growthHistory).length}/{nightCount}</small><h3>{t("城市值更簿")}</h3></div><p>{locale === "en" ? `This records the hour at which you handed the assignment to ${campaign.presentation.detectiveName}. It changes only who remains in the street and which face the city reveals, never the case outcome.` : `这里保存你在什么时辰把任务交给${campaign.presentation.detectiveName}。它只改变当时仍在街上的人和城市愿意露出的侧面，不改变任何案件成果。`}</p><div>{campaign.case.chapters.map((entry) => { const record = growthHistory[entry.number]; if (!record) return <article className="watch-ledger-entry locked" key={entry.number}><small>NIGHT 0{entry.number} · UNFILED</small><h4>{t("时辰尚未归档")}</h4><p>{t("完成这一夜后，交接时刻会留下一段城市侧影。")}</p></article>; const watch = localize(getCityWatch(record.watchId ?? DEMO_CITY_WATCH_ID)); const echo = getCampaignWatchEcho(campaign, entry.number, watch.id); const direction = getCampaignRouteDirection(campaign, entry.number, record.choiceId); return <article className={`watch-ledger-entry watch-${watch.id}`} key={entry.number}><small>NIGHT 0{entry.number} · {watch.archiveLabel}</small><h4>{watch.label}</h4><span>{watch.window} · {direction.destination}</span><blockquote>“{echo.fieldNote}”</blockquote></article>; })}</div></section>
    <section className={`sleep-gap-ledger ${collectionSectionClass("city")}`}><div className="shelf-heading"><small>NOTES BETWEEN DREAMS · {wakeEchoCount}/{nightCount}</small><h3>{t("睡隙回声簿")}</h3></div><p>{t("短暂醒转可以留下声音，但不会让夜班结束。没有醒转的空白同样完整；这里没有需要补齐的收集率。")}</p><div>{campaign.case.chapters.map((entry) => { const record = growthHistory[entry.number]; if (!record) return <article className="sleep-gap-entry locked" key={entry.number}><small>NIGHT 0{entry.number} · UNRETURNED</small><h4>{t("这一夜尚未归来")}</h4><p>{t("档案没有替未来的睡意预写内容。")}</p></article>; if (!record.wakeEchoId) return <article className="sleep-gap-entry quiet" key={entry.number}><small>NIGHT 0{entry.number} · UNDISTURBED</small><h4>{t("夜印里没有裂缝")}</h4><p>{t("这一夜没有记录醒转。空白不是遗漏，也不比回声少任何成果。")}</p></article>; const echo = getCampaignWakeEchoById(campaign, record.wakeEchoId); return <article className="sleep-gap-entry returned" key={entry.number}><small>NIGHT 0{entry.number} · ONE BRIEF WAKING</small><h4>{echo.title}</h4><p>{echo.sound}</p><blockquote>“{echo.fieldNote}”</blockquote></article>; })}</div></section>
    <section className={`night-greenhouse ${collectionSectionClass("journey")}`}>
      <div className="shelf-heading"><small>FOGLIGHT GREENHOUSE · {Object.keys(growthHistory).length}/{nightCount}</small><h3>{t("雾灯温室")}</h3></div>
      <p className="greenhouse-intro">{t("提前醒来不会让任何植物枯死。它只会以更小、更奇异的形态，完整保存那一夜。")}</p>
      <div className="greenhouse-grid">{campaign.botanicals.map((botanical) => { const record = growthHistory[botanical.chapter]; const direction = record ? getCampaignRouteDirection(campaign, botanical.chapter, record.choiceId) : null; const preparation = record ? localize(getPreparation(record.preparationId)) : null; const watch = record ? localize(getCityWatch(record.watchId ?? DEMO_CITY_WATCH_ID)) : null; return <article className={record ? `greenhouse-specimen unlocked quality-${record.quality}` : "greenhouse-specimen locked"} key={botanical.id}>{record ? <BotanicalSpecimen chapter={botanical.chapter} compact /> : <div className="greenhouse-locked"><KeyRound /><span>NIGHT 0{botanical.chapter}</span></div>}<div className="greenhouse-copy"><small>{record ? `${watch?.label} · ${t(qualityCopy[record.quality].label)} · ${formatSleepDuration(record.durationMinutes, locale)}` : "SEED DORMANT"}</small><h3>{record ? botanical.name : t("种核尚未苏醒")}</h3><p>{record ? botanical.specimenNote : t("完成这一夜，无论睡了多久，温室都会保存一株完整植物。")}</p>{record && <span><b>{direction?.dispatchTitle}</b>{preparation?.shortTitle} · {botanical.district}</span>}</div></article>; })}</div>
    </section>
    <section id="collection-returned-nights" className={`journey-album ${collectionSectionClass("journey")}`}><div className="shelf-heading"><small>RETURNED POSTCARDS · {completedReports.length}/{nightCount}</small><h3>{locale === "en" ? `${nightCount} nights returned by ${campaign.presentation.cityName}` : `${campaign.presentation.cityName}寄回的 ${nightCount} 个夜晚`}</h3></div><div className="journey-postcard-grid">{campaign.postcards.map((postcard) => { const unlocked = completedReports.includes(postcard.chapter); const preparationId = preparationHistory[postcard.chapter] ?? "side-lamp"; const preparation = localize(getPreparation(preparationId)); const direction = getCampaignRouteDirection(campaign, postcard.chapter, choiceHistory[postcard.chapter] ?? ""); const art = getAsset(postcard.assetId); return <article className={unlocked ? "journey-postcard unlocked" : "journey-postcard locked"} key={postcard.id}><div className="journey-postcard-image">{unlocked ? <Image src={art.src} alt={art.alt} width={768} height={512} /> : <div className="postcard-locked"><KeyRound /><span>NIGHT 0{postcard.chapter}</span></div>}</div><div className="journey-postcard-copy"><small>{unlocked ? postcard.location : "ROUTE NOT RETURNED"}</small><h3>{unlocked ? postcard.title : t("尚未寄回")}</h3><p>{unlocked ? postcard.message : locale === "en" ? `Complete this night's handoff and ${campaign.presentation.detectiveName} will send a postcard home from the city.` : `完成这一夜的交接，${campaign.presentation.detectiveName}会从城市里寄回一张明信片。`}</p>{unlocked && <div className="journey-route-history"><small>CHOSEN ROUTE</small><b>{direction.dispatchTitle} · {direction.destination}</b><p>{direction.returnLetter}</p></div>}{unlocked && <span><b>{preparation?.shortTitle ?? t("随身物")}</b>{postcard.preparationNotes[preparationId]}</span>}</div></article>; })}</div></section>
    <section className={`night-seal-shelf ${collectionSectionClass("journey")}`}><div className="shelf-heading"><small>NIGHT SEALS · {nightSealIds.length}/{nightCount}</small><h3>{locale === "en" ? `${nightCount} night seals` : `${nightCount} 夜印记`}</h3></div><div className="night-seal-row">{campaign.case.chapters.map((entry) => { const art = getAsset(getCampaignNightSealAssetId(campaign, entry.number)); const unlocked = nightSealIds.includes(entry.number); return <div className={unlocked ? "night-seal unlocked" : "night-seal locked"} key={entry.number}><Image src={art.src} alt={unlocked ? art.alt : t("尚未形成的夜印")} width={160} height={160} /><span>{locale === "en" ? "NIGHT" : "夜"} 0{entry.number}</span><b>{unlocked ? entry.title : t("尚未成形")}</b></div>; })}</div></section>
    <section id="collection-core-evidence" className={`collection-evidence-cabinet ${collectionSectionClass("evidence")}`}>
      <div className="shelf-heading"><small>CORE EVIDENCE · {unlockedCollectibleIds.length}/{campaign.case.collectibles.length} FILED</small><h3>{locale === "en" ? "Evidence brought back to the agency" : "带回事务所的核心物证"}</h3></div>
      <p className="collection-evidence-intro">{locale === "en" ? "These are the objects that can testify in the case. Open an unlocked file here to keep it local or place an optional receipt in the Injective archive." : "这些物件会在案件里作证。已解锁的档案可以留在本机，也可以选择在 Injective 链上留下一张公开回执。"}</p>
      <div className="collection-grid">{campaign.case.collectibles.map((item, index) => { const unlocked = unlockedCollectibleIds.includes(item.id); const revealed = unlocked && chapter >= Math.min(finalChapter, item.chapter + 2); const minted = mintedCollectibleIds.includes(item.id); const art = getAsset(item.assetId); return <motion.article whileHover={unlocked ? { y: -5, rotate: index % 2 ? .3 : -.3 } : {}} key={item.id} className={`collectible-card ${unlocked ? "unlocked" : "locked"}`}><div className="item-number">0{index + 1}</div><div className="item-art"><Image src={art.src} alt={unlocked ? art.alt : t("尚未发现的物品")} width={438} height={438} /></div><div className="item-meta"><small>{unlocked ? `${item.district} · ${item.rarity}` : t("尚未发现")}</small><h3>{unlocked ? item.title : t("未归档物品")}</h3><p>{unlocked ? (revealed ? item.revealedDescription : item.surfaceDescription) : t("下一次夜间调查，也许会让它出现在林渡的口袋里。")}</p>{revealed && <Seal>{t("隐藏含义已揭示")}</Seal>}{unlocked && <button className={minted ? "collectible-mint-trigger minted" : "collectible-mint-trigger"} type="button" onClick={() => setMintingCollectible(item)}>{minted ? <FileCheck2 /> : <Sparkles />}<span>{minted ? t("此浏览器已有链上回执") : t("封进 Injective 链上档案")}</span></button>}</div></motion.article>; })}</div>
    </section>
    <AnimatePresence>{mintingCollectible && <InjectiveMintDialog
      campaignId={campaign.id}
      collectible={mintingCollectible}
      asset={getAsset(mintingCollectible.assetId)}
      onClose={() => setMintingCollectible(null)}
      onMinted={(receipt) => setMintedCollectibleIds((current) => [...new Set([...current, receipt.collectibleId])])}
    />}</AnimatePresence>
  </div>;
}

export function ArchivePage() {
  const { completedReports, unlockedClueIds } = useGameStore();
  const { campaign, locale, t } = useI18n();
  const progress = Math.round((unlockedClueIds.length / campaign.case.clues.length) * 100);
  const encounteredCharacters = campaign.characters.filter((character) => completedReports.includes(character.encounterChapter));
  const visitedDistricts = campaign.districts.filter((district) => completedReports.includes(district.introducedChapter));

  return <div className="archive-page">
    <div className="page-title"><div><p className="eyebrow">CASE ARCHIVE · {campaign.presentation.archiveNumber}</p><h2>{campaign.case.title}</h2></div><Seal>{progress}% {t("已查明")}</Seal></div>
    <div className="archive-folders">{campaign.case.chapters.map((chapter) => <PaperCard key={chapter.number} className={completedReports.includes(chapter.number) ? "folder complete" : "folder"}><span className="folder-tab">NIGHT 0{chapter.number}</span><small>{completedReports.includes(chapter.number) ? "REPORT FILED" : "SEALED"}</small><h3>{chapter.title}</h3><p>{chapter.subtitle}</p><div>{completedReports.includes(chapter.number) ? <><Check /> {t("调查完成")}</> : <><KeyRound /> {t("尚未开启")}</>}</div></PaperCard>)}</div>
    <section className="district-atlas"><div className="shelf-heading"><small>FOGLIGHT ATLAS · {visitedDistricts.length}/{campaign.districts.length} DISTRICTS</small><h3>{locale === "en" ? `${campaign.presentation.cityName} District Atlas` : `${campaign.presentation.cityName}分区志`}</h3></div><p>{locale === "en" ? `Maps record roads, but districts are known by their rules. Only after ${campaign.presentation.detectiveName} has truly walked through a place will the archive permit it a name.` : `地图记录道路，城区却靠规矩辨认。${campaign.presentation.detectiveName}真正走过一块地方以后，档案才允许它获得名字。`}</p><div>{campaign.districts.map((district) => { const unlocked = completedReports.includes(district.introducedChapter); const art = getAsset(district.assetId); return <article className={unlocked ? "district-entry unlocked" : "district-entry locked"} key={district.id}><div className="district-art">{unlocked ? <Image src={art.src} alt={art.alt} width={1200} height={800} /> : <div><KeyRound /><span>DISTRICT UNVISITED</span></div>}</div><div className="district-copy"><small>{unlocked ? district.archiveName : "DISTRICT FILE · SEALED"}</small><h4>{unlocked ? district.name : t("城区尚未归档")}</h4><b>{unlocked ? district.subtitle : locale === "en" ? `Opens after Night ${district.introducedChapter}` : `完成第 ${district.introducedChapter} 夜后展开`}</b>{unlocked && <><p><span>{t("公共说法")}</span>{district.publicVersion}</p><blockquote><span>{t("城里实际遵守")}</span>{district.cityRule}</blockquote><footer>{district.landmarks.map((landmark) => <i key={landmark}>{landmark}</i>)}</footer></>}</div></article>; })}</div></section>
    {campaign.characters.length > 0 && <section className="person-dossiers"><div className="shelf-heading"><small>PERSONS OF INTEREST · {encounteredCharacters.length}/{campaign.characters.length}</small><h3>{t("相关人物")}</h3></div><p>{t("城市传闻不等于证词。只有已经带回的线索，才能让档案展开第二层。")}</p><div>{campaign.characters.map((character) => { const encountered = completedReports.includes(character.encounterChapter); const revealed = encountered && isCharacterRevealed(character, unlockedClueIds); const art = getAsset(character.assetId); return <article className={encountered ? "person-dossier encountered" : "person-dossier locked"} key={character.id}><div className="person-portrait">{encountered ? <Image src={art.src} alt={art.alt} width={1024} height={1280} /> : <div><KeyRound /><span>PERSON SEALED</span></div>}</div><div className="person-dossier-copy"><small>{encountered ? character.archiveName : `PERSON 0${character.encounterChapter} · SEALED`}</small><h4>{encountered ? character.name : t("尚未见面")}</h4><b>{encountered ? `${character.role} · ${character.district}` : t("完成对应夜班后归档")}</b><p>{encountered ? `“${character.publicRumor}”` : t("这份档案还没有获得姓名。")}</p>{encountered && <div><small>{t("已知事实")}</small>{character.knownFact}</div>}{revealed && <blockquote><small>{t("保留意见已展开")}</small>{character.withheld}</blockquote>}{encountered && !revealed && <span><KeyRound /> {t("仍有部分说法需要现有证物互相作证")}</span>}</div></article>; })}</div></section>}
  </div>;
}

export function Ending({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const { unlockedClueIds, receivedClueIds, unlockedCollectibleIds, confirmedRelations, correspondenceHistory, completedReports, preparationHistory, choiceHistory, growthHistory, souvenirHistory, endingId, chooseEnding, reset } = useGameStore();
  const { campaign, localize, locale, t } = useI18n();
  const nightCount = campaign.case.chapters.length;
  const [reviewingArchive, setReviewingArchive] = useState(false);
  const earnedClueIds = unlockedClueIds.filter((clueId) => !receivedClueIds.includes(clueId));
  const trueReady = canUnlockTrueEnding({ unlockedClueIds: earnedClueIds, unlockedCollectibleIds, confirmedRelations }, campaign.rules);
  const dominantStance = getDominantCorrespondenceStance(correspondenceHistory);
  const cityAfterword = localize(dominantStance ? correspondencePostures[dominantStance] : { title: "未寄出的答复", note: "你没有让任何社团替你固定立场。雾灯城把那些空信封也归了档：沉默不是失败，只是一种尚未交出的决定。" });
  const icons: Record<EndingId, React.ReactNode> = { public: <FileText />, protect: <KeyRound />, return: <Flower2 /> };
  const selected = campaign.endings.find((item) => item.id === endingId);
  const endingArt = getAsset(campaign.presentation.endingAssetId);
  const journeyNights = [...completedReports].sort((a, b) => a - b).flatMap((chapterNumber) => {
    const chapter = campaign.case.chapters.find((item) => item.number === chapterNumber);
    const postcard = campaign.postcards.find((item) => item.chapter === chapterNumber);
    const botanical = campaign.botanicals.find((item) => item.chapter === chapterNumber);
    if (!chapter || !postcard || !botanical) return [];
    const recordedChoiceId = choiceHistory[chapterNumber];
    const validChoiceId = chapter.choices.some((choice) => choice.id === recordedChoiceId)
      ? recordedChoiceId
      : "";
    const direction = getCampaignRouteDirection(campaign, chapterNumber, validChoiceId);
    const preparation = localize(getPreparation(preparationHistory[chapterNumber] ?? "side-lamp"));
    const growth = growthHistory[chapterNumber];
    const souvenirRecord = souvenirHistory[chapterNumber];
    const souvenir = souvenirRecord ? localize(souvenirs.find((item) => item.id === souvenirRecord.souvenirId)) : undefined;
    return [{ chapter, postcard, botanical, direction, preparation, growth, souvenir }];
  });
  const recoveredEvidence = campaign.case.collectibles.filter((item) => unlockedCollectibleIds.includes(item.id));

  if (selected && reviewingArchive) return <main className="ending-archive-review"><header><button type="button" onClick={() => setReviewingArchive(false)}><ArrowLeft /> {t("回到结案页")}</button><span>CASE REMAINS CLOSED · {t("档案只读")}</span></header><ArchivePage /></main>;

  if (selected) return <main className="ending-reveal">
    <Image className="ending-background" src={endingArt.src} alt={endingArt.alt} fill priority sizes="100vw" /><div className="ending-light" />
    <Seal>{selected.archiveLabel}</Seal><h1>{selected.title}</h1><p className="ending-theme">{selected.theme}</p>
    <PaperCard className="ending-letter"><small>FINAL LETTER · {campaign.presentation.detectiveName}{locale === "en" ? "" : "终函"}</small><p>{selected.result}</p><hr /><blockquote>“{selected.detectiveLetter}”</blockquote><div className="city-afterword"><small>CITY POSTSCRIPT · {t("与结局资格无关")}</small><b>{cityAfterword.title}</b><p>{cityAfterword.note}</p></div></PaperCard>
    <section className="case-closing-ledger"><div className="ending-section-heading"><small>NIGHTS RETURNED · {journeyNights.length}/{nightCount}</small><h2>{locale === "en" ? `Ledger of ${nightCount} returned nights` : `${nightCount} 夜归来总账`}</h2><p>{locale === "en" ? `No score is kept here. It preserves only the directions you gave ${campaign.presentation.detectiveName}, the plants grown by time, and the small things the city slipped into a pocket.` : `这里不计算分数。它只保存你交给${campaign.presentation.detectiveName}的方向、时间长成的植物，以及城市擅自塞进口袋的小东西。`}</p></div><div className="ending-night-grid">{journeyNights.map(({ chapter, postcard, botanical, direction, preparation, growth, souvenir }) => { const postcardArt = getAsset(postcard.assetId); const sealArt = getAsset(getCampaignNightSealAssetId(campaign, chapter.number)); const watch = growth ? localize(getCityWatch(growth.watchId ?? DEMO_CITY_WATCH_ID)) : null; return <article className="ending-night-entry" key={chapter.number}><div className="ending-night-art"><Image src={postcardArt.src} alt={postcardArt.alt} fill sizes="(max-width: 600px) 100vw, 220px" /><Image className="ending-night-seal" src={sealArt.src} alt={sealArt.alt} width={74} height={74} /></div><div><small>NIGHT 0{chapter.number} · {postcard.location}</small><h3>{chapter.title}</h3><p>{direction.dispatchTitle} · {direction.destination}</p><dl><div><dt>{t("随身")}</dt><dd>{preparation?.shortTitle ?? t("未记录")}</dd></div><div><dt>{t("时间长成")}</dt><dd>{botanical.name}</dd></div><div><dt>{t("口袋带回")}</dt><dd>{souvenir?.name ?? t("这一夜只带回了雨")}</dd></div><div><dt>{t("夜班留痕")}</dt><dd>{growth ? `${watch?.label ?? t("夜半时分")} · ${t(qualityCopy[growth.quality].label)} · ${formatSleepDuration(growth.durationMinutes, locale)}${growth.wakeEchoId ? ` · ${t("一次睡隙")}` : ""}` : t("已归档")}</dd></div></dl></div></article>; })}</div></section>
    <section className="ending-evidence-ledger"><div className="ending-section-heading"><small>RECOVERED EVIDENCE · {recoveredEvidence.length}/{campaign.case.collectibles.length}</small><h2>{t("带回事务所的核心物证")}</h2><p>{t("只陈列这个存档真正找到的东西。没有补齐的格子不会在结案时替你伪造。")}</p></div><div>{recoveredEvidence.map((item) => { const art = getAsset(item.assetId); return <article className="ending-evidence-item" key={item.id}><Image src={art.src} alt={art.alt} width={160} height={160} /><span><small>{item.district}</small><b>{item.title}</b><p>{item.revealedDescription}</p></span></article>; })}</div></section>
    <h2 className="ending-closing-line">{selected.closingLine}</h2><p className="ending-refrain">{campaign.presentation.closingRefrain}</p>
    <div className="ending-actions"><button type="button" onClick={() => setReviewingArchive(true)}><BookOpen /> {t("重看档案")}</button><button type="button" onClick={onOpenLibrary}><KeyRound /> {t("选择其他案件")}</button><button type="button" onClick={reset}><RotateCcw /> {t("重新调查")}</button></div>
  </main>;

  return <main className="ending-choice"><Image className="ending-background" src={endingArt.src} alt={endingArt.alt} fill priority sizes="100vw" /><div className="page-title"><div><p className="eyebrow">FINAL DECISION · CASE {campaign.presentation.archiveNumber}</p><h2>{campaign.presentation.endingQuestion}</h2></div><p>{campaign.presentation.endingPrompt}</p></div><div className="ending-cards">{campaign.endings.map((ending) => { const locked = ending.id === campaign.rules.trueEndingId && !trueReady; return <button key={ending.id} disabled={locked} onClick={() => chooseEnding(ending.id)} className={ending.id === campaign.rules.trueEndingId ? "true-ending" : ""}><span>{icons[ending.id]}</span><small>{locked ? locale === "en" ? `Still needed: ${Math.max(0, campaign.rules.requiredClueCount - earnedClueIds.length)} personally recovered clues / ${Math.max(0, campaign.rules.requiredRelationCount - confirmedRelations.length)} relations` : `尚需 ${Math.max(0, campaign.rules.requiredClueCount - earnedClueIds.length)} 条亲自带回的线索 / ${Math.max(0, campaign.rules.requiredRelationCount - confirmedRelations.length)} 条关系` : t("可选择")}</small><h3>{ending.title}</h3><p>{ending.theme}</p><ArrowRight /></button>; })}</div></main>;
}
