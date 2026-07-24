"use client";

import { useEffect, useRef } from "react";
import { useAmbientHardwareStore } from "@/src/stores/ambient-hardware-store";
import { useGameStore } from "@/src/stores/game-store";

export function AmbientHardwareCoordinator() {
  const enabled = useAmbientHardwareStore((state) => state.enabled);
  const checkBridge = useAmbientHardwareStore((state) => state.checkBridge);
  const emitCue = useAmbientHardwareStore((state) => state.emitCue);
  const phase = useGameStore((state) => state.phase);
  const campaignId = useGameStore((state) => state.campaignId);
  const chapter = useGameStore((state) => state.chapter);
  const activeSession = useGameStore((state) => state.activeSleepSession);
  const lastSession = useGameStore((state) => state.lastSleepSession);
  const wakeEchoId = activeSession?.wakeEcho?.echoId;
  const checked = useRef(false);

  useEffect(() => {
    if (!enabled || checked.current) return;
    checked.current = true;
    void checkBridge();
  }, [checkBridge, enabled]);

  useEffect(() => {
    if (!enabled || phase !== "night" || !activeSession) return;
    void emitCue(
      "night.started",
      `${campaignId}:${chapter}:${activeSession.id}:night.started`,
    );
  }, [activeSession, campaignId, chapter, emitCue, enabled, phase]);

  useEffect(() => {
    if (!enabled || phase !== "night" || !activeSession || !wakeEchoId) return;
    void emitCue(
      "wake.echo",
      `${campaignId}:${chapter}:${activeSession.id}:wake.echo:${wakeEchoId}`,
    );
  }, [activeSession, campaignId, chapter, emitCue, enabled, phase, wakeEchoId]);

  useEffect(() => {
    if (!enabled || phase !== "morning" || !lastSession) return;
    void emitCue(
      "morning.arrived",
      `${campaignId}:${chapter}:${lastSession.id}:morning.arrived`,
    );
  }, [campaignId, chapter, emitCue, enabled, lastSession, phase]);

  return null;
}
