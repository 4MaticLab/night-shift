"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Ear, FileCheck2, FileText, Flower2, KeyRound, Minus, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { BookTextIcon, FileCheck2Icon, FileStackIcon, KeyIcon, SparklesIcon } from "lucide-animated";
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
import type { Clue, Collectible, CorrespondenceRecord, EvidenceSynthesis, SocietyMemoryRecord } from "@/src/lib/game-engine/schema";
import { getEvidenceArchiveItems, getReadyEvidenceSyntheses } from "@/src/lib/game-engine/evidence-synthesis";
import { BotanicalSpecimen, PaperCard, qualityCopy, Seal, SocietyCrest } from "./shared";
import { ClueShareDialog } from "./clue-sharing";
import { useI18n } from "@/src/i18n/provider";
import { CipherDesk } from "./cipher-desk";
import { InjectiveMintDialog } from "./injective-mint";
import { readMintReceipts } from "@/src/lib/injective/client";
import { ClueDossierDialog, SynthesisRevealDialog } from "./evidence-letters";
import { TarotDraw } from "./tarot-draw";

type ArchiveFilter = "all" | "clues" | "inferences" | "unused";

type BoardPlacement = { x: number; y: number; rotation: number };

const boardRotations = [-2.1, 1.4, -1.2, 1.6, -.7, 2.1, 1.1, -1.7, .8, -1.4, 1.9, -.9];

const desktopBoardSlots: BoardPlacement[] = [
  { x: 4, y: 6, rotation: -2.3 },
  { x: 29, y: 3, rotation: 1.7 },
  { x: 54, y: 8, rotation: -1.4 },
  { x: 78, y: 4, rotation: 2.1 },
  { x: 6, y: 39, rotation: 1.2 },
  { x: 31, y: 35, rotation: -1.8 },
  { x: 53, y: 42, rotation: 2.4 },
  { x: 79, y: 37, rotation: -.9 },
  { x: 3, y: 69, rotation: -1.5 },
  { x: 28, y: 66, rotation: 2.2 },
  { x: 55, y: 71, rotation: -2 },
  { x: 77, y: 67, rotation: 1.3 },
];

const BOARD_SCALE_MIN = .7;
const BOARD_SCALE_MAX = 1.12;
const BOARD_SCALE_STEP = .08;

/**
 * Slot-grid layout: every card owns a slot, so cards can never overlap —
 * the tiny jitter and rotation stay inside slot bounds. The canvas grows
 * with the row count instead of recycling positions when files pile up.
 */
