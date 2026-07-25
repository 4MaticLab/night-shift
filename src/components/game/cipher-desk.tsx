"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Cable, Check, ChevronRight, KeyRound, Lightbulb, LockKeyhole, RadioTower, RotateCcw, X } from "lucide-react";
import { getCampaignCipherDesk, isCipherUnlocked } from "@/src/content/ciphers";
import { useI18n } from "@/src/i18n/provider";
import { useGameStore } from "@/src/stores/game-store";
import { CipherDialControl } from "./cipher-dial";
import { CipherNotebook } from "./cipher-notebook";

export function CipherDesk() {
  const { campaign, locale, localize, t } = useI18n();
  const { unlockedClueIds, solvedCipherIds, solveCipher, solveCipherRelay } = useGameStore();
  const desk = useMemo(() => {
    const definition = getCampaignCipherDesk(campaign.id);
    return definition ? localize(definition) : undefined;
  }, [campaign.id, localize]);
  const challenges = desk?.challenges ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, "incorrect" | "solved">>({});
  const [dialValues, setDialValues] = useState<Record<string, number>>({});
  const [relaySequences, setRelaySequences] = useState<Record<string, string[]>>({});
  const [relayFeedback, setRelayFeedback] = useState<Record<string, "incorrect">>({});

  if (!desk || !challenges.length) return null;

  const solvedCount = challenges.filter((challenge) => solvedCipherIds.includes(challenge.id)).length;
  const unlockedCount = challenges.filter((challenge) => isCipherUnlocked(challenge, unlockedClueIds)).length;
  const coreCompleted = solvedCount === challenges.length;
  const relaySolved = solvedCipherIds.includes(desk.relay.id);
  const completed = coreCompleted && relaySolved;
  const relaySequence = relaySequences[desk.relay.id] ?? [];

  const submit = (event: FormEvent<HTMLFormElement>, challengeId: string) => {
    event.preventDefault();
    const result = solveCipher(challengeId, answers[challengeId] ?? "");
    if (result === "solved" || result === "already-solved") {
      setFeedback((current) => ({ ...current, [challengeId]: "solved" }));
      return;
    }
    if (result === "incorrect") setFeedback((current) => ({ ...current, [challengeId]: "incorrect" }));
  };

  const submitAnswer = (challengeId: string, answer: string) => {
    const result = solveCipher(challengeId, answer);
    if (result === "solved" || result === "already-solved") {
      setFeedback((current) => ({ ...current, [challengeId]: "solved" }));
      return;
    }
    if (result === "incorrect") setFeedback((current) => ({ ...current, [challengeId]: "incorrect" }));
  };

  const addRelayFragment = (fragmentId: string) => {
    if (relaySequence.includes(fragmentId) || relaySequence.length >= desk.relay.fragments.length) return;
    setRelaySequences((current) => ({ ...current, [desk.relay.id]: [...relaySequence, fragmentId] }));
    setRelayFeedback((current) => { const next = { ...current }; delete next[desk.relay.id]; return next; });
  };

  const removeRelayFragment = (fragmentId: string) => {
    setRelaySequences((current) => ({ ...current, [desk.relay.id]: relaySequence.filter((id) => id !== fragmentId) }));
    setRelayFeedback((current) => { const next = { ...current }; delete next[desk.relay.id]; return next; });
  };

  const resetRelay = () => {
    setRelaySequences((current) => ({ ...current, [desk.relay.id]: [] }));
    setRelayFeedback((current) => { const next = { ...current }; delete next[desk.relay.id]; return next; });
  };

  const submitRelay = () => {
    const result = solveCipherRelay(desk.relay.id, relaySequence);
    if (result === "solved" || result === "already-solved") return;
    if (result === "incorrect") setRelayFeedback((current) => ({ ...current, [desk.relay.id]: "incorrect" }));
  };

  return <section className={`cipher-desk ${completed ? "complete" : ""}`} aria-labelledby="cipher-desk-title">
    <header className="cipher-desk-heading">
      <div><small>{desk.archiveLabel}</small><h3 id="cipher-desk-title">{desk.title}</h3><p>{desk.description}</p></div>
      <span><b>{solvedCount}/{challenges.length}</b><small>{t("已解密")}</small></span>
    </header>

    <div className="cipher-progress" aria-label={locale === "en" ? `${unlockedCount} cipher levels available` : `${unlockedCount} 个密文关卡已开放`}>
      {challenges.map((challenge) => {
        const unlocked = isCipherUnlocked(challenge, unlockedClueIds);
        const solved = solvedCipherIds.includes(challenge.id);
        return <i className={solved ? "solved" : unlocked ? "unlocked" : "locked"} key={challenge.id}><span>{challenge.order}</span></i>;
      })}
    </div>

    <CipherNotebook key={campaign.id} />

    <div className="cipher-levels">
      {challenges.map((challenge) => {
        const unlocked = isCipherUnlocked(challenge, unlockedClueIds);
        const solved = solvedCipherIds.includes(challenge.id);
        const requiredClues = challenge.requiredClueIds.map((clueId) => campaign.case.clues.find((clue) => clue.id === clueId)?.title).filter(Boolean);
        return <article className={`cipher-level ${solved ? "solved" : unlocked ? "unlocked" : "locked"}`} key={challenge.id}>
          <div className="cipher-level-index"><span>0{challenge.order}</span>{solved ? <Check /> : unlocked ? <KeyRound /> : <LockKeyhole />}</div>
          <div className="cipher-level-body">
            <small>{challenge.archiveLabel}</small>
            <h4>{challenge.title}</h4>
            <p>{challenge.subtitle}</p>

            {!unlocked && <div className="cipher-locked-note"><LockKeyhole /><span><b>{t("等待证物归档")}</b>{requiredClues.join(" · ")}</span></div>}

            {unlocked && <>
              <div className="cipher-strip" aria-label={challenge.cipherLabel}><small>{challenge.cipherLabel}</small><div>{challenge.cipherTokens.map((token, index) => <code key={`${token}-${index}`}>{token}</code>)}</div></div>
              <p className="cipher-instruction">{challenge.instruction}</p>
            </>}

            {unlocked && !solved && challenge.dial && <>
              <CipherDialControl challenge={challenge} value={dialValues[challenge.id] ?? challenge.dial.initial} onChange={(value) => { setDialValues((current) => ({ ...current, [challenge.id]: value })); setFeedback((current) => { const next = { ...current }; delete next[challenge.id]; return next; }); }} onLock={(answer) => submitAnswer(challenge.id, answer)} />
              {feedback[challenge.id] === "incorrect" && <p className="cipher-feedback error" role="status">{t("密文没有回应。再检查排列、时刻或字母对应；错误不会被记录。")}</p>}
              <details className="cipher-hints"><summary><Lightbulb /> {t("展开提示")}</summary><ol>{challenge.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol></details>
            </>}

            {unlocked && !solved && !challenge.dial && <form className="cipher-answer" onSubmit={(event) => submit(event, challenge.id)}>
              <label htmlFor={`cipher-${challenge.id}`}>{challenge.prompt}</label>
              <div><input id={`cipher-${challenge.id}`} value={answers[challenge.id] ?? ""} maxLength={48} autoComplete="off" onChange={(event) => { setAnswers((current) => ({ ...current, [challenge.id]: event.target.value })); setFeedback((current) => { const next = { ...current }; delete next[challenge.id]; return next; }); }} placeholder={t("在此写下解码结果")} /><button type="submit" disabled={!answers[challenge.id]?.trim()}>{t("核对密文")} <ChevronRight /></button></div>
              {feedback[challenge.id] === "incorrect" && <p className="cipher-feedback error" role="status">{t("密文没有回应。再检查排列、时刻或字母对应；错误不会被记录。")}</p>}
              <details className="cipher-hints"><summary><Lightbulb /> {t("展开提示")}</summary><ol>{challenge.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol></details>
            </form>}

            {solved && <div className="cipher-reveal" aria-live="polite"><span><Check /> {t("密文已归档")}</span><h5>{challenge.revealTitle}</h5><p>{challenge.revealText}</p><small>{t("答案已保存在本机")}</small></div>}
          </div>
        </article>;
      })}
    </div>
    {coreCompleted && !relaySolved && <aside className="cipher-relay" aria-labelledby={`relay-${desk.relay.id}`}>
      <header><Cable /><div><small>{desk.relay.archiveLabel}</small><h4 id={`relay-${desk.relay.id}`}>{desk.relay.title}</h4><p>{desk.relay.description}</p></div></header>
      <p className="cipher-relay-instruction">{desk.relay.instruction}</p>
      <div className="cipher-relay-palette" aria-label={t("待接线碎片")}>
        {desk.relay.fragments.map((fragment) => <button type="button" disabled={relaySequence.includes(fragment.id)} onClick={() => addRelayFragment(fragment.id)} key={fragment.id}><b>{fragment.label}</b><span>{fragment.note}</span><ChevronRight /></button>)}
      </div>
      <ol className="cipher-relay-sequence" aria-label={t("当前接线顺序")}>
        {desk.relay.fragments.map((_, index) => {
          const fragmentId = relaySequence[index];
          const fragment = desk.relay.fragments.find((item) => item.id === fragmentId);
          return <li className={fragment ? "filled" : ""} key={index}><span>{index + 1}</span>{fragment ? <button type="button" aria-label={`${t("撤回碎片")} ${fragment.label}`} onClick={() => removeRelayFragment(fragment.id)}><b>{fragment.label}</b><small>{fragment.note}</small><X /></button> : <div><b>{t("等待碎片")}</b><small>{t("从上方选择一份解密答案")}</small></div>}</li>;
        })}
      </ol>
      {relayFeedback[desk.relay.id] === "incorrect" && <p className="cipher-relay-feedback" role="status">{t("接线顺序没有形成完整信号。可以撤回任意碎片再重新排列；错误不会被记录。")}</p>}
      <div className="cipher-relay-actions"><button type="button" onClick={resetRelay} disabled={!relaySequence.length}><RotateCcw /> {t("重置接线")}</button><button type="button" className="primary" onClick={submitRelay} disabled={relaySequence.length !== desk.relay.fragments.length}><Cable /> {t("发送最终信号")}</button></div>
      <details className="cipher-hints cipher-relay-hints"><summary><Lightbulb /> {t("展开接线提示")}</summary><ol>{desk.relay.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol></details>
    </aside>}
    {completed && <aside className="cipher-completion" aria-live="polite"><RadioTower /><div><small>{desk.completionLabel}</small><h4>{desk.completionTitle}</h4><p>{desk.completionText}</p></div><span><Check /> {t("完整归档")}</span></aside>}
    <footer>{t("密文只展开补充旁注，不增加奖励、不替代联合推理，也不改变任何结局资格。")}</footer>
  </section>;
}
