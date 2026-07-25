"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { History, MoonStar, Sparkles } from "lucide-react";
import {
  getLocalDateKey,
  getLocalizedTarotText,
  getTarotCard,
  getTarotRecordKey,
  type TarotDrawRecord,
} from "@/src/content/tarot";
import { useTarotStore } from "@/src/stores/tarot-store";
import { useI18n } from "@/src/i18n/provider";

export function TarotDraw({ active }: { active: boolean }) {
  const { campaign, locale } = useI18n();
  const { records, hydrated, drawDaily } = useTarotStore();
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => new Date());
  const [concealResult, setConcealResult] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const dateKey = getLocalDateKey(now);
  const currentRecord = hydrated ? records[getTarotRecordKey(campaign.id, dateKey)] : undefined;
  const currentCard = currentRecord ? getTarotCard(currentRecord.cardId) : undefined;
  const copy = locale === "en" ? englishCopy : chineseCopy;

  const history = useMemo(() => Object.values(records)
    .filter((record) => record.campaignId === campaign.id)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.drawnAt.localeCompare(a.drawnAt))
    .slice(0, 7), [campaign.id, records]);

  useEffect(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 50);
    const timer = window.setTimeout(() => setNow(new Date()), Math.max(1000, nextMidnight.getTime() - Date.now()));
    return () => window.clearTimeout(timer);
  }, [dateKey]);

  const draw = () => {
    if (!hydrated || currentRecord || drawing) return;
    setDrawing(true);
    setConcealResult(true);
    drawDaily(campaign.id, now);
    window.setTimeout(() => {
      setConcealResult(false);
      setDrawing(false);
    }, reduceMotion ? 0 : 720);
  };

  const showResult = Boolean(currentRecord && currentCard && !concealResult);
  const reading = currentRecord && currentCard
    ? getLocalizedTarotText(currentRecord.orientation === "upright" ? currentCard.upright : currentCard.reversed, locale)
    : "";

  return (
    <section id="collection-night-omens" data-collection-category="tarot" className={`night-omen-table collection-section collection-section-tarot${active ? " is-active" : ""}`}>
      <header className="night-omen-heading">
        <span aria-hidden="true"><MoonStar /></span>
        <div>
          <small>NIGHT OMEN TABLE · ONE CARD PER LOCAL DAY</small>
          <h3>{copy.title}</h3>
          <p>{copy.intro}</p>
        </div>
      </header>

      <div className="night-omen-layout">
        <div className="night-omen-stage">
          <div className={`tarot-card-shell${drawing ? " is-drawing" : ""}${showResult ? " is-revealed" : ""}`} aria-live="polite">
            {showResult ? <TarotCardFace record={currentRecord!} locale={locale} /> : <TarotCardBack label={drawing ? copy.drawing : copy.cardBack} />}
          </div>
          <div className="night-omen-action">
            <small>{dateKey} · {copy.deviceTime}</small>
            <button type="button" disabled={!hydrated || Boolean(currentRecord) || drawing} onClick={draw}>
              <Sparkles />
              <span>{!hydrated ? copy.loading : drawing ? copy.drawing : currentRecord ? copy.drawn : copy.draw}</span>
            </button>
            <p>{currentRecord ? copy.tomorrow : copy.beforeDraw}</p>
          </div>
        </div>

        <article className={showResult ? "night-omen-reading revealed" : "night-omen-reading"}>
          {showResult && currentCard && currentRecord ? <>
            <small>{copy.todayReading} · {currentRecord.orientation === "upright" ? copy.upright : copy.reversed}</small>
            <h4>{getLocalizedTarotText(currentCard.title, locale)}</h4>
            <b>{getLocalizedTarotText(currentCard.archiveName, locale)}</b>
            <p>{reading}</p>
            <blockquote><span>{copy.question}</span>“{getLocalizedTarotText(currentCard.prompt, locale)}”</blockquote>
            <footer>{copy.guardrail}</footer>
          </> : <>
            <small>{copy.sealed}</small>
            <h4>{copy.waitingTitle}</h4>
            <p>{copy.waiting}</p>
            <ul>
              <li>{copy.ruleDaily}</li>
              <li>{copy.ruleLocal}</li>
              <li>{copy.ruleNoEffect}</li>
            </ul>
          </>}
        </article>
      </div>

      <div className="night-omen-history">
        <div><History /><span><small>PREVIOUS OMENS</small><b>{copy.history}</b></span></div>
        {hydrated && history.length ? <ol>{history.map((record) => <TarotHistoryCard record={record} locale={locale} key={getTarotRecordKey(record.campaignId, record.dateKey)} />)}</ol> : <p>{hydrated ? copy.noHistory : copy.loading}</p>}
      </div>
    </section>
  );
}

