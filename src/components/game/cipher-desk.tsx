"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, ChevronRight, KeyRound, Lightbulb, LockKeyhole } from "lucide-react";
import { getCampaignCipherChallenges, isCipherUnlocked } from "@/src/content/ciphers";
import { useI18n } from "@/src/i18n/provider";
import { useGameStore } from "@/src/stores/game-store";

export function CipherDesk() {
  const { campaign, locale, localize, t } = useI18n();
  const { unlockedClueIds, solvedCipherIds, solveCipher } = useGameStore();
  const challenges = useMemo(() => getCampaignCipherChallenges(campaign.id).map((challenge) => localize(challenge)), [campaign.id, localize]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, "incorrect" | "solved">>({});

  if (!challenges.length) return null;

  const solvedCount = challenges.filter((challenge) => solvedCipherIds.includes(challenge.id)).length;
  const unlockedCount = challenges.filter((challenge) => isCipherUnlocked(challenge, unlockedClueIds)).length;

  const submit = (event: FormEvent<HTMLFormElement>, challengeId: string) => {
    event.preventDefault();
    const result = solveCipher(challengeId, answers[challengeId] ?? "");
    if (result === "solved" || result === "already-solved") {
      setFeedback((current) => ({ ...current, [challengeId]: "solved" }));
      return;
    }
    if (result === "incorrect") setFeedback((current) => ({ ...current, [challengeId]: "incorrect" }));
  };

  return <section className="cipher-desk" aria-labelledby="cipher-desk-title">
    <header className="cipher-desk-heading">
      <div><small>NIGHT CIPHER DESK · {t("夜班密文台")}</small><h3 id="cipher-desk-title">{t("城市把不能公开说的话，折进了票孔、花单和时刻表。")}</h3><p>{t("证物归档后，密文会逐段显影。答错不会扣除任何东西，提示也不影响结果。")}</p></div>
      <span><b>{solvedCount}/{challenges.length}</b><small>{t("已解密")}</small></span>
    </header>

    <div className="cipher-progress" aria-label={locale === "en" ? `${unlockedCount} cipher levels available` : `${unlockedCount} 个密文关卡已开放`}>
      {challenges.map((challenge) => {
        const unlocked = isCipherUnlocked(challenge, unlockedClueIds);
        const solved = solvedCipherIds.includes(challenge.id);
        return <i className={solved ? "solved" : unlocked ? "unlocked" : "locked"} key={challenge.id}><span>{challenge.order}</span></i>;
      })}
    </div>

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

            {unlocked && !solved && <form className="cipher-answer" onSubmit={(event) => submit(event, challenge.id)}>
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
    <footer>{t("密文只展开补充旁注，不增加奖励、不替代联合推理，也不改变任何结局资格。")}</footer>
  </section>;
}