function computeBoardLayout(count: number, compact: boolean) {
  const cols = compact ? 2 : 4;
  const rows = Math.max(1, Math.ceil(Math.max(count, 1) / cols));
  const slotW = 100 / cols;
  const cardW = slotW * .72;
  const slotHPx = compact ? 250 : 190;
  const canvasMinH = Math.max(compact ? 560 : 570, rows * slotHPx);
  const positions: BoardPlacement[] = Array.from({ length: count }, (_, index) => {
    if (!compact && desktopBoardSlots[index]) return desktopBoardSlots[index]!;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const jitterX = (((index * 7) % 5) - 2) * .55;
    const jitterY = (((index * 5) % 5) - 2) * .35;
    return {
      x: col * slotW + (slotW - cardW) / 2 + jitterX,
      y: (row * 100) / rows + 2.4 + jitterY,
      rotation: boardRotations[index % boardRotations.length]!,
    };
  });
  return { positions, cardW, canvasMinH };
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function CaseBoard() {
  const { unlockedClueIds, receivedClueIds, synthesizedEvidenceIds, synthesizeEvidence } = useGameStore();
  const { campaign, locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ArchiveFilter>("all");
  const [boardSelectionId, setBoardSelectionId] = useState<string | null>(null);
  const [dossierClueId, setDossierClueId] = useState<string | null>(null);
  const [letterSynthesisId, setLetterSynthesisId] = useState<string | null>(null);
  const [sharedClue, setSharedClue] = useState<Clue | null>(null);
  const [synthesisPanelOpen, setSynthesisPanelOpen] = useState(false);
  const compactBoard = useMediaQuery("(max-width: 900px)");
  const [boardScale, setBoardScale] = useState(.88);
  const archiveItems = useMemo(() => getEvidenceArchiveItems({
    clues: campaign.case.clues,
    syntheses: campaign.syntheses,
    unlockedClueIds,
    synthesizedEvidenceIds,
  }), [campaign.case.clues, campaign.syntheses, synthesizedEvidenceIds, unlockedClueIds]);
  const readySyntheses = useMemo(() => getReadyEvidenceSyntheses({
    syntheses: campaign.syntheses,
    unlockedClueIds,
    synthesizedEvidenceIds,
  }), [campaign.syntheses, synthesizedEvidenceIds, unlockedClueIds]);
  const completedSyntheses = useMemo(() =>
    campaign.syntheses.filter((synthesis) => synthesizedEvidenceIds.includes(synthesis.id)),
  [campaign.syntheses, synthesizedEvidenceIds]);
  const usedEvidenceIds = useMemo(() =>
    new Set(completedSyntheses.flatMap((synthesis) => synthesis.inputIds)),
  [completedSyntheses]);
  const evidenceTitles = useMemo(() => new Map([
    ...campaign.case.clues.map((clue) => [clue.id, clue.title] as const),
    ...campaign.syntheses.map((synthesis) => [synthesis.id, synthesis.title] as const),
  ]), [campaign.case.clues, campaign.syntheses]);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "en" ? "en" : "zh-CN");
  const visibleItems = archiveItems.filter((item) => {
    // The inferences filter mirrors the archived clue set too: filing an
    // inference keeps a readable copy of its inputs on the board view.
    const matchesFilter = filter === "all"
      || (filter === "clues" && item.kind === "clue")
      || (filter === "inferences" && (item.kind === "inference" || usedEvidenceIds.has(item.id)))
      || (filter === "unused" && !usedEvidenceIds.has(item.id));
    const matchesQuery = !normalizedQuery
      || item.searchText.toLocaleLowerCase(locale === "en" ? "en" : "zh-CN").includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });
  // Filed inferences belong in the desk; the board remains a readable map of source clues.
  const boardItems = useMemo(() => visibleItems.filter((item) => item.kind === "clue"), [visibleItems]);
  const allBoardItems = useMemo(() => archiveItems.filter((item) => item.kind === "clue"), [archiveItems]);
  const boardLayout = useMemo(() => computeBoardLayout(allBoardItems.length, compactBoard), [allBoardItems.length, compactBoard]);
  const boardPositions = useMemo(() => new Map(allBoardItems.map((item, index) => [item.id, boardLayout.positions[index] ?? boardLayout.positions[0]!])), [allBoardItems, boardLayout]);
  const visibleBoardItemIds = useMemo(() => new Set(boardItems.map((item) => item.id)), [boardItems]);
  const completedBoardLinks = useMemo(() => completedSyntheses.flatMap((synthesis) => {
    const inputIds = synthesis.inputIds.filter((id) => visibleBoardItemIds.has(id));
    if (inputIds.length < 2) return [];
    return inputIds.slice(1).map((inputId) => ({ id: `${synthesis.id}-${inputIds[0]}-${inputId}`, from: inputIds[0]!, to: inputId }));
  }), [completedSyntheses, visibleBoardItemIds]);
  const availableClues = campaign.case.clues.filter((clue) => unlockedClueIds.includes(clue.id));
  const dossierClue = availableClues.find((clue) => clue.id === dossierClueId) ?? null;
  const dossierSyntheses = dossierClue
    ? completedSyntheses.filter((synthesis) => synthesis.inputIds.includes(dossierClue.id))
    : [];
  const letterSynthesis = letterSynthesisId
    ? campaign.syntheses.find((synthesis) => synthesis.id === letterSynthesisId) ?? null
    : null;

  const openEvidence = (evidenceId: string) => {
    const clue = availableClues.find((item) => item.id === evidenceId);
    if (clue) {
      setLetterSynthesisId(null);
      setDossierClueId(clue.id);
      return;
    }
    if (synthesizedEvidenceIds.includes(evidenceId)) {
      setDossierClueId(null);
      setLetterSynthesisId(evidenceId);
    }
  };

  const completeSynthesis = (synthesis: EvidenceSynthesis) => {
    if (!synthesizeEvidence(synthesis.id)) return;
    setDossierClueId(null);
    setLetterSynthesisId(synthesis.id);
  };

  const filterOptions: Array<{ id: ArchiveFilter; label: string }> = locale === "en"
    ? [
      { id: "all", label: "All files" },
      { id: "clues", label: "Recovered clues" },
      { id: "inferences", label: "Inferences" },
      { id: "unused", label: "Not yet used" },
    ]
    : [
      { id: "all", label: "全部档案" },
      { id: "clues", label: "原始线索" },
      { id: "inferences", label: "合成推论" },
      { id: "unused", label: "尚未采用" },
    ];

  return <div className="board-page evidence-archive-page">
    <div className="page-title"><div><p className="eyebrow">CASE FILES · {locale === "en" ? "EVIDENCE ARCHIVE" : "线索档案"}</p><h2>{locale === "en" ? <>Read what returned.<br />File what it proves.</> : <>先把线索读清，<br />再把推论归档。</>}</h2></div><p>{locale === "en" ? "Every recovered clue can be opened directly. When all evidence for an inference has arrived, the synthesis desk will invite you to file it." : "每份带回的线索都可以直接阅档。只有组成推论的证物全部到齐后，推理台才会请你整理归档。"}</p></div>

    <div className="evidence-archive-layout evidence-board-layout">
      <section className="evidence-library evidence-canvas-library" aria-labelledby="evidence-library-title">
        <header className="evidence-library-toolbar">
          <div>
            <small>CLUE INDEX · {locale === "en" ? "SEARCHABLE FILES" : "可检索档案"}</small>
            <h3 id="evidence-library-title">{locale === "en" ? `${archiveItems.length} files recovered` : `已收录 ${archiveItems.length} 份档案`}</h3>
          </div>
          <div className="evidence-search-stack">
          <label className="evidence-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{locale === "en" ? "Search evidence" : "检索线索"}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === "en" ? "Search titles and notes" : "检索标题、摘要与批注"}
            />
          </label>
          <button type="button" className={`board-synthesis-launcher ${readySyntheses.length > 0 ? "ready" : ""}`} onClick={() => setSynthesisPanelOpen(true)}>
            <span className="board-synthesis-launcher-icon" aria-hidden="true"><Sparkles /></span>
            <span className="board-synthesis-launcher-label">
              <small>INFERENCE DESK</small>
              <b>{readySyntheses.length > 0
                ? (locale === "en" ? `${readySyntheses.length} inference ${readySyntheses.length === 1 ? "is" : "are"} ready` : `${readySyntheses.length} 组线索可以整理`)
                : (locale === "en" ? "Inference desk" : "推理台")}</b>
            </span>
            <ChevronRight aria-hidden="true" />
          </button>
          </div>
          <div className="evidence-filter-row" aria-label={locale === "en" ? "Evidence filters" : "线索筛选"}>
            {filterOptions.map((option) => <button
              type="button"
              key={option.id}
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >{option.label}</button>)}
          </div>
        </header>

        {boardItems.length > 0 ? <div
          className="evidence-board-canvas"
          aria-label={locale === "en" ? "Evidence board" : "线索案件板"}
          style={{ "--board-card-scale": boardScale, "--board-card-w": `${boardLayout.cardW}%`, minHeight: boardLayout.canvasMinH } as CSSProperties}
        >
          <svg className="evidence-board-threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {completedBoardLinks.map((link) => {
              const from = boardPositions.get(link.from);
              const to = boardPositions.get(link.to);
              if (!from || !to) return null;
              const pinX = (point: BoardPlacement) => point.x + (boardLayout.cardW * boardScale) / 2;
              const pinY = (point: BoardPlacement) => point.y + (12.5 * boardScale * 100) / boardLayout.canvasMinH;
              return <line key={link.id} x1={pinX(from)} y1={pinY(from)} x2={pinX(to)} y2={pinY(to)} />;
            })}
          </svg>
          {boardItems.map((item, index) => {
            const placement = boardPositions.get(item.id) ?? boardLayout.positions[0]!;
            return <article
              key={item.id}
              className={`evidence-archive-card evidence-board-card evidence-paper-${(index % 7) + 1} ${item.kind} ${boardSelectionId === item.id ? "selected" : ""}`}
              style={{ "--board-x": `${placement.x}%`, "--board-y": `${placement.y}%`, "--board-rotation": `${placement.rotation}deg` } as CSSProperties}
              role="button"
              tabIndex={0}
              onClick={() => { setBoardSelectionId(item.id); openEvidence(item.id); }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setBoardSelectionId(item.id);
                  openEvidence(item.id);
                }
              }}
              aria-label={`${item.kind === "inference" ? (locale === "en" ? "Open inference" : "查看推论") : t("打开证物档案")}：${item.title}`}
            >
              <span className="evidence-card-pin" aria-hidden="true" />
              {item.kind === "clue" ? <button type="button" className="evidence-card-seal" onClick={(event) => { event.stopPropagation(); openEvidence(item.id); }} aria-label={`${locale === "en" ? "Open dossier" : "查看档案"}：${item.title}`}><Image src="/art/ui/butterfly-dossier-seal-v1.webp" alt="" width={32} height={32} sizes="32px" aria-hidden="true" /></button> : <span className="evidence-card-seal inference-seal" aria-hidden="true"><Check /></span>}
              <small>{item.kind === "inference" ? "CORE INFERENCE" : `${item.type.toUpperCase()} · NIGHT 0${item.chapter}`}</small>
              <b>{item.title}</b>
              <p>{item.summary}</p>
              <span className="evidence-card-action">{locale === "en" ? "Open file" : "打开档案"} <ChevronRight /></span>
              {item.kind === "clue" && receivedClueIds.includes(item.id) && <em>{t("好友送达")}</em>}
            </article>;
          })}
          <div className="board-size-control" role="group" aria-label={locale === "en" ? "Adjust clue card size" : "调节线索卡片大小"}>
            <button type="button" onClick={() => setBoardScale((value) => Math.max(BOARD_SCALE_MIN, +(value - BOARD_SCALE_STEP).toFixed(2)))} disabled={boardScale <= BOARD_SCALE_MIN} aria-label={locale === "en" ? "Shrink clue cards" : "缩小线索卡片"}><Minus size={14} /></button>
            <span aria-live="polite">{Math.round(boardScale * 100)}%</span>
            <button type="button" onClick={() => setBoardScale((value) => Math.min(BOARD_SCALE_MAX, +(value + BOARD_SCALE_STEP).toFixed(2)))} disabled={boardScale >= BOARD_SCALE_MAX} aria-label={locale === "en" ? "Enlarge clue cards" : "放大线索卡片"}><Plus size={14} /></button>
          </div>
        </div> : <div className="evidence-archive-empty">
          <Search />
          <h3>{filter === "inferences" && !normalizedQuery
            ? (locale === "en" ? "No filed inferences yet." : "还没有归档的推论")
            : archiveItems.length ? (locale === "en" ? "No files match this search." : "没有符合条件的档案") : t("案件板还很安静")}</h3>
          <p>{filter === "inferences" && !normalizedQuery
            ? (locale === "en" ? "Once the desk files its first inference, the clues it archived will be mirrored here." : "推理台整理出第一条推论后，参与归档的线索会同步一份到这里。")
            : archiveItems.length ? (locale === "en" ? "Try another keyword or evidence filter." : "换一个关键词或筛选条件再找找。") : t("完成第一夜调查，林渡带回的证物会出现在这里。")}</p>
        </div>}
      </section>

      <AnimatePresence>
      {synthesisPanelOpen && <>
        <motion.button
          className="board-synthesis-scrim"
          type="button"
          aria-label={locale === "en" ? "Close inference desk" : "关闭推理台"}
          onClick={() => setSynthesisPanelOpen(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />
        <motion.aside
          className="synthesis-desk board-synthesis-desk"
          aria-labelledby="synthesis-desk-title"
          role="dialog"
          aria-modal="true"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
        >
        <button className="board-synthesis-close" type="button" onClick={() => setSynthesisPanelOpen(false)} aria-label={locale === "en" ? "Close inference desk" : "关闭推理台"}><X /></button>
        <header>
          <small>INFERENCE DESK · {locale === "en" ? "SYNTHESIS" : "推理合成"}</small>
          <h3 id="synthesis-desk-title">{locale === "en" ? "Evidence ready to be filed" : "把已经到齐的证词整理成推论"}</h3>
          <p>{locale === "en" ? "The desk only reveals a recipe after every required file is already in your archive." : "只有配方所需的全部档案都已经取得，这里才会出现整理提示。"}</p>
          <div className="synthesis-progress"><span>{locale === "en" ? "Filed inferences" : "已归档推论"}</span><b>{synthesizedEvidenceIds.length}/{campaign.syntheses.length}</b></div>
        </header>

        <div className="ready-synthesis-list" aria-live="polite">
          {readySyntheses.length ? readySyntheses.map((synthesis) => <article className="ready-synthesis-card" key={synthesis.id}>
            <small>{locale === "en" ? "NEW INFERENCE READY" : "新的推论可以整理"}</small>
            <div className="synthesis-inputs">
              {synthesis.inputIds.map((inputId, index) => <span key={inputId}>
                {index > 0 && <i aria-hidden="true">+</i>}
                <button type="button" onClick={() => openEvidence(inputId)}>{evidenceTitles.get(inputId) ?? inputId}</button>
              </span>)}
            </div>
            <button className="synthesis-action" type="button" onClick={() => completeSynthesis(synthesis)}>
              <Sparkles /> <span>{locale === "en" ? "File this inference" : "整理这条推论"}</span><ArrowRight />
            </button>
          </article>) : <div className="synthesis-waiting">
            <FileText />
            <b>{synthesizedEvidenceIds.length === campaign.syntheses.length ? (locale === "en" ? "Every core inference has been filed." : "全部核心推论已经归档") : (locale === "en" ? "No complete evidence set yet." : "暂时没有到齐的证物组合")}</b>
            <p>{locale === "en" ? "Keep reading the recovered files. The desk will mark the next complete set without asking you to guess." : "继续调查和阅读已有档案。下一组证物到齐时，推理台会直接标出来，不需要穷举试错。"}</p>
          </div>}
        </div>

        {completedSyntheses.length > 0 && <section className="filed-inference-list">
          <small>{locale === "en" ? "FILED INFERENCES" : "已归档推论"}</small>
          {completedSyntheses.map((synthesis) => <button type="button" key={synthesis.id} onClick={() => openEvidence(synthesis.id)}>
            <Check /><span><small>CONFIRMED</small><b>{synthesis.title}</b></span><ChevronRight />
          </button>)}
        </section>}
        </motion.aside>
      </>}
      </AnimatePresence>
    </div>

    <details className="board-cipher-disclosure">
      <summary>
        <span><small>OPTIONAL ARCHIVE · {locale === "en" ? "OPTIONAL CIPHERS" : "可选解密"}</small><b>{locale === "en" ? "Open the night cipher desk" : "打开夜班密文台"}</b><p>{locale === "en" ? "Ciphers reveal extra archive notes. They add no reward, replace no inference, and change no ending condition." : "密文只展开补充旁注，不增加奖励、不替代推论合成，也不改变任何结局资格。"}</p></span>
        <ChevronRight />
      </summary>
      <CipherDesk />
    </details>

    <AnimatePresence>
      {dossierClue && !letterSynthesis && <ClueDossierDialog
        key={`dossier-${dossierClue.id}`}
        clue={dossierClue}
        received={receivedClueIds.includes(dossierClue.id)}
        syntheses={dossierSyntheses}
        detectiveName={campaign.presentation.detectiveName}
        onClose={() => setDossierClueId(null)}
        onShare={() => {
          setDossierClueId(null);
          setSharedClue(dossierClue);
        }}
      />}
    </AnimatePresence>

    <AnimatePresence>
      {letterSynthesis && <SynthesisRevealDialog
        key={`synthesis-${letterSynthesis.id}`}
        synthesis={letterSynthesis}
        inputTitles={letterSynthesis.inputIds.map((inputId) => evidenceTitles.get(inputId) ?? inputId)}
        onClose={() => setLetterSynthesisId(null)}
      />}
    </AnimatePresence>

    <AnimatePresence>{sharedClue && <ClueShareDialog clue={sharedClue} onClose={() => {
      setSharedClue(null);
      setDossierClueId(sharedClue.id);
    }} />}</AnimatePresence>
  </div>;
}

export function Collection() {
  const { unlockedCollectibleIds, nightSealIds, chapter, completedReports, preparationHistory, choiceHistory, growthHistory, societyHistory, correspondenceHistory, souvenirHistory, opportunityHistory } = useGameStore();
  const { campaign, localize, locale, t } = useI18n();
  const [mintingCollectible, setMintingCollectible] = useState<Collectible | null>(null);
  const [mintedCollectibleIds, setMintedCollectibleIds] = useState<string[]>([]);
  const [activeCollectionCategory, setActiveCollectionCategory] = useState<"evidence" | "journey" | "city" | "tarot" | "pocket">("evidence");
  const scrollSyncLockRef = useRef(false);
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
      icon: <FileCheck2Icon size={20} />,
      label: locale === "en" ? "Core evidence" : "核心物证",
      count: `${unlockedCollectibleIds.length}/${campaign.case.collectibles.length}`,
    },
    {
      id: "journey" as const,
      targetId: "collection-returned-nights",
      icon: <BookTextIcon size={20} />,
      label: locale === "en" ? "Returned nights" : "夜班归来",
      count: `${completedReports.length}/${nightCount}`,
    },
    {
      id: "city" as const,
      targetId: "collection-city-echoes",
      icon: <FileStackIcon size={20} />,
      label: locale === "en" ? "City echoes" : "城市回声",
      count: locale === "en" ? "4 shelves" : "4 组档案",
    },
    {
      id: "tarot" as const,
      targetId: "collection-night-omens",
      icon: <SparklesIcon size={20} />,
      label: locale === "en" ? "Night omens" : "夜兆牌桌",
      count: locale === "en" ? "1 daily" : "每日 1 张",
    },
    {
      id: "pocket" as const,
      targetId: "collection-pocket-drawer",
      icon: <KeyIcon size={20} />,
      label: locale === "en" ? "Pocket finds" : "口袋小物",
      count: `${Object.keys(souvenirHistory).length}/${nightCount}`,
    },
  ] as const;
  type CollectionCategoryId = typeof collectionCategories[number]["id"];
  useEffect(() => {
    const categoryIds: CollectionCategoryId[] = ["evidence", "journey", "city", "tarot", "pocket"];
    /** One stable activation line just under the sticky index bar. */
    const getProbeY = () => {
      const index = document.querySelector(".collection-index");
      if (index instanceof HTMLElement) return index.getBoundingClientRect().bottom + 28;
      return 168;
    };
    /**
     * Use only the first visual block of each category as its anchor.
     * That avoids jitter when scrolling through multiple city/journey shelves.
     */
    const readCategoryAnchors = () => {
      const firstTop = new Map<CollectionCategoryId, number>();
      for (const section of document.querySelectorAll<HTMLElement>("[data-collection-category]")) {
        const id = section.dataset.collectionCategory;
        if (id !== "evidence" && id !== "journey" && id !== "city" && id !== "tarot" && id !== "pocket") continue;
        const top = section.getBoundingClientRect().top;
        const prev = firstTop.get(id);
        if (prev === undefined || top < prev) firstTop.set(id, top);
      }
      return categoryIds
        .filter((id) => firstTop.has(id))
        .map((id) => ({ id, top: firstTop.get(id)! }))
        .sort((a, b) => a.top - b.top);
    };
    const readActiveCategory = (previous: CollectionCategoryId): CollectionCategoryId => {
      const anchors = readCategoryAnchors();
      if (!anchors.length) return previous;
      const probeY = getProbeY();
      // Hysteresis band: switch only after the next anchor clearly crosses the probe.
      const enterLine = probeY;
      const leaveLine = probeY + 56;
      let current = anchors[0].id;
      for (const anchor of anchors) {
        if (anchor.top <= enterLine) current = anchor.id;
      }
      if (current === previous) return previous;
      const previousAnchor = anchors.find((anchor) => anchor.id === previous);
      const nextAnchor = anchors.find((anchor) => anchor.id === current);
      if (!previousAnchor || !nextAnchor) return current;
      // Scrolling down into a later category.
      if (nextAnchor.top >= previousAnchor.top) {
        return nextAnchor.top <= enterLine ? current : previous;
      }
      // Scrolling up into an earlier category — require more clearance to leave.
      return previousAnchor.top > leaveLine ? current : previous;
    };
    let frame = 0;
    const syncFromScroll = () => {
      if (scrollSyncLockRef.current) return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (scrollSyncLockRef.current) return;
        setActiveCollectionCategory((prev) => readActiveCategory(prev));
      });
    };
    syncFromScroll();
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("resize", syncFromScroll);
    };
  }, []);
  const selectCollectionCategory = (id: CollectionCategoryId, targetId: string) => {
    setActiveCollectionCategory(id);
    scrollSyncLockRef.current = true;
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.setTimeout(() => {
      scrollSyncLockRef.current = false;
    }, 900);
  };
  const collectionSectionClass = (id: CollectionCategoryId) => `collection-section collection-section-${id}${activeCollectionCategory === id ? " is-active" : ""}`;
  return <div className="collection-page">
    <div className="page-title"><div><p className="eyebrow">NIGHT CABINET · {t("夜间陈列柜")}</p><h2>{locale === "en" ? <>Time did not vanish.<br />Nor did the city forget.</> : <>时间没有消失。<br />城市也没有忘记。</>}</h2></div><p>{locale === "en" ? `Every wait leaves a night seal, grows a plant, returns a postcard, and lets one of the underground societies remember how you worked. These are not scores, but ${nightCount} stretches of time that can be told again.` : `每次等待都会形成一枚夜印、长成一株植物、寄回一张明信片，也让某个地下社团记住你的做事方式。这里保存的不是分数，是 ${nightCount} 段可以重新讲述的时间。`}</p></div>
    <nav className="collection-index" aria-label={locale === "en" ? "Collection archive groups" : "收藏档案分类"}>
      <div className="collection-index-heading"><small>ARCHIVE INDEX · 05 DRAWERS</small><b>{locale === "en" ? "Choose what you came back to find." : "先看你这次回来想找什么。"}</b></div>
      <div className="collection-index-tabs">
        {collectionCategories.map((category) => <button type="button" aria-pressed={activeCollectionCategory === category.id} className={activeCollectionCategory === category.id ? "active" : ""} onClick={() => selectCollectionCategory(category.id, category.targetId)} key={category.id}>{category.icon}<span><b>{category.label}</b><small>{category.count}</small></span></button>)}
      </div>
    </nav>
    <section id="collection-city-echoes" data-collection-category="city" className={`city-favor-ledger ${collectionSectionClass("city")}`}>
      <div className="shelf-heading"><small>CITY REMEMBERS · {societyRecords.length}/{nightCount} NIGHTS</small><h3>{t("城市人情簿")}</h3></div>
      <p className="society-ledger-intro">{t("没有声望点数，也没有最优路线。城市只会依照你反复选择的调查姿态，更换称呼、礼数和愿意交给你的旁话。")}</p>
      <div className="society-ledger-grid">{citySocieties.map((source) => { const society = localize(source); const records = societyRecords.filter((record) => record.societyId === society.id); const latest = records.at(-1); return <article className={latest ? `society-ledger-card touched standing-${latest.standing}` : "society-ledger-card"} key={society.id}><SocietyCrest societyId={society.id} compact /><div className="society-ledger-copy"><small>{society.archiveName}</small><h3>{society.name}</h3><p className="society-concern">{t("关心")} · {society.concern}</p><blockquote>“{society.publicRumor}”</blockquote><div className="society-current-address"><small>{t("城里目前怎样称呼你")}</small><b>{latest ? t(getSocietyTitle(latest)) : t("尚未被正式称呼")}</b></div><p className="society-rule">{t("内部规矩")} · {society.privateRule}</p></div><div className="society-trace">{records.length ? records.map((record) => { const direction = getCampaignRouteDirection(campaign, record.chapter, record.choiceId); const replyRecord = correspondenceHistory[record.chapter]; return <div key={record.chapter}><span>{locale === "en" ? `Night 0${record.chapter}` : `夜 0${record.chapter}`}</span><b>{direction.dispatchTitle}</b><small>{replyRecord ? t("已回信") : t("未回信")}</small></div>; }) : <p>{t("尚无一条已归来的路线惊动他们。")}</p>}</div></article>; })}</div>
      {societyRecords.length > 0 && <div className="correspondence-ledger"><div className="correspondence-ledger-heading"><small>RETURNED ANSWERS · {correspondenceRecords.length}/{societyRecords.length}</small><h4>{t("问函与答复履历")}</h4><p>{t("没有寄出的答复也会保留为空白，不影响任何案件成果。")}</p></div><div className="correspondence-ledger-grid">{societyRecords.map((memory) => { const society = localize(citySocieties.find((item) => item.id === memory.societyId)!); const prompt = localize(getCorrespondencePrompt(memory)); const record = correspondenceHistory[memory.chapter]; const reply = record ? localize(getCorrespondenceReply(record)) : null; return <article className={reply ? "correspondence-ledger-entry answered" : "correspondence-ledger-entry"} key={memory.chapter}><small>{locale === "en" ? `Night 0${memory.chapter}` : `夜 0${memory.chapter}`} · {society.name}</small><h5>{prompt.question}</h5>{reply ? <><div><small>{t("你的答复")}</small><b>{reply.label}</b><p>{reply.summary}</p></div><blockquote><small>{t("留下的余波")}</small>{reply.echo}</blockquote></> : <div className="unanswered"><small>{t("未寄出的信封")}</small><b>{t("这一夜没有答复")}</b><p>{t("故事照常继续，城市没有替你的沉默扣除任何东西。")}</p></div>}</article>; })}</div></div>}
    </section>
    <TarotDraw active={activeCollectionCategory === "tarot"} />
    <section id="collection-pocket-drawer" data-collection-category="pocket" className={`pocket-drawer ${collectionSectionClass("pocket")}`}>
      <div className="shelf-heading"><small>UNASKED-FOR SOUVENIRS · {Object.keys(souvenirHistory).length}/{nightCount} NIGHTS</small><h3>{t("口袋抽屉")}</h3></div>
      <p className="pocket-drawer-intro">{locale === "en" ? `Directions and packed items lead ${campaign.presentation.detectiveName} through different corners of the city, but there is no exchange table and refreshing cannot reroll a find. Each object from these ${nightCount} nights is merely a piece of incidental testimony, never an advantage.` : `方向与随身物会让${campaign.presentation.detectiveName}经过不同的城市角落，但没有兑换表，也不能靠刷新重抽。${nightCount} 夜里出现的每件小物都只是一段旁证，不会替案件增加优势。`}</p>
  <div className="pocket-drawer-grid">{souvenirs.map((source) => { const souvenir = localize(source); const record = Object.values(souvenirHistory).find((entry) => entry?.souvenirId === souvenir.id); const art = getAsset(souvenir.assetId); const direction = record ? getCampaignRouteDirection(campaign, record.chapter, record.choiceId) : null; const preparation = record ? localize(getPreparation(record.preparationId)) : null; return <article className={record ? "pocket-object unlocked" : "pocket-object locked"} key={souvenir.id}><div className="pocket-object-art"><Image className={record ? undefined : "uncollected-art"} src={art.src} alt={record ? art.alt : ""} width={1024} height={1024} sizes="(max-width: 600px) calc(100vw - 28px), 370px" /></div><div className="pocket-object-copy"><small>{record ? `${locale === "en" ? "Night" : "夜"} 0${record.chapter} · ${souvenir.archiveName}` : t("尚未出现在口袋里")}</small><h4>{record ? souvenir.name : t("未归档小物")}</h4><p>{record ? souvenir.provenance : t("城市还没有决定把什么留给这一格抽屉。")}</p>{record && <blockquote>“{souvenir.fieldNote}”</blockquote>}{record && <footer><b>{direction?.dispatchTitle}</b><span>{preparation?.shortTitle} · {direction?.destination}</span></footer>}</div></article>; })}</div>
    </section>
    <section data-collection-category="city" className={`city-clipping-book ${collectionSectionClass("city")}`}>
      <header className="clipping-book-heading"><div><small>DAYLIGHT NOTICES · {Object.keys(opportunityHistory).length}/{opportunityDays.length} DAYS</small><h3>{t("城市剪报册")}</h3><p>{t("收起的纸也会留在那一天，但不会替你补写选择。这里没有行动点、分数或最优答复。")}</p></div></header>
      <div className="clipping-envelope-grid">{opportunityDays.map((day) => { const record = opportunityHistory[day]; const notice = record?.noticeId ? localize(getOpportunityNotice(record.noticeId)) : null; const response = record ? localize(getOpportunityResponse(record)) : null; return <article className={record ? "filed" : "pending"} key={day}><header className="clipping-paper-masthead"><div><small>{locale === "en" ? "THE CITY MORNING EDITION" : "雾灯城 · 城市晨刊"}</small><b>{locale === "en" ? "FOGLIGHT GAZETTE" : "雾灯城晨报"}</b></div><i>{locale === "en" ? `ISSUE 0${day}` : `第 0${day} 号`}</i></header><div className="clipping-envelope-copy"><small>DAY 0{day} · {record ? "FILED" : "NOT YET"}</small><h4>{record ? (notice?.title ?? t("三张纸没有拆开")) : t("门缝仍然空着")}</h4><div className="clipping-paper-columns"><p>{record ? (response?.result ?? t("你把三张纸全部收进抽屉。没有人因此失去什么，城市也没有替沉默补写答案。")) : t("完成前一夜后，城市会递来三张可以回应、也可以收起的纸。")}</p>{response ? <blockquote><small>{t("后来传回")}</small>“{response.echo}”</blockquote> : <aside><small>{locale === "en" ? "NEXT EDITION" : "等待刊印"}</small><span>{locale === "en" ? "No follow-up has reached the newsroom." : "后续消息尚未抵达编辑部。"}</span></aside>}</div><footer className="clipping-paper-folio"><span>{locale === "en" ? "FOGLIGHT CITY ARCHIVE" : "雾灯城公共档案 · 剪报存本"}</span><b>P. 0{day}</b></footer></div></article>; })}</div>
    </section>
    <section data-collection-category="city" className={`city-watch-ledger ${collectionSectionClass("city")}`}><div className="shelf-heading"><small>WHEN THE CITY RECEIVED THE SHIFT · {Object.keys(growthHistory).length}/{nightCount}</small><h3>{t("城市值更簿")}</h3></div><p>{locale === "en" ? `This records the hour at which you handed the assignment to ${campaign.presentation.detectiveName}. It changes only who remains in the street and which face the city reveals, never the case outcome.` : `这里保存你在什么时辰把任务交给${campaign.presentation.detectiveName}。它只改变当时仍在街上的人和城市愿意露出的侧面，不改变任何案件成果。`}</p><div>{campaign.case.chapters.map((entry) => { const record = growthHistory[entry.number]; if (!record) return <article className="watch-ledger-entry locked" key={entry.number}><small>NIGHT 0{entry.number} · UNFILED</small><h4>{t("时辰尚未归档")}</h4><p>{t("完成这一夜后，交接时刻会留下一段城市侧影。")}</p></article>; const watch = localize(getCityWatch(record.watchId ?? DEMO_CITY_WATCH_ID)); const echo = getCampaignWatchEcho(campaign, entry.number, watch.id); const direction = getCampaignRouteDirection(campaign, entry.number, record.choiceId); return <article className={`watch-ledger-entry watch-${watch.id}`} key={entry.number}><small>NIGHT 0{entry.number} · {watch.archiveLabel}</small><h4>{watch.label}</h4><span>{watch.window} · {direction.destination}</span><blockquote>“{echo.fieldNote}”</blockquote></article>; })}</div></section>
    <section data-collection-category="city" className={`sleep-gap-ledger ${collectionSectionClass("city")}`}><header className="sleep-gap-ledger-heading"><span aria-hidden="true"><Ear /></span><div><small>NOTES BETWEEN DREAMS · {wakeEchoCount}/{nightCount}</small><h3>{t("睡隙回声簿")}</h3><p>{t("短暂醒转可以留下声音，但不会让夜班结束。没有醒转的空白同样完整；这里没有需要补齐的收集率。")}</p></div></header><div className="sleep-gap-ledger-grid">{campaign.case.chapters.map((entry) => { const record = growthHistory[entry.number]; if (!record) return <article className="sleep-gap-entry locked" key={entry.number}><span className="sleep-gap-night">0{entry.number}</span><div><small>NIGHT 0{entry.number} · UNRETURNED</small><h4>{t("这一夜尚未归来")}</h4><p>{t("档案没有替未来的睡意预写内容。")}</p></div></article>; if (!record.wakeEchoId) return <article className="sleep-gap-entry quiet" key={entry.number}><span className="sleep-gap-night">0{entry.number}</span><div><small>NIGHT 0{entry.number} · UNDISTURBED</small><h4>{t("夜印里没有裂缝")}</h4><p>{t("这一夜没有记录醒转。空白不是遗漏，也不比回声少任何成果。")}</p></div></article>; const echo = getCampaignWakeEchoById(campaign, record.wakeEchoId); return <article className="sleep-gap-entry returned" key={entry.number}><span className="sleep-gap-night">0{entry.number}</span><div><small>NIGHT 0{entry.number} · ONE BRIEF WAKING</small><h4>{echo.title}</h4><p>{echo.sound}</p><blockquote>“{echo.fieldNote}”</blockquote></div></article>; })}</div></section>
    <section data-collection-category="journey" className={`night-greenhouse ${collectionSectionClass("journey")}`}>
      <div className="shelf-heading"><small>FOGLIGHT GREENHOUSE · {Object.keys(growthHistory).length}/{nightCount}</small><h3>{t("雾灯温室")}</h3></div>
      <p className="greenhouse-intro">{t("提前醒来不会让任何植物枯死。它只会以更小、更奇异的形态，完整保存那一夜。")}</p>
      <div className="greenhouse-grid">{campaign.botanicals.map((botanical) => { const record = growthHistory[botanical.chapter]; const art = getAsset(botanical.assetId); const direction = record ? getCampaignRouteDirection(campaign, botanical.chapter, record.choiceId) : null; const preparation = record ? localize(getPreparation(record.preparationId)) : null; const watch = record ? localize(getCityWatch(record.watchId ?? DEMO_CITY_WATCH_ID)) : null; return <article className={record ? `greenhouse-specimen unlocked quality-${record.quality}` : "greenhouse-specimen locked"} key={botanical.id}>{record ? <BotanicalSpecimen chapter={botanical.chapter} compact /> : <div className="greenhouse-locked"><Image className="uncollected-art" src={art.src} alt="" width={256} height={384} /></div>}<div className="greenhouse-copy"><small>{record ? `${watch?.label} · ${t(qualityCopy[record.quality].label)} · ${formatSleepDuration(record.durationMinutes, locale)}` : "SEED DORMANT"}</small><h3>{record ? botanical.name : t("种核尚未苏醒")}</h3><p>{record ? botanical.specimenNote : t("完成这一夜，无论睡了多久，温室都会保存一株完整植物。")}</p>{record && <span><b>{direction?.dispatchTitle}</b>{preparation?.shortTitle} · {botanical.district}</span>}</div></article>; })}</div>
    </section>
  <section id="collection-returned-nights" data-collection-category="journey" className={`journey-album ${collectionSectionClass("journey")}`}><div className="shelf-heading"><small>RETURNED POSTCARDS · {completedReports.length}/{nightCount}</small><h3>{locale === "en" ? `${nightCount} nights returned by ${campaign.presentation.cityName}` : `${campaign.presentation.cityName}寄回的 ${nightCount} 个夜晚`}</h3></div><div className="journey-postcard-grid">{campaign.postcards.map((postcard) => { const unlocked = completedReports.includes(postcard.chapter); const preparationId = preparationHistory[postcard.chapter] ?? "side-lamp"; const preparation = localize(getPreparation(preparationId)); const direction = getCampaignRouteDirection(campaign, postcard.chapter, choiceHistory[postcard.chapter] ?? ""); const art = getAsset(postcard.assetId); return <article className={unlocked ? "journey-postcard unlocked" : "journey-postcard locked"} key={postcard.id}><div className="journey-postcard-image"><Image className={unlocked ? undefined : "uncollected-art"} src={art.src} alt={unlocked ? art.alt : ""} width={768} height={512} sizes="(max-width: 900px) calc(100vw - 28px), 570px" /></div><div className="journey-postcard-copy"><small>{unlocked ? postcard.location : "ROUTE NOT RETURNED"}</small><h3>{unlocked ? postcard.title : t("尚未寄回")}</h3><p>{unlocked ? postcard.message : locale === "en" ? `Complete this night's handoff and ${campaign.presentation.detectiveName} will send a postcard home from the city.` : `完成这一夜的交接，${campaign.presentation.detectiveName}会从城市里寄回一张明信片。`}</p>{unlocked && <div className="journey-route-history"><small>CHOSEN ROUTE</small><b>{direction.dispatchTitle} · {direction.destination}</b><p>{direction.returnLetter}</p></div>}{unlocked && <span><b>{preparation?.shortTitle ?? t("随身物")}</b>{postcard.preparationNotes[preparationId]}</span>}</div></article>; })}</div></section>
  <section data-collection-category="journey" className={`night-seal-shelf ${collectionSectionClass("journey")}`}><div className="shelf-heading"><small>NIGHT SEALS · {nightSealIds.length}/{nightCount}</small><h3>{locale === "en" ? `${nightCount} night seals` : `${nightCount} 夜印记`}</h3></div><div className="night-seal-row">{campaign.case.chapters.map((entry) => { const art = getAsset(getCampaignNightSealAssetId(campaign, entry.number)); const unlocked = nightSealIds.includes(entry.number); return <div className={unlocked ? "night-seal unlocked" : "night-seal locked"} key={entry.number}><Image src={art.src} alt={unlocked ? art.alt : t("尚未形成的夜印")} width={160} height={160} sizes="160px" /><span>{locale === "en" ? "NIGHT" : "夜"} 0{entry.number}</span><b>{unlocked ? entry.title : t("尚未成形")}</b></div>; })}</div></section>
    <section id="collection-core-evidence" data-collection-category="evidence" className={`collection-evidence-cabinet ${collectionSectionClass("evidence")}`}>
      <div className="shelf-heading"><small>CORE EVIDENCE · {unlockedCollectibleIds.length}/{campaign.case.collectibles.length} FILED</small><h3>{locale === "en" ? "Evidence brought back to the agency" : "带回事务所的核心物证"}</h3></div>
      <p className="collection-evidence-intro">{locale === "en" ? "These are the objects that can testify in the case. Open an unlocked file here to keep it local or place an optional receipt in the Injective archive." : "这些物件会在案件里作证。已解锁的档案可以留在本机，也可以选择在 Injective 链上留下一张公开回执。"}</p>
      <div className="collection-grid">{campaign.case.collectibles.map((item, index) => { const unlocked = unlockedCollectibleIds.includes(item.id); const revealed = unlocked && chapter >= Math.min(finalChapter, item.chapter + 2); const minted = mintedCollectibleIds.includes(item.id); const art = getAsset(item.assetId); return <motion.article whileHover={unlocked ? { y: -5, rotate: index % 2 ? .3 : -.3 } : {}} key={item.id} className={`collectible-card ${unlocked ? "unlocked" : "locked"}`}><div className="item-number">0{index + 1}</div><div className="item-art"><Image src={art.src} alt={unlocked ? art.alt : t("尚未发现的物品")} width={438} height={438} sizes="(max-width: 900px) calc(100vw - 70px), 255px" /></div><div className="item-meta"><small>{unlocked ? `${item.district} · ${item.rarity}` : t("尚未发现")}</small><h3>{unlocked ? item.title : t("未归档物品")}</h3><p>{unlocked ? (revealed ? item.revealedDescription : item.surfaceDescription) : t("下一次夜间调查，也许会让它出现在林渡的口袋里。")}</p>{revealed && <Seal>{t("隐藏含义已揭示")}</Seal>}{unlocked && <button className={minted ? "collectible-mint-trigger minted" : "collectible-mint-trigger"} type="button" onClick={() => setMintingCollectible(item)}>{minted ? <FileCheck2 /> : <Sparkles />}<span>{minted ? t("此浏览器已有链上回执") : t("封进 Injective 链上档案")}</span></button>}</div></motion.article>; })}</div>
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
  <div className="archive-folders">{campaign.case.chapters.map((chapter) => { const complete = completedReports.includes(chapter.number); const sealArt = getAsset(getCampaignNightSealAssetId(campaign, chapter.number)); return <PaperCard key={chapter.number} className={complete ? "folder complete" : "folder"}><span className="folder-tab">NIGHT 0{chapter.number}</span><small>{complete ? "REPORT FILED" : "SEALED"}</small><h3>{chapter.title}</h3><p>{chapter.subtitle}</p><div>{complete ? <><Check /> {t("调查完成")}</> : <><Image className="folder-locked-art" src={sealArt.src} alt="" width={34} height={34} sizes="34px" /> {t("尚未开启")}</>}</div></PaperCard>; })}</div>
  <section className="district-atlas"><div className="shelf-heading"><small>FOGLIGHT ATLAS · {visitedDistricts.length}/{campaign.districts.length} DISTRICTS</small><h3>{locale === "en" ? `${campaign.presentation.cityName} District Atlas` : `${campaign.presentation.cityName}分区志`}</h3></div><p>{locale === "en" ? `Maps record roads, but districts are known by their rules. Only after ${campaign.presentation.detectiveName} has truly walked through a place will the archive permit it a name.` : `地图记录道路，城区却靠规矩辨认。${campaign.presentation.detectiveName}真正走过一块地方以后，档案才允许它获得名字。`}</p><div>{campaign.districts.map((district) => { const unlocked = completedReports.includes(district.introducedChapter); const art = getAsset(district.assetId); return <article className={unlocked ? "district-entry unlocked" : "district-entry locked"} key={district.id}><div className="district-art"><Image className={unlocked ? undefined : "uncollected-art"} src={art.src} alt={unlocked ? art.alt : ""} width={1200} height={800} sizes="(max-width: 600px) calc(100vw - 28px), 380px" /></div><div className="district-copy"><small>{unlocked ? district.archiveName : "DISTRICT FILE · SEALED"}</small><h4>{unlocked ? district.name : t("城区尚未归档")}</h4><b>{unlocked ? district.subtitle : locale === "en" ? `Opens after Night ${district.introducedChapter}` : `完成第 ${district.introducedChapter} 夜后展开`}</b>{unlocked && <><p><span>{t("公共说法")}</span>{district.publicVersion}</p><blockquote><span>{t("城里实际遵守")}</span>{district.cityRule}</blockquote><footer>{district.landmarks.map((landmark) => <i key={landmark}>{landmark}</i>)}</footer></>}</div></article>; })}</div></section>
  {campaign.characters.length > 0 && <section className="person-dossiers"><div className="shelf-heading"><small>PERSONS OF INTEREST · {encounteredCharacters.length}/{campaign.characters.length}</small><h3>{t("相关人物")}</h3></div><p>{t("城市传闻不等于证词。只有已经带回的线索，才能让档案展开第二层。")}</p><div>{campaign.characters.map((character) => { const encountered = completedReports.includes(character.encounterChapter); const revealed = encountered && isCharacterRevealed(character, unlockedClueIds); const art = getAsset(character.assetId); return <article className={encountered ? "person-dossier encountered" : "person-dossier locked"} key={character.id}><div className="person-portrait"><Image className={encountered ? undefined : "uncollected-art"} src={art.src} alt={encountered ? art.alt : ""} width={1024} height={1280} sizes="(max-width: 600px) calc(100vw - 28px), 245px" /></div><div className="person-dossier-copy"><small>{encountered ? character.archiveName : `PERSON 0${character.encounterChapter} · SEALED`}</small><h4>{encountered ? character.name : t("尚未见面")}</h4><b>{encountered ? `${character.role} · ${character.district}` : t("完成对应夜班后归档")}</b><p>{encountered ? `“${character.publicRumor}”` : t("这份档案还没有获得姓名。")}</p>{encountered && <div><small>{t("已知事实")}</small>{character.knownFact}</div>}{revealed && <blockquote><small>{t("保留意见已展开")}</small>{character.withheld}</blockquote>}{encountered && !revealed && <span><FileText /> {t("仍有部分说法需要现有证物互相作证")}</span>}</div></article>; })}</div></section>}
  </div>;
}