function TarotCardFace({ record, locale }: { record: TarotDrawRecord; locale: string }) {
  const card = getTarotCard(record.cardId);
  return <div className={`tarot-card-face orientation-${record.orientation}`}>
    <div className="tarot-card-number"><span>{card.number}</span><MoonStar aria-hidden="true" /></div>
    <div className="tarot-card-art">
      <Image src={card.assetSrc} alt={getLocalizedTarotText(card.assetAlt, locale)} fill sizes="(max-width: 600px) 68vw, 300px" />
    </div>
    <div className="tarot-card-name"><small>FOGLIGHT ARCANA</small><b>{getLocalizedTarotText(card.title, locale)}</b><span>{record.orientation === "upright" ? "UPRIGHT" : "REVERSED"}</span></div>
  </div>;
}

function TarotCardBack({ label }: { label: string }) {
  return <div className="tarot-card-back" aria-label={label}>
    <div className="tarot-back-frame"><span /><i /><MoonStar aria-hidden="true" /><i /><span /></div>
    <small>FOGLIGHT NIGHT OMENS</small>
    <b>{label}</b>
  </div>;
}

function TarotHistoryCard({ record, locale }: { record: TarotDrawRecord; locale: string }) {
  const card = getTarotCard(record.cardId);
  return <li>
    <div className={`tarot-history-art orientation-${record.orientation}`}><Image src={card.assetSrc} alt="" fill sizes="72px" /></div>
    <span><small>{record.dateKey} · {record.orientation === "upright" ? "UPRIGHT" : "REVERSED"}</small><b>{getLocalizedTarotText(card.title, locale)}</b></span>
  </li>;
}

const chineseCopy = {
  title: "雾灯夜兆牌桌",
  intro: "每天从九张原创夜兆牌中翻开一张。它只把你已经带来的疑问换一种角度摆回桌面，不预言结局，也不替调查增加优势。",
  cardBack: "牌面仍朝下",
  loading: "读取本地牌桌…",
  drawing: "正在翻开夜兆…",
  drawn: "今日夜兆已归档",
  draw: "抽取今日夜兆",
  deviceTime: "按本机自然日",
  tomorrow: "下一次抽取在本机时间明日 00:00 后开放。刷新页面不会重抽。",
  beforeDraw: "确认后，本案件今天的牌面与正逆位将固定保存在这台设备。",
  todayReading: "今日解读",
  upright: "正位",
  reversed: "逆位",
  question: "留给今天的问题",
  guardrail: "夜兆不改变线索、结局、收藏、睡眠评价或城市关系。",
  sealed: "DAILY DRAW · SEALED",
  waitingTitle: "今天的牌还没有翻开",
  waiting: "这不是奖励池，也没有稀有度。抽取只形成一段可回看的文学旁注。",
  ruleDaily: "每个案件每个本地自然日一张",
  ruleLocal: "结果只保存在当前浏览器",
  ruleNoEffect: "不影响案件与任何游戏成果",
  history: "过去七次夜兆",
  noHistory: "还没有已归档的夜兆。第一张牌会从今天开始留下日期。",
};

const englishCopy = {
  title: "Foglight Night Omen Table",
  intro: "Turn one of nine original omen cards each day. It returns your own question from another angle; it predicts no ending and grants no investigative advantage.",
  cardBack: "The card remains face down",
  loading: "Reading the local table…",
  drawing: "Turning the night omen…",
  drawn: "Today’s omen is filed",
  draw: "Draw today’s omen",
  deviceTime: "device-local date",
  tomorrow: "The next draw opens after 00:00 tomorrow on this device. Refreshing cannot redraw.",
  beforeDraw: "Once confirmed, today’s card and orientation for this case remain fixed on this device.",
  todayReading: "Today’s reading",
  upright: "Upright",
  reversed: "Reversed",
  question: "Question for today",
  guardrail: "Omens never change clues, endings, keepsakes, sleep assessment, or city relationships.",
  sealed: "DAILY DRAW · SEALED",
  waitingTitle: "Today’s card remains unturned",
  waiting: "This is not a reward pool and has no rarity. A draw leaves only a literary marginal note.",
  ruleDaily: "One card per case per local calendar day",
  ruleLocal: "Results remain in this browser only",
  ruleNoEffect: "No effect on the case or game outcomes",
  history: "The previous seven omens",
  noHistory: "No omen has been filed yet. The first card will begin today’s dated record.",
};
