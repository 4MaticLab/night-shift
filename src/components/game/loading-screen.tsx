"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AppLocale } from "@/src/i18n/core";
import { useI18n } from "@/src/i18n/provider";

type BootPhase = "starting" | "assets" | "ready";

const bootCopy = {
  "zh-CN": {
    eyebrow: "NIGHT SHIFT · 事务所值更",
    title: "夜班事务所正在亮灯",
    starting: "正在唤醒本地档案…",
    assets: "正在展开案件与城市主视觉…",
    ready: "门已经开了。",
    note: "所有存档仍只保存在这台设备上",
  },
  en: {
    eyebrow: "NIGHT SHIFT · AGENCY WATCH",
    title: "The night agency is turning on its lights",
    starting: "Waking the local archive…",
    assets: "Opening the case file and city view…",
    ready: "The door is open.",
    note: "Your save remains on this device",
  },
} satisfies Record<AppLocale, Record<"eyebrow" | "title" | "starting" | "assets" | "ready" | "note", string>>;

function waitForWindowLoad() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
}

export function LoadingScreenFrame({
  locale = "zh-CN",
  phase = "starting",
  leaving = false,
}: {
  locale?: AppLocale;
  phase?: BootPhase;
  leaving?: boolean;
}) {
  const copy = bootCopy[locale];
  return (
    <div className={`app-boot-screen phase-${phase} ${leaving ? "is-leaving" : ""}`} role="status" aria-live="polite" aria-label={copy[phase]}>
      <div className="app-boot-grain" aria-hidden="true" />
      <header className="app-boot-brand">
        <span aria-hidden="true" />
        <div><b>{locale === "en" ? "Night Shift Detective" : "夜班侦探"}</b><small>NIGHT SHIFT</small></div>
      </header>
      <main className="app-boot-centre">
        <p>{copy.eyebrow}</p>
        <div className="app-boot-signal" aria-hidden="true"><i /><span><b /></span><i /></div>
        <h1>{copy.title}</h1>
        <div className="app-boot-progress" aria-hidden="true"><span /></div>
        <b>{copy[phase]}</b>
      </main>
      <footer><span>00:43</span><i />{copy.note}</footer>
    </div>
  );
}

export function AppBootBoundary({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<BootPhase>("assets");

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    const timers = new Set<number>();
    const startedAt = performance.now();
    document.body.classList.add("app-is-booting");

    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay);
      timers.add(timer);
      return timer;
    };
    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      const minimumDelay = Math.max(0, 700 - (performance.now() - startedAt));
      later(() => {
        if (cancelled) return;
        setPhase("ready");
        later(() => {
          if (cancelled) return;
          setLeaving(true);
          later(() => {
            if (cancelled) return;
            setVisible(false);
            document.body.classList.remove("app-is-booting");
          }, 420);
        }, 180);
      }, minimumDelay);
    };

    const fontReady = document.fonts?.ready ?? Promise.resolve();
    void Promise.allSettled([waitForWindowLoad(), fontReady]).then(finish);
    later(finish, 7000);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      document.body.classList.remove("app-is-booting");
    };
  }, []);

  return (
    <>
      <div className="app-boot-content" aria-busy={visible} inert={visible ? true : undefined}>{children}</div>
      {visible && <LoadingScreenFrame locale={locale} phase={phase} leaving={leaving} />}
    </>
  );
}

export function GameSectionLoading() {
  const { t } = useI18n();
  return <main className="game-section-loading" role="status"><span /><small>LOCAL ARCHIVE</small><b>{t("正在展开下一页…")}</b></main>;
}
