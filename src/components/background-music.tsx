"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VolumeIcon, type VolumeIconHandle } from "@/src/components/ui/volume";

export const BGM_SOURCE = "/audio/c-minor-nocturne.mp3";
export const BGM_PREFERENCE_KEY = "night-shift-bgm-enabled-v1";
export const BGM_VOLUME = 0.22;

type MusicState = "loading" | "playing" | "blocked" | "paused" | "missing" | "error";

export function readMusicPreference(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(BGM_PREFERENCE_KEY) !== "false";
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const iconRef = useRef<VolumeIconHandle>(null);
  const initialAttemptedRef = useRef(false);
  const [enabled, setEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<MusicState>("loading");

  const attemptPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabled || document.hidden) return false;
    audio.volume = BGM_VOLUME;
    try {
      await audio.play();
      setState("playing");
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") setState("blocked");
      else if (audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) setState("missing");
      else setState("error");
      return false;
    }
  }, [enabled]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const preference = readMusicPreference(window.localStorage);
      setEnabled(preference);
      setHydrated(true);
      if (!preference) setState("paused");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated || !enabled || initialAttemptedRef.current) return;
    initialAttemptedRef.current = true;
    queueMicrotask(() => void attemptPlay());
  }, [attemptPlay, enabled, hydrated]);

  useEffect(() => {
    if (!hydrated || !enabled || state !== "blocked") return;
    const resume = () => void attemptPlay();
    window.addEventListener("pointerdown", resume, { once: true, capture: true });
    window.addEventListener("keydown", resume, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", resume, { capture: true });
      window.removeEventListener("keydown", resume, { capture: true });
    };
  }, [attemptPlay, enabled, hydrated, state]);

  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRef.current;
      if (!audio || !enabled) return;
      if (document.hidden) {
        audio.pause();
        setState("paused");
      } else {
        void attemptPlay();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptPlay, enabled]);

  const toggle = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    window.localStorage.setItem(BGM_PREFERENCE_KEY, String(nextEnabled));
    if (nextEnabled) {
      initialAttemptedRef.current = true;
      setState("loading");
      const audio = audioRef.current;
      if (audio) {
        audio.volume = BGM_VOLUME;
        void audio.play().then(() => setState("playing")).catch((error) => {
          if (error instanceof DOMException && error.name === "NotAllowedError") setState("blocked");
          else if (audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) setState("missing");
          else setState("error");
        });
      }
    } else {
      audioRef.current?.pause();
      setState("paused");
    }
  };

  const label = getMusicLabel(enabled, state);
  useEffect(() => {
    if (enabled) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [enabled]);
  return <div className={`background-music-control state-${state}${enabled ? " enabled" : " disabled"}`}>
    <audio
      ref={audioRef}
      src={BGM_SOURCE}
      loop
      preload="auto"
      onCanPlay={() => { if (hydrated && enabled && state !== "playing") void attemptPlay(); }}
      onPlay={() => setState("playing")}
      onPause={() => { if (enabled && !document.hidden && state === "playing") setState("paused"); }}
      onError={() => setState(audioRef.current?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ? "missing" : "error")}
    />
    <button type="button" aria-label={label} aria-pressed={!enabled} onClick={toggle}>
      <span className="background-music-icon" aria-hidden="true">
        <VolumeIcon ref={iconRef} size={28} />
      </span>
    </button>
  </div>;
}

function getMusicLabel(enabled: boolean, state: MusicState) {
  if (!enabled) return "开启背景音乐";
  if (state === "missing") return "背景音乐文件尚未上传，点击关闭自动播放";
  if (state === "error") return "背景音乐暂时无法播放，点击关闭";
  if (state === "blocked") return "背景音乐等待首次交互，点击关闭";
  return "关闭背景音乐";
}
