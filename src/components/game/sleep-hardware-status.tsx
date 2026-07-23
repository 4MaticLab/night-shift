"use client";

import { Activity, ChevronRight, Radio, Watch } from "lucide-react";
import { getSleepBridge, getVirtualSleepDevice } from "@/src/content/sleep-devices";
import { useSleepHardwareStore } from "@/src/stores/sleep-hardware-store";
import { useI18n } from "@/src/i18n/provider";

export function SleepHardwareStatus({ onOpen, label = true }: { onOpen: () => void; label?: boolean }) {
  const { localize, t } = useI18n();
  const { mode, selectedDeviceId, selectedBridgeId, consent, activeCapture } = useSleepHardwareStore();
  const device = localize(getVirtualSleepDevice(selectedDeviceId));
  const bridge = localize(getSleepBridge(selectedBridgeId));
  const connected = mode === "virtual" && consent?.sourceId === selectedDeviceId;
  const status = activeCapture
    ? t("采集中")
    : connected
      ? device?.name
      : mode === "bridge"
        ? `${bridge?.name} · ${t("预演")}`
        : t("睡眠硬件");
  return (
    <button type="button" className={`sleep-hardware-status ${connected ? "connected" : ""} ${activeCapture ? "recording" : ""}`} onClick={onOpen} aria-label={`${t("打开睡眠硬件中心，当前")}${status}`}>
      {activeCapture ? <Activity /> : connected ? <Radio /> : <Watch />}
      {label && <>
        <span className="sleep-hardware-status-copy"><small>{activeCapture ? "SIGNAL LIVE" : connected ? "LOCAL DEVICE" : "SLEEP LINK"}</small><b>{status}</b></span>
        <span className="sleep-hardware-mobile-label">{activeCapture ? t("记录中") : connected ? t("设备已接") : t("睡眠设备")}</span>
      </>}
      <ChevronRight />
    </button>
  );
}
