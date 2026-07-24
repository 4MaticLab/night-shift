"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleOff,
  Download,
  ExternalLink,
  Lightbulb,
  Power,
  RefreshCw,
  Router,
  ShieldCheck,
  Thermometer,
  Wifi,
} from "lucide-react";
import { ambientCueLabels, type AmbientCue } from "@/src/lib/ambient-hardware/types";
import { useAmbientHardwareStore } from "@/src/stores/ambient-hardware-store";
import { useI18n } from "@/src/i18n/provider";

const cueIds = ["night.started", "wake.echo", "morning.arrived"] as const satisfies AmbientCue[];
const connectorDownloadUrl = process.env.NEXT_PUBLIC_CONNECTOR_DOWNLOAD_URL
  || "https://github.com/4MaticLab/night-shift/releases";
const connectorSettingsUrl = "http://127.0.0.1:43118";

export function AmbientHardwareWorkbench() {
  const {
    enabled,
    connection,
    bridgeStatus,
    entities,
    bindings,
    lastError,
    setEnabled,
    checkBridge,
    pair,
    setBinding,
    testEntity,
    restore,
  } = useAmbientHardwareStore();
  const { locale, t } = useI18n();
  const [pairCode, setPairCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const controllableEntities = useMemo(
    () => Object.values(entities).filter((entity) => entity.controllable),
    [entities],
  );
  const sensorEntities = useMemo(
    () => Object.values(entities).filter((entity) => !entity.controllable).slice(0, 6),
    [entities],
  );

  useEffect(() => {
    if (connection === "idle") void checkBridge();
  }, [checkBridge, connection]);

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  if (connection === "idle" || connection === "checking") {
    return (
      <section className="ambient-workbench ambient-loading">
        <RefreshCw className="ambient-spin" />
        <div><small>LOCAL BRIDGE CHECK</small><h3>{t("正在寻找 Night Shift 本地桥")}</h3></div>
      </section>
    );
  }

  if (connection === "unavailable") {
    return (
      <section className="ambient-workbench">
        <header className="ambient-heading">
          <div><small>HOME ASSISTANT · LOCAL BRIDGE</small><h3>{t("让房间跟夜班一起呼吸")}</h3></div>
          <span className="ambient-status offline"><CircleOff /> {t("本地桥未运行")}</span>
        </header>
        <article className="ambient-setup-card">
          <Router />
          <div>
            <b>{t("安装并打开 Night Shift Connector")}</b>
            <p>{t("Chrome 会在连接本机 Connector 时询问“本地网络访问”；允许后，本页才能看到它。Home Assistant 令牌不会进入网页或存档。")}</p>
            <div className="ambient-setup-actions">
              <a href={connectorDownloadUrl} target="_blank" rel="noreferrer">
                <Download /> {t("下载 Connector")}
              </a>
              <a href={connectorSettingsUrl} target="_blank" rel="noreferrer">
                <ExternalLink /> {t("打开本机设置页")}
              </a>
            </div>
            <small>{t("Developer Preview · Chrome 142+ · macOS / Windows / Linux")}</small>
          </div>
        </article>
        {lastError && <p className="ambient-error">{lastError}</p>}
        <button type="button" className="ambient-primary" onClick={() => void run("retry", checkBridge)} disabled={busy === "retry"}>
          <RefreshCw /> {t("重新寻找本地桥")}
        </button>
      </section>
    );
  }

  if (connection === "unpaired") {
    return (
      <section className="ambient-workbench">
        <header className="ambient-heading">
          <div><small>STEP 01 · LOCAL PAIRING</small><h3>{t("本地桥已经找到")}</h3></div>
          <span className="ambient-status waiting"><Wifi /> {t("等待配对")}</span>
        </header>
        <article className="ambient-pair-card">
          <ShieldCheck />
          <div>
            <b>{t("输入 Connector 设置页显示的六位配对码")}</b>
            <p>{t("配对只授权当前浏览器控制你随后明确选择的安全实体。")}</p>
            <form onSubmit={(event) => {
              event.preventDefault();
              if (pairCode.length !== 6) return;
              void run("pair", async () => {
                if (await pair(pairCode)) setPairCode("");
              });
            }}>
              <input
                value={pairCode}
                onChange={(event) => setPairCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={t("六位配对码")}
                placeholder="000000"
              />
              <button type="submit" disabled={pairCode.length !== 6 || busy === "pair"}>
                <ShieldCheck /> {t("配对本地桥")}
              </button>
            </form>
          </div>
        </article>
        {lastError && <p className="ambient-error">{lastError}</p>}
      </section>
    );
  }

  const online = connection === "online";
  return (
    <section className="ambient-workbench">
      <header className="ambient-heading">
        <div>
          <small>HOME ASSISTANT · ROOM SIGNALS</small>
          <h3>{online ? t("房间外设已经接入") : t("本地桥已配对，Home Assistant 尚未就绪")}</h3>
        </div>
        <span className={`ambient-status ${online ? "online" : "offline"}`}>
          {online ? <Wifi /> : <CircleOff />}
          {online ? t("本地在线") : connection === "auth-error" ? t("令牌失效") : t("连接中断")}
        </span>
      </header>

      <aside className="ambient-connection-card">
        <Router />
        <div>
          <small>{bridgeStatus?.instanceName ?? "HOME ASSISTANT"}</small>
          <b>{online
            ? locale === "en"
              ? `${controllableEntities.length} safe controls available`
              : `发现 ${controllableEntities.length} 个可安全控制的实体`
            : t("游戏会继续运行，不会等待外设恢复")}</b>
          <p>{t("门锁、车库、安防、摄像头、脚本和未选择实体始终不会被调用。")}</p>
        </div>
        <button type="button" onClick={() => void run("refresh", checkBridge)} disabled={busy === "refresh"}>
          <RefreshCw /> {t("刷新")}
        </button>
      </aside>

      {!online && lastError && <p className="ambient-error">{lastError}</p>}

      {online && (
        <>
          <div className="ambient-cue-list">
            {cueIds.map((cue) => {
              const label = ambientCueLabels[cue];
              const selectedId = bindings[cue] ?? "";
              return (
                <article key={cue}>
                  <span><Lightbulb /></span>
                  <div>
                    <small>{cue.toUpperCase()}</small>
                    <b>{t(label.title)}</b>
                    <p>{t(label.note)}</p>
                    <select
                      value={selectedId}
                      aria-label={`${t(label.title)} ${t("绑定实体")}`}
                      onChange={(event) => void run(`bind:${cue}`, () => setBinding(cue, event.target.value || null))}
                    >
                      <option value="">{t("不联动")}</option>
                      {controllableEntities.map((entity) => (
                        <option key={entity.id} value={entity.id} disabled={!entity.available}>
                          {entity.name} · {entity.domain}{entity.available ? "" : ` · ${t("离线")}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={!selectedId || busy === `test:${cue}`}
                    onClick={() => selectedId && void run(`test:${cue}`, () => testEntity(selectedId))}
                  >
                    <Power /> {t("试运行")}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="ambient-consent">
            <ShieldCheck />
            <div>
              <b>{t("仅发送三个语义事件")}</b>
              <p>{t("Night Shift 不发送任意 Home Assistant service；重复事件会在本地桥幂等去重。")}</p>
            </div>
            <button type="button" aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>
              <span className={enabled ? "checked" : ""}>{enabled && <Check />}</span>
              {enabled ? t("夜班联动已开启") : t("开启夜班联动")}
            </button>
          </div>

          {sensorEntities.length > 0 && (
            <aside className="ambient-sensors">
              <header><Thermometer /><div><small>READ ONLY · ROOM NOTES</small><b>{t("只读环境摘要")}</b></div></header>
              <div>{sensorEntities.map((entity) => (
                <span key={entity.id}>
                  <small>{entity.name}</small>
                  <b>{entity.state}{entity.attributes.unit ? ` ${entity.attributes.unit}` : ""}</b>
                </span>
              ))}</div>
            </aside>
          )}

          <button type="button" className="ambient-restore" onClick={() => void run("restore", restore)} disabled={busy === "restore"}>
            <RefreshCw /> {t("恢复本次联动前的设备状态")}
          </button>
          {lastError && <p className="ambient-error">{lastError}</p>}
        </>
      )}
    </section>
  );
}
