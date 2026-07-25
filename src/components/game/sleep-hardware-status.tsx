"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ActivityIcon, type ActivityIconHandle } from "@/src/components/ui/activity";
import { RadioIcon, type RadioIconHandle } from "@/src/components/ui/radio";
import { AlarmClockIcon, type AlarmClockIconHandle } from "@/src/components/ui/alarm-clock";
import { ChevronRightIcon, type ChevronRightIconHandle } from "@/src/components/ui/chevron-right";
import { getSleepBridge, getVirtualSleepDevice } from "@/src/content/sleep-devices";
import { useSleepHardwareStore } from "@/src/stores/sleep-hardware-store";
import { useI18n } from "@/src/i18n/provider";

gsap.registerPlugin(useGSAP);

export function SleepHardwareStatus({ onOpen, label = true }: { onOpen: () => void; label?: boolean }) {
  const { localize, t } = useI18n();
  const { mode, selectedDeviceId, selectedBridgeId, consent, activeCapture } = useSleepHardwareStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const leadIconRef = useRef<ActivityIconHandle | RadioIconHandle | AlarmClockIconHandle>(null);
  const chevronRef = useRef<ChevronRightIconHandle>(null);
  const device = localize(getVirtualSleepDevice(selectedDeviceId));
  const bridge = localize(getSleepBridge(selectedBridgeId));
  const virtualConnected = mode === "virtual" && consent?.sourceKind === "virtual" && consent.sourceId === selectedDeviceId;
  const nativeConnected = mode === "bridge" && consent?.sourceKind === "native" && consent.sourceId === selectedBridgeId;
  const connected = virtualConnected || nativeConnected;
  const status = activeCapture
    ? activeCapture.sourceKind === "native" ? t("等待晨间同步") : t("采集中")
    : virtualConnected
      ? device?.name
      : nativeConnected
        ? `${bridge?.name} · ${t("已连接")}`
        : mode === "bridge"
          ? `${bridge?.name} · ${t("未连接")}`
        : t("睡眠硬件");

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(buttonRef.current, { y: -10, opacity: 0, duration: .6, ease: "power3.out" });
    });
  }, { scope: buttonRef });

  const startIcons = () => {
    leadIconRef.current?.startAnimation();
    chevronRef.current?.startAnimation();
  };
  const stopIcons = () => {
    leadIconRef.current?.stopAnimation();
    chevronRef.current?.stopAnimation();
  };
  const handleEnter = () => {
    startIcons();
    gsap.to(buttonRef.current, { y: -2, duration: .35, ease: "power3.out" });
    gsap.to(".sleep-hardware-status-chevron", { x: 3, opacity: .95, duration: .45, ease: "back.out(2.5)" });
  };
  const handleLeave = () => {
    stopIcons();
    gsap.to(buttonRef.current, { y: 0, scale: 1, duration: .45, ease: "power3.out" });
    gsap.to(".sleep-hardware-status-chevron", { x: 0, opacity: .55, duration: .35, ease: "power3.out" });
  };
  const handleDown = () => {
    gsap.to(buttonRef.current, { scale: .96, duration: .15, ease: "power2.out" });
  };
  const handleUp = () => {
    gsap.to(buttonRef.current, { scale: 1, duration: .55, ease: "elastic.out(1.1, .45)" });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`sleep-hardware-status ${connected ? "connected" : ""} ${activeCapture ? "recording" : ""}`}
      onClick={onOpen}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onFocus={startIcons}
      onBlur={stopIcons}
      aria-label={`${t("打开睡眠硬件中心，当前")}${status}`}
    >
      <span className="sleep-hardware-status-lead" aria-hidden="true">
        {activeCapture
          ? <ActivityIcon ref={leadIconRef} size={16} />
          : connected
            ? <RadioIcon ref={leadIconRef} size={16} />
            : <AlarmClockIcon ref={leadIconRef} size={16} />}
      </span>
      {label && <>
        <span className="sleep-hardware-status-copy"><small>{activeCapture ? "SIGNAL LIVE" : connected ? "LOCAL DEVICE" : "SLEEP LINK"}</small><b>{status}</b></span>
        <span className="sleep-hardware-mobile-label">{activeCapture ? t("记录中") : connected ? t("设备已接") : t("睡眠设备")}</span>
      </>}
      <ChevronRightIcon className="sleep-hardware-status-chevron" ref={chevronRef} size={13} aria-hidden="true" />
    </button>
  );
}
