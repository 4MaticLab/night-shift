"use client";

import { AnimatePresence } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AmbientHardwareCoordinator } from "@/src/components/game/ambient-hardware-coordinator";
import { ClueGiftNotice, type ClueGiftNoticeData } from "@/src/components/game/clue-sharing";
import { AppBootBoundary } from "@/src/components/game/loading-screen";
import { DemoDrawer } from "@/src/components/game/shell";
import type { GameView } from "@/src/components/game/types";
import { I18nProvider, useI18n } from "@/src/i18n/provider";
import { readSharedClueQuery } from "@/src/lib/game-engine/clue-sharing";
import {
  CASE_LIBRARY_PATH,
  GAME_VIEW_PATHS,
  getGameViewPath,
  resolveGamePath,
} from "@/src/lib/game-routes";
import { useGameStore } from "@/src/stores/game-store";

const subscribeToHydration = () => () => undefined;

interface GameAppContextValue {
  hydrated: boolean;
  openHardware: () => void;
  navigate: (href: string, options?: { replace?: boolean; scroll?: boolean }) => void;
  navigateView: (view: GameView, options?: { replace?: boolean; scroll?: boolean }) => void;
}

const GameAppContext = createContext<GameAppContextValue | null>(null);

export function NightShiftRuntime({ children }: { children: ReactNode }) {
  const campaignId = useGameStore((state) => state.campaignId);
  return (
    <I18nProvider campaignId={campaignId}>
      <NightShiftRuntimeContent>{children}</NightShiftRuntimeContent>
    </I18nProvider>
  );
}

function NightShiftRuntimeContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const started = useGameStore((state) => state.started);
  const phase = useGameStore((state) => state.phase);
  const [demoOpen, setDemoOpen] = useState(false);
  const [hardwareOpen, setHardwareOpen] = useState(false);
  const [clueGiftNotice, setClueGiftNotice] = useState<ClueGiftNoticeData | null>(null);
  const [clueIntakeRevision, setClueIntakeRevision] = useState(0);

  const navigate = useCallback((href: string, options?: { replace?: boolean; scroll?: boolean }) => {
    if (href === pathname) {
      window.scrollTo({ top: 0, left: 0 });
      return;
    }
    const navigationOptions = { scroll: options?.scroll ?? true };
    if (options?.replace) router.replace(href, navigationOptions);
    else router.push(href, navigationOptions);
  }, [pathname, router]);

  const navigateView = useCallback((view: GameView, options?: { replace?: boolean; scroll?: boolean }) => {
    navigate(getGameViewPath(view), options);
  }, [navigate]);

  useEffect(() => {
    const toggleDemo = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.key.toLowerCase() !== "d") return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (document.querySelector("[aria-modal='true']:not(.demo-drawer)")) return;
      event.preventDefault();
      setDemoOpen((value) => !value);
    };
    window.addEventListener("keydown", toggleDemo);
    return () => window.removeEventListener("keydown", toggleDemo);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (readSharedClueQuery(window.location.search).present) return;
    const canonicalPath = resolveGamePath({ started, phase }, pathname);
    if (canonicalPath) router.replace(canonicalPath, { scroll: false });
  }, [clueIntakeRevision, hydrated, pathname, phase, router, started]);

  const context = useMemo<GameAppContextValue>(() => ({
    hydrated,
    openHardware: () => setHardwareOpen(true),
    navigate,
    navigateView,
  }), [hydrated, navigate, navigateView]);

  return (
    <GameAppContext.Provider value={context}>
      <AppBootBoundary>
        <AmbientHardwareCoordinator />
        <Suspense fallback={null}>
          <SharedClueIntake
            hydrated={hydrated}
            onNotice={setClueGiftNotice}
            onProcessed={() => setClueIntakeRevision((value) => value + 1)}
          />
        </Suspense>
        {children}
        <AnimatePresence>
          {demoOpen && (
            <DemoDrawer
              onClose={() => setDemoOpen(false)}
              setView={(view) => navigateView(view)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {clueGiftNotice && (
            <ClueGiftNotice notice={clueGiftNotice} onClose={() => setClueGiftNotice(null)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {hardwareOpen && (
            <RuntimeSleepHardwarePanel onClose={() => setHardwareOpen(false)} />
          )}
        </AnimatePresence>
      </AppBootBoundary>
    </GameAppContext.Provider>
  );
}

function SharedClueIntake({
  hydrated,
  onNotice,
  onProcessed,
}: {
  hydrated: boolean;
  onNotice: (notice: ClueGiftNoticeData) => void;
  onProcessed: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { localize, t } = useI18n();
  const switchCampaign = useGameStore((state) => state.switchCampaign);
  const receiveSharedClue = useGameStore((state) => state.receiveSharedClue);
  const processedQuery = useRef<string | null>(null);
  const query = searchParams.toString();

  useEffect(() => {
    if (!hydrated) return;
    const shared = readSharedClueQuery(query ? `?${query}` : "");
    if (!shared.present) {
      processedQuery.current = null;
      return;
    }

    const queryKey = `${pathname}?${query}`;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || processedQuery.current === queryKey) return;
      processedQuery.current = queryKey;

      if (!shared.clue || !shared.campaignId) {
        onNotice({
          kind: "error",
          title: t("这封线索无法归档"),
          message: t("链接中的线索编号不存在或已经失效；你的存档没有发生变化。"),
        });
        router.replace(pathname, { scroll: false });
        onProcessed();
        return;
      }

      switchCampaign(shared.campaignId);
      const result = receiveSharedClue(shared.clue.id);
      const sharedClue = localize(shared.clue);
      const notices: Record<typeof result, ClueGiftNoticeData> = {
        received: {
          kind: "success",
          title: `${t("好友送来")}「${sharedClue.title}」`,
          message: t("证物已经放进案件板，并标记为“好友送达”。"),
        },
        "already-received": {
          kind: "info",
          title: `「${sharedClue.title}」${t("已经收过")}`,
          message: t("案件板保留原来那一张，没有重复写入。"),
        },
        "already-owned": {
          kind: "info",
          title: `${t("你已经找到")}「${sharedClue.title}」`,
          message: t("这封线索没有覆盖你的调查记录，也没有重复写入。"),
        },
        invalid: {
          kind: "error",
          title: t("这封线索无法归档"),
          message: t("链接中的线索编号不存在或已经失效；你的存档没有发生变化。"),
        },
      };
      onNotice(notices[result]);
      router.replace(result === "invalid" ? pathname : GAME_VIEW_PATHS.board, { scroll: false });
      onProcessed();
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, localize, onNotice, onProcessed, pathname, query, receiveSharedClue, router, switchCampaign, t]);

  return null;
}

function RuntimeSleepHardwarePanel({ onClose }: { onClose: () => void }) {
  const [Panel, setPanel] = useState<null | ((props: { onClose: () => void }) => ReactNode)>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/src/components/game/sleep-hardware").then((module) => {
      if (!cancelled) setPanel(() => module.SleepHardwarePanel);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return Panel ? <Panel onClose={onClose} /> : null;
}

export function useGameApp(): GameAppContextValue {
  const context = useContext(GameAppContext);
  if (!context) throw new Error("useGameApp must be used inside NightShiftRuntime");
  return context;
}

export function useOpenCaseLibrary() {
  const { navigate } = useGameApp();
  return useCallback(() => navigate(CASE_LIBRARY_PATH), [navigate]);
}