export function Ending({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const { unlockedClueIds, receivedClueIds, unlockedCollectibleIds, synthesizedEvidenceIds, correspondenceHistory, completedReports, preparationHistory, choiceHistory, growthHistory, souvenirHistory, endingId, chooseEnding, reset } = useGameStore();
  const { campaign, localize, locale, t } = useI18n();
  const nightCount = campaign.case.chapters.length;
  const [reviewingArchive, setReviewingArchive] = useState(false);
  const earnedClueIds = unlockedClueIds.filter((clueId) => !receivedClueIds.includes(clueId));
  const trueReady = canUnlockTrueEnding({ unlockedClueIds: earnedClueIds, unlockedCollectibleIds, synthesizedEvidenceIds }, campaign.rules);
  const dominantStance = getDominantCorrespondenceStance(correspondenceHistory);
  const cityAfterword = localize(dominantStance ? correspondencePostures[dominantStance] : { title: "未寄出的答复", note: "你没有让任何社团替你固定立场。雾灯城把那些空信封也归了档：沉默不是失败，只是一种尚未交出的决定。" });
  const icons: Record<EndingId, ReactNode> = { public: <FileText />, protect: <KeyRound />, return: <Flower2 /> };
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
    <Image className="ending-background" src={endingArt.src} alt={endingArt.alt} fill preload sizes="100vw" /><div className="ending-light" />
    <Seal>{selected.archiveLabel}</Seal><h1>{selected.title}</h1><p className="ending-theme">{selected.theme}</p>
    <PaperCard className="ending-letter"><small>FINAL LETTER · {campaign.presentation.detectiveName}{locale === "en" ? "" : "终函"}</small><p>{selected.result}</p><hr /><blockquote>“{selected.detectiveLetter}”</blockquote><div className="city-afterword"><small>CITY POSTSCRIPT · {t("与结局资格无关")}</small><b>{cityAfterword.title}</b><p>{cityAfterword.note}</p></div></PaperCard>
    <section className="case-closing-ledger"><div className="ending-section-heading"><small>NIGHTS RETURNED · {journeyNights.length}/{nightCount}</small><h2>{locale === "en" ? `Ledger of ${nightCount} returned nights` : `${nightCount} 夜归来总账`}</h2><p>{locale === "en" ? `No score is kept here. It preserves only the directions you gave ${campaign.presentation.detectiveName}, the plants grown by time, and the small things the city slipped into a pocket.` : `这里不计算分数。它只保存你交给${campaign.presentation.detectiveName}的方向、时间长成的植物，以及城市擅自塞进口袋的小东西。`}</p></div><div className="ending-night-grid">{journeyNights.map(({ chapter, postcard, botanical, direction, preparation, growth, souvenir }) => { const postcardArt = getAsset(postcard.assetId); const sealArt = getAsset(getCampaignNightSealAssetId(campaign, chapter.number)); const watch = growth ? localize(getCityWatch(growth.watchId ?? DEMO_CITY_WATCH_ID)) : null; return <article className="ending-night-entry" key={chapter.number}><div className="ending-night-art"><Image src={postcardArt.src} alt={postcardArt.alt} fill sizes="(max-width: 600px) 100vw, 220px" /><Image className="ending-night-seal" src={sealArt.src} alt={sealArt.alt} width={74} height={74} sizes="74px" /></div><div><small>NIGHT 0{chapter.number} · {postcard.location}</small><h3>{chapter.title}</h3><p>{direction.dispatchTitle} · {direction.destination}</p><dl><div><dt>{t("随身")}</dt><dd>{preparation?.shortTitle ?? t("未记录")}</dd></div><div><dt>{t("时间长成")}</dt><dd>{botanical.name}</dd></div><div><dt>{t("口袋带回")}</dt><dd>{souvenir?.name ?? t("这一夜只带回了雨")}</dd></div><div><dt>{t("夜班留痕")}</dt><dd>{growth ? `${watch?.label ?? t("夜半时分")} · ${t(qualityCopy[growth.quality].label)} · ${formatSleepDuration(growth.durationMinutes, locale)}${growth.wakeEchoId ? ` · ${t("一次睡隙")}` : ""}` : t("已归档")}</dd></div></dl></div></article>; })}</div></section>
    <section className="ending-evidence-ledger"><div className="ending-section-heading"><small>RECOVERED EVIDENCE · {recoveredEvidence.length}/{campaign.case.collectibles.length}</small><h2>{t("带回事务所的核心物证")}</h2><p>{t("只陈列这个存档真正找到的东西。没有补齐的格子不会在结案时替你伪造。")}</p></div><div>{recoveredEvidence.map((item) => { const art = getAsset(item.assetId); return <article className="ending-evidence-item" key={item.id}><Image src={art.src} alt={art.alt} width={160} height={160} sizes="82px" /><span><small>{item.district}</small><b>{item.title}</b><p>{item.revealedDescription}</p></span></article>; })}</div></section>
    <h2 className="ending-closing-line">{selected.closingLine}</h2><p className="ending-refrain">{campaign.presentation.closingRefrain}</p>
    <div className="ending-actions"><button type="button" onClick={() => setReviewingArchive(true)}><BookOpen /> {t("重看档案")}</button><button type="button" onClick={onOpenLibrary}><KeyRound /> {t("选择其他案件")}</button><button type="button" onClick={reset}><RotateCcw /> {t("重新调查")}</button></div>
  </main>;

  return <main className="ending-choice"><Image className="ending-background" src={endingArt.src} alt={endingArt.alt} fill preload sizes="100vw" /><div className="page-title"><div><p className="eyebrow">FINAL DECISION · CASE {campaign.presentation.archiveNumber}</p><h2>{campaign.presentation.endingQuestion}</h2></div><p>{campaign.presentation.endingPrompt}</p></div><div className="ending-cards">{campaign.endings.map((ending) => { const locked = ending.id === campaign.rules.trueEndingId && !trueReady; return <button key={ending.id} disabled={locked} onClick={() => chooseEnding(ending.id)} className={ending.id === campaign.rules.trueEndingId ? "true-ending" : ""}><span>{icons[ending.id]}</span><small>{locked ? locale === "en" ? `Still needed: ${Math.max(0, campaign.rules.requiredClueCount - earnedClueIds.length)} personally recovered clues / ${Math.max(0, campaign.rules.requiredSynthesisCount - synthesizedEvidenceIds.length)} inferences` : `尚需 ${Math.max(0, campaign.rules.requiredClueCount - earnedClueIds.length)} 条亲自带回的线索 / ${Math.max(0, campaign.rules.requiredSynthesisCount - synthesizedEvidenceIds.length)} 条合成推论` : t("可选择")}</small><h3>{ending.title}</h3><p>{ending.theme}</p><ArrowRight /></button>; })}</div></main>;
}
