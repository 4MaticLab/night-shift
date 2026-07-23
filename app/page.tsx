"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import { Hero, Intro } from "@/src/components/game/landing";
import { BLACKWATER_CREEK_CAMPAIGN_ID, DEFAULT_CAMPAIGN_ID, getCampaign } from "@/src/content/campaigns/registry";
import { SandboxCase } from "@/src/components/game/sandbox-case";
import { SleepHardwarePanel } from "@/src/components/game/sleep-hardware";
import { I18nProvider, useI18n } from "@/src/i18n/provider";
import type { CampaignStoryline } from "@/src/content/campaigns/types";
import { CityChronicle } from "@/src/components/game/city-story-map";
import { useWorldStore } from "@/src/stores/world-store";

const subscribeToHydration = () => () => undefined;

export default function HomePage() {
  const campaignId = useWorldStore((state) => state.campaignId);
  return <I18nProvider campaignId={campaignId}><GamePage /></I18nProvider>;
}

function GamePage() {
  const world = useWorldStore();
  const { campaign, preferredLocale, t } = useI18n();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [intro, setIntro] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [hardwareOpen, setHardwareOpen] = useState(false);
  const [activeStoryline, setActiveStoryline] = useState<CampaignStoryline | null>(null);
  const sandboxContent = campaign.format === "sandbox-expedition" ? campaign.sandbox : undefined;
  const cityChronicle = campaign.id === DEFAULT_CAMPAIGN_ID && (campaign.storylines?.length ?? 0) > 0;
  const hardwarePanel = <AnimatePresence>{hardwareOpen && <SleepHardwarePanel onClose={() => setHardwareOpen(false)} />}</AnimatePresence>;

  if (libraryOpen || (!world.started && !intro)) {
    return <Hero interactive={hydrated} onStart={() => {
      if (world.started || sandboxContent) {
        if (!world.started) world.begin();
        setLibraryOpen(false);
        setIntro(false);
      } else {
        setIntro(true);
      }
    }} onDemo={() => {
      world.begin();
      setLibraryOpen(false);
      setIntro(false);
    }} />;
  }
  if (activeStoryline) {
    const chineseOnly = preferredLocale === "en" && activeStoryline.locale === "zh-CN" && activeStoryline.role === "side";
    const rawStoryline = chineseOnly
      ? getCampaign(campaign.id).storylines?.find((storyline) => storyline.id === activeStoryline.id)
      : activeStoryline;
    const storylineCase = <SandboxCase campaignId={`${campaign.id}:${activeStoryline.id}`} content={rawStoryline!.content} onHome={() => setActiveStoryline(null)} onHardware={() => setHardwareOpen(true)} homeLabel={chineseOnly ? "返回城市地图" : t("返回城市地图")} />;
    return <>{chineseOnly ? <I18nProvider campaignId={BLACKWATER_CREEK_CAMPAIGN_ID}>{storylineCase}</I18nProvider> : storylineCase}{hardwarePanel}</>;
  }
  if (sandboxContent) return <><SandboxCase campaignId={campaign.id} content={sandboxContent} onHome={() => { setLibraryOpen(true); setIntro(false); }} onHardware={() => setHardwareOpen(true)} />{hardwarePanel}</>;
  if (intro && !world.started) return <Intro onDone={() => { world.begin(); setIntro(false); }} />;
  if (cityChronicle) return <><CityChronicle onOpenStoryline={setActiveStoryline} onHome={() => { setLibraryOpen(true); setIntro(false); }} onHardware={() => setHardwareOpen(true)} />{hardwarePanel}</>;
  return null;
}
